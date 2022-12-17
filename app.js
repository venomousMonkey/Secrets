//require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const { setTheUsername } = require('whatwg-url');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

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
    password: String
});

userSchema.plugin(passportLocalMongoose);

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); 

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render('home');
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

