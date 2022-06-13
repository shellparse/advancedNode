const passport = require("passport");

module.exports = function (app, myDataBase) {

      //#8 signup new user
  app.route("/register").post(async(req,res,next)=>{
    let hash = bcrypt.hashSync(req.body.password,12);
    myDataBase.findOne({username:req.body.username},(err,doc)=>{
      if (err){
        next(err);
      }else if(doc){
        res.redirect("/");
      }else{
        myDataBase.insertOne({username:req.body.username,password:hash},(err,doc)=>{
          if(err){
            res.redirect("/");
          }else{
            console.log(doc)
            next(null,doc)
          }
        }
       )
      }
    })
  },passport.authenticate('local',{failureRedirect:"/"}),(req,res,next)=>{
    res.redirect("/profile")
    })
    //#5 setting up log in form post router
  app.post("/login",passport.authenticate("local",{ failureRedirect: '/' }),(req,res)=>{
    res.redirect("pug/profile",{username:req.user.username});
    });
  
  app.get("/profile",ensureAuthenticated,(req,res)=>{
      res.render("pug/profile")
      })
      //#7 logging out the user 
  app.get("/logout",(req,res)=>{
        req.logout((err)=>err?next(err):console.log("hello world"));
        res.redirect("/")
    })

  function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
          return next();
        }
        res.redirect('/');
  };

  app.route('/auth/github')
          .get(passport.authenticate('github'));
          
          app.route('/auth/github/callback')
          .get(passport.authenticate('github', { failureRedirect: '/' }), (req,res) => {
              req.session.user_id = req.user.id
              res.redirect('/chat');
          });
  app.route("/chat").get(ensureAuthenticated,(req,res)=>{
    res.render("pug/chat",{user:req.user})
  })
}