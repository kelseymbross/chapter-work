//Original passport npm
const passport = require('passport');
const express = require('express');
const path = require('path');
const HOME = 'home.html';
const HOME_PATH = `/Users/kelsey.ross/chapter/fullstack/server/${HOME}`;
const FAIL = 'fail.html';
const FAIL_PATH = `/Users/kelsey.ross/chapter/fullstack/server/${FAIL}`;
const LOGIN = 'login.html';
const LOGIN_PATH = `/Users/kelsey.ross/chapter/fullstack/server/${LOGIN}`;

module.exports = (app) => {
//Authentication
  app.get('/signup', (req, res) => {
    res.sendFile(HOME_PATH);
  });

  app.post('/signup',
  passport.authenticate('local-signup', {
    failureRedirect: '/',
    successRedirect: '/api/current_user',
    failureFlash: true //allows you to send failure messages to the user
  })
);
//Authorization
  app.get('/login', (req, res) => {
    res.sendFile(LOGIN_PATH, { message: req.flash('loginMessage')});//allows you to send any flash messages to the user
  });

  app.post('/login',
  passport.authenticate('local-login', { failureRedirect: '/', failureFlash: true }),
  function(req, res) {
    res.redirect('/api/current_user');
  });

  app.get('/', (req, res) => {
    res.sendFile(FAIL_PATH); ///Users/kelsey.ross/chapter/fullstack/server/home.html
  });

  /*app.post('/', passport.authenticate('user-login', {
      successRedirect: '/current_user',
      failureRedirect: '/login',
      failureFlash: true
  })
);*/
//------------------------------------------------------------------
  //google strategy has an internal specification that associates 'google' with that strategy
  app.get('/auth/google', passport.authenticate('google', {
      //scope dictates what comes back from google
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', passport.authenticate('google'));

//Note: this is AUTHORIZE not AUTHENTICATE, this is for already registered/logged in users
  app.get('/auth/google', passport.authorize('google', {
    scope : ['profile', 'email']
  })
);
app.get('/auth/google/callback', passport.authorize('google'));


  app.get('/api/logout', (req, res) => {
    req.logout;
    res.send(req.user);
  });

  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
};
