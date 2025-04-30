const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const crypto = require('crypto');
const app = express();
require('dotenv').config();

const secretKey = crypto.randomBytes(64).toString('hex'); 

app.use(express.static("public"));
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

const userSchema = new mongoose.Schema({

    googleId: String
});

userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

passport.use(new GoogleStrategy({
    clientID: process.env.client_id,
    clientSecret: process.env.client_secret,
    callbackURL: "http://localhost:3000/callback/url",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scope: ['profile','email'], 
},
    function (accessToken, refreshToken, profile, cb) {
        console.log('Google Profile:', profile); 
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.get("/auth",
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get("/callback/url",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        console.log('User Profile:', req.user);
        // Successful authentication, redirect to success.
        res.redirect("/success");
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});