'use strict';
const routes = require('./routes.js');
const auth = require("./auth");
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session =require("express-session");
const passport = require("passport");
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const app = express();
const bcrypt = require("bcrypt");

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//#1 use the pug engine and render the index pug file on the root get requests 
app.set("view engine","pug");
//#2 use express session and passport to handle login and sessions
app.use(session({secret:process.env.SESSION_SECRET,resave:true,saveUninitialized:true,cookie:{secure:false}}));
app.use(passport.initialize());
app.use(passport.session());

myDB(async(client)=>{
  const myDataBase = await client.db("test").collection("users");
  app.route('/').get((req, res) => {
    res.render("pug/index",{title:"Connected to database", message:"Please login",showLogin: true ,showRegistration:true});
  });
    
    // the commont way of handling page not found 
    app.use((req, res, next) => {
      res.status(404)
        .type('text')
        .send('Not Found 404 -_-');
    });

//#3 serialization of users using the user id from the database
passport.serializeUser((user,done)=>{
  done(null,user._id);
})
passport.deserializeUser((id,done)=>{
  myDataBase.findOne({_id:new ObjectID(id)},(err,doc)=>{
    done(null,doc)
  })
});
  //#4 using passport middleware passport-local
passport.use(new LocalStrategy(
  function(username, password, done) {
    myDataBase.findOne({ username: username }, function (err, user) {
      console.log('User '+ username +' attempted to log in.');
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
      return done(null, user);
    });
  }
));


}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug/index', { title: e, message: 'Unable to login' });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
