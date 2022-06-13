const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');
const bcrypt = require("bcrypt");
const passport = require("passport");
const GitHubStrategy=require("passport-github").Strategy;
module.exports = function (app, myDataBase) {

//#3 serialization of users using the user id from the database
passport.serializeUser((user,done)=>{
    done(null,user._id);
  })
  passport.deserializeUser((id,done)=>{
    myDataBase.findOne({_id:new ObjectID(id)},(err,doc)=>{
      done(null,doc)
    })
  });
  
  passport.use(new GitHubStrategy({clientID:process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET,
    callbackURL:"https://advancenode.azurewebsites.net/auth/github/callback"},
  (accessToken, refreshToken, profile, cb)=>{
    console.log(profile);
  }))
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
}