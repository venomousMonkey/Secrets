//require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const { setTheUsername } = require('whatwg-url');
//removing moongoose encryption as I'll switch to password hashing using md5
//const encrypt = require('mongoose-encryption');   
//swapping md5 for bcrypt
//const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema ({
    email: String, 
    password: String
});

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render('home');
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.get("/register", (req, res) => {
    res.render('register');
});

app.post('/register', (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUser = new User({
        email: req.body.username, 
        password: hash
    });
    newUser.save((err) => {
        if (err) {
            console.log(err)
        } else {
            res.render('secrets');
        }
    });
});
});

app.post('/login', (req, res) => {
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({email: userName }, (err, foundUser) => {
        if (err) {
            console.log(err); 
        } else {
  //          if (foundUser.password === password) { sintead using bCrypt
              if (foundUser) { 
                    bcrypt.compare(password, foundUser.password, (err, result) => {
                        if (result === true) {
                            res.render('secrets'); 
                        } else console.log('Wrong password.');
                    });      
                } 
        }
    })

});

app.listen(3000, () => {
    console.log("Server started at port 3000.")
});

