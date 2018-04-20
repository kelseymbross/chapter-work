const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');
const User = mongoose.model('users');
const bcrypt = require('bcrypt-nodejs');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    });
});

//------------------------------------------------------------------------------
//Sign-In
//------------------------------------------------------------------------------
passport.use('local-signup', //named strategy
  new LocalStrategy({
  //only necessary if you are not using the default names of 'username' and 'password'
  //LocalStrategy is expecting the credentials to be: username and password
  //this is how you can change them to fit your needs
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true //if you need them, allows you to access other values on the req, passes values back to verify callback
  },
  //the verify callback defaults to 'username' and 'password', however you can
  //specify different names for the arguments on the login page
  (req, email, password, done) => {
    //process.nextTick(function() { can be used to make this prcocess async, won't be called if no data is returned
    User.findOne( {'emailPass.email': email}).then((existingUser) => {
      if (existingUser) {
        console.log("ERROR: User already exists");
        return done(null, false, req.flash('message', 'The user already exists')); //the false indicates that the authentication failed and the user is set to false
        //try to install flash with ejs...I think I need to alter the HTML to handle error messages
      } else {
        return new User({
          'emailPass.email': email,
          'emailPass.password': bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
        }).save().then(user => done(null, user)); //return the new user
      }
    });
  })
);

//------------------------------------------------------------------------------
//Login
//------------------------------------------------------------------------------
passport.use('local-login',
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  (req, email, password, done) => { //verify callback
    User.findOne( {'emailPass.email': email}).then((existingUser) => {
      if (!existingUser) {
        console.log("ERROR: User does not exist");
        return done(null, false, req.flash('failure', 'User does not exist.') );
      } else {
        if (existingUser.validPassword(password, existingUser.emailPass.password)) {
          return done(null, existingUser);
        } else {
          console.log("ERROR: Incorrect Password");
          return done(null, false, req.flash('failure', 'Incorrect Password'));
        }
      }
    });
  })
);

//------------------------------------------------------------------------------
//Spotify auth
//------------------------------------------------------------------------------
passport.use(new SpotifyStrategy({
    clientID: keys.spotifyClientID,
    clientSecret: keys.spotifyClientSecret,
    callbackURL: '/auth/callback/spotify'
  },
  (accessToken, refreshToken, expires_in, profile, done) => {
    User.findOne({ 'spotify.spotifyId': profile.id }).then((existingUser) => {
      if (existingUser) {
        console.log('ERROR: user exists')
        done(null, existingUser);
      } else {
        new User({
          'spotify.spotifyId': profile.id
        }).save().then(user => done(null, user))
      }
    });
  }
));

//------------------------------------------------------------------------------
//Google oauth
//------------------------------------------------------------------------------
passport.use(
  new GoogleStrategy({
    clientID: keys.googleClientID,
    clientSecret: keys.googleClientSecret,
    callbackURL: '/auth/google/callback',
    proxy: true
  },
  (accessToken, refreshToken, profile, done) => {
    //existingUser will either be a modelInstance (an existing record) otherwise itll be null and we need to create a new one
    User.findOne({ 'google.googleId': profile.id }).then((existingUser) => {
      if (existingUser) {
        //we already have a record with the given ID
        done(null, existingUser); //tells passport, nothing went wrong and the user already exists
      } else {
        //we want to make a new record
        new User({
          'google.googleId': profile.id //creates a new instance of the record, but it hasn't been written to mongo yet
        }).save().then(user => done(null, user)) // this is what ACTUALLY saves it
      }
    }); //find the first record in the section with the googleid === profile
  })
);
