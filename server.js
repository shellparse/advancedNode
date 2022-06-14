'use strict';
const routes = require('./routes.js');
const auth = require("./auth");
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session =require("express-session");
const passport = require("passport");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const passportSocketIo=require("passport.socketio");
const MongoStore=require("connect-mongo");
const URI = process.env.MONGO_URI;
const store =  MongoStore.create({ mongoUrl: URI });

const cookieParser=require("cookie-parser");
function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}
fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//#1 use the pug engine and render the index pug file on the root get requests 
app.set("view engine","pug");
//#2 use express session and passport to handle login and sessions
app.use(session({secret:process.env.SESSION_SECRET,resave:true,saveUninitialized:true,store:store,cookie:{secure:false},key:'express.sid'}));

app.use(passport.initialize());
app.use(passport.session());

myDB(async(client)=>{
  const myDataBase = await client.db("test").collection("users");
  app.route('/').get((req, res) => {
    res.render("pug/index",{title:"Connected to database", message:"Please login",showLogin: true ,showRegistration:true,showSocialAuth:true});
  });
  routes(app, myDataBase);
  auth(app,myDataBase);
  io.use(
    passportSocketIo.authorize({
      cookieParser: cookieParser,
      key: 'express.sid',
      secret: process.env.SESSION_SECRET,
      store: store,
      success: onAuthorizeSuccess,
      fail: onAuthorizeFail
    })
  );
  io.on('connection', socket => {
    console.log('user ' + socket.request.user.name + ' connected');
    currentUsers++;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });
    socket.on("chat message",(message)=>{
      io.emit("chat message",message)
    })    
    socket.on('disconnect', () => {
      /*anything you want to do on disconnect*/
      currentUsers--
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: true
      });
    });
  });
    // the common way of handling page not found 
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found 404 -_-');
    });
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug/index', { title: e, message: 'Unable to login' });
  });
});
const PORT = process.env.PORT || 3000;
let currentUsers = 0;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
