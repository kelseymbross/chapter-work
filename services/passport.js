const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');

const User = mongoose.model('users');

passport.serializeUser((user, done) => {
  done(null, user.id); //called when we finish doing something with passport, null is for possible errors, user.id is the follow-up
  //the user id has been stuffed into the cookie
});

passport.deserializeUser((id, done) => {
  //the id comes in because that's what we stuffed into the cookie
  User.findById(id)
    .then(user => {
      done(null, user);
    });
});

passport.use(
  new GoogleStrategy({
    clientID: keys.googleClientID,
    clientSecret: keys.googleClientSecret,
    callbackURL: '/auth/google/callback',
    proxy: true
  },
  (accessToken, refreshToken, profile, done) => {
    //existingUser will either be a modelInstance (an existing record) otherwise itll be null and we need to create a new one
    User.findOne({ googleId: profile.id }).then((existingUser) => {
      if (existingUser) {
        //we already have a record with the given ID
        done(null, existingUser); //tells passport, nothing went wrong and the user already exists
      } else {
        //we want to make a new record
        new User({
          googleId: profile.id //creates a new instance of the record, but it hasn't been written to mongo yet
        }).save().then(user => done(null, user)) // this is what ACTUALLY saves it
      }
    }); //find the first record in the section with the googleid === profile
  }
  )
);
