'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session =require("express-session");
const passport = require("passport");
const ObjectID = require('mongodb').ObjectID;
const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//#1 use the pug engine and render the index pug file on the root get requests 
app.set("view engine","pug");
app.route('/').get((req, res) => {
  console.log("loading new page")
  res.render("pug/index",{title:"Hello", message:"Please login"});
});
//#2 use express session and passport to handle login and sessions
app.use(session({secret:process.env.SESSION_SECRET,resave:true,saveUninitialized:true,cookie:{secure:false}}));
app.use(passport.initialize());
app.use(passport.session());
//#3 serialization of users using the user id from the database
passport.serializeUser((user,done)=>{
  done(null,user._id);
})
passport.deserializeUser((id,done)=>{
  done(null,null)
  // myDataBase.findOne({_id:new ObjectID(id)},(err,doc)=>{
  // })
})
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
