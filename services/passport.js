const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const keys = require('../config/keys');
const User = mongoose.model('users');
const bcrypt = require('bcrypt-nodejs');

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
//TO-DO: more on local strategy... username and password are specific to local strategy but we can override
passport.use('local-signup',
  new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  (req, email, password, done) => { //the usernameField and passwordField default to 'username' and 'password', these name the POST body that is sent to the server
 process.nextTick(function() {
    User.findOne( {'emailPass.email': email}).then((existingUser) => {
      if (existingUser) {
        return done(null, false); //try to install flash with ejs...I think I need to alter the HTML to handle error messages
      } else {
        return new User({
          'emailPass.email': email,
          'emailPass.password': bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
        }).save().then(user => done(null, user));
      }
    }
  );
})
}
)
);

passport.use('local-login',
  new LocalStrategy({
    usernameField: 'email', //specify a new name for the default
    passwordField: 'password',
    passReqToCallback: true //allows you to access other values on the req if you want
  },
  (req, email, password, done) => {
    User.findOne( {'emailPass.email': email}).then((existingUser) => {
      if (!existingUser) {
        return done(null, false); //, req.flash('loginMessage', 'Incorrect username.') );
      } else {
        if (bcrypt.compareSync(password, existingUser.emailPass.password)) {
          return done(null, existingUser);
        } else {
          return done(null, false);
        }
      }
    }
  );
}
)
);

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
  }
  )
);
