require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const { setTheUsername } = require('whatwg-url');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

//removing moongoose encryption as I'll switch to password hashing using md5
//const encrypt = require('mongoose-encryption');   
//swapping md5 for bcrypt
//const md5 = require('md5');

//now removing bcrypt encryption as I'll implement passport features
//const bcrypt = require('bcrypt');
//const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "This is the secret.", 
    resave: false, 
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/userDB');


const userSchema = new mongoose.Schema ({
    email: String, 
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); 

// Will use more global way of persisting user information in the login session. One below is for passport-local-mongoose
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

//adding oauth2.0 google passport authentication 

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render('home');
});


//When I wrap passport.authenticate within callback function it requires next parameter as input and returing at the end. TBD what for. 
app.get("/auth/google", (req, res, next) => {
    passport.authenticate('google', { scope: ['profile'] })(req,res,next)
});

//This is simpler implementation based on passport doc
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render('secrets'); 
    } else {
        res.redirect('/login');
    }
});

app.get("/submit", (req, res) => {
  res.render('submit');
});

app.get("/logout", (req,res) => {
    req.logout((err) => {
        if (err) { return next(err); };
        res.redirect('/');
})
});

app.post('/register', (req, res) => {

//removing bcrypt in favor of passport
//     bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
//     const newUser = new User({
//         email: req.body.username, 
//         password: hash
//     });
//     newUser.save((err) => {
//         if (err) {
//             console.log(err)
//         } else {
//             res.render('secrets');
//         }
//     });
// });

User.register({username: req.body.username}, req.body.password, (err, user) => {
    if (err) {
        console.log(err);
        res.redirect('/register');
    } else {
        passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        })
    }
})
});

app.post('/login', (req, res) => {

//removing bcrypt in favor of passport
//     const userName = req.body.username;
//     const password = req.body.password;

//     User.findOne({email: userName }, (err, foundUser) => {
//         if (err) {
//             console.log(err); 
//         } else {
//   //          if (foundUser.password === password) { sintead using bCrypt
//               if (foundUser) { 
//                     bcrypt.compare(password, foundUser.password, (err, result) => {
//                         if (result === true) {
//                             res.render('secrets'); 
//                         } else console.log('Wrong password.');
//                     });      
//                 } 
//         }
//     })

const user = new User({
    username: req.body.username,
    password: req.body.password
});

req.login(user, (err) => {
    if (err) {
        console.log(err); 
    } else {
        passport.authenticate('local')(req, res, () => {
            res.redirect('/secrets');
        })
    }
});


});

app.listen(3000, () => {
    console.log("Server started at port 3000.")
});

