//Original passport npm
const passport = require('passport');
const express = require('express');
const path = require('path');
const HOME = 'home.ejs';
const SIGNUP = 'signup.ejs';
const FAIL = 'fail.ejs';
const LOGIN = 'login.ejs';
const RESET = 'requestReset.ejs';
const EMAIL = 'checkEmail.ejs';
const RESET_PASS = 'reset.ejs';
const SUCCESS = 'success.ejs';
const async = require('async');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('users');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
const keys = require('../config/keys');

module.exports = (app) => {

//------------------------------------------------------------------------------
//Home
//------------------------------------------------------------------------------
app.get('/home', (req, res) => {
  res.render(HOME);
});

//------------------------------------------------------------------------------
//SignUp
//------------------------------------------------------------------------------
  app.get('/signup', (req, res) => {
    res.render(SIGNUP, { message: req.flash('message')}); //this is where you define what the message might be
  });

  app.post('/signup',
  passport.authenticate('local-signup', //specifies that we want the strategy associated with sign-up
  {
    failureRedirect: '/signup',
    successRedirect: '/api/current_user',
    //this is meant to allow the user to send failure messages to the user
    //it is based on the message defined by {message: } in the verify callback
    failureFlash: true
  })
);

//------------------------------------------------------------------------------
//Login
//------------------------------------------------------------------------------
  app.get('/login', (req, res) => {
    res.render(LOGIN, { message: req.flash('failure')});//allows you to send any flash messages to the user
  });

  app.post('/login',
  passport.authenticate('local-login', { failureRedirect: '/login', failureFlash: true }),
  (req, res, next) => {
    res.redirect('/api/current_user');
  });

//------------------------------------------------------------------------------
//Fialure
//------------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.render(FAIL, {message: req.flash('failure')});
});

//------------------------------------------------------------------------------
//Forgot password
//------------------------------------------------------------------------------
  app.get('/request/resetPassword', (req, res) => {
    res.render(RESET);
  });

  app.post('/request/resetPassword', (req, res, next) => {
    async.waterfall([ //avoids nested callbacks, takes tasks and a callback
      //if any task errors out, the primary callback is called
      (done) => {
        //number and a callback, if no callback, buffer is returned synchronously
        crypto.randomBytes(20, (err, buf) => {
          const token = buf.toString('hex');
          done(err, token);
        });
      },
      (token, done) => {
        User.findOne({ 'emailPass.email': req.body.email }, (err, user) => {
          if (!user) {
            //req.flash('error', 'No account with that email address exists.');
            console.log('ERROR: User does not exist');
            return res.redirect('/');
          }
          user.emailPass.resetPasswordToken = token;
          user.emailPass.resetPasswordExpires = Date.now() + 3600000; // only valid for the next hour

          user.save((err) => {
            done(err, token, user);
          });
        });
      },
      (token, user, done) => {
        //transporter: object able to send mail
        //transport is the config object
        const transporter = nodemailer.createTransport({
          service: 'gmail', //can choice which provider you want to use
          auth: {
            //auth object
            //allows nodemailer to user personal email account by logging in for us
            user: 'kelsross8@gmail.com',
            pass: keys.myPassword
          }
        });
        const mailOptions = {
          to: `${req.body.email}`,
          from: 'kelsross8@gmail.com',
          subject: 'Chapter App: Password Reset',
          text: 'You are receiving this because you have requested to change your password.\n\n' +
            'Follow the link below to reset your password:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          //html: you can include html
        };
        transporter.sendMail(mailOptions, (err) => {//callback called after the email is sent
          req.flash('info', 'An e-mail has been sent to ' + user.emailPass.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], (err) => {
      if (err) return next(err);
      res.redirect('/checkEmail');
    });
  });

  app.get('/checkEmail', (req, res) => {
    res.render(EMAIL);
  });

//------------------------------------------------------------------------------
//Reset password
//------------------------------------------------------------------------------
app.get('/reset/:token', (req, res) => {
  User.findOne({
    'emailPass.resetPasswordToken': req.params.token,
     //$gt checks if there is a date greater than the current time (time hasn't expired)
    'emailPass.resetPasswordExpires': { $gt: Date.now() }
  }, (err, user) => {
    if (!user) {
      console.log('ERROR: Password token is invalid or has expired');
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/');
    }
    res.render(RESET_PASS);
  });
});

//------------------------------------------------------------------------------
//Confirmation Email
//------------------------------------------------------------------------------
app.post('/reset/:token', (req, res) => {
  async.waterfall([
    (done) => {
      User.findOne({
        'emailPass.resetPasswordToken': req.headers.referer.substring(29),
        'emailPass.resetPasswordExpires': { $gt: Date.now() }
      }, (err, user) => {
        if (!user) {
          console.log('ERROR: Password token is invalid or has expired');
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/');
        }
        //this is when you need body parser
        if(req.body.newPassword != req.body.confirmPassword) { //confirm the passwords entered are the same
          console.log('Passwords did not match');
          return res.redirect('/');
        }

        user.emailPass.password = user.generateHash(req.body.newPassword);
        user.emailPass.resetPasswordToken = undefined; //need to be reset in case the user changes their password in the future
        user.emailPass.resetPasswordExpires = undefined;

        user.save((err) => {
          req.logIn(user, (err) => { //user becomes the logged in user
            done(err, user);
          });
        });
      });
    },
    (user, done) => {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'kelsross8@gmail.com',
          pass: keys.myPassword
        }
      });
      const mailOptions = {
        to: user.emailPass.email,
        from: 'kelsross8@gmail.com',
        subject: 'Chapter App: Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.emailPass.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, (err) => {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], (err) => {
    if (err) return next(err);
    res.render(SUCCESS);
  });
});

app.get('/auth/spotify', passport.authenticate('spotify', {
    //scope dictates what comes back from google
    scope: ['user-read-email', 'user-read-private'], //gets the user sensitive data and email
    showDialog: true
  })
);

app.get('/auth/callback/spotify', passport.authenticate('spotify'));

//------------------------------------------------------------------
  //google strategy has an internal specification that associates 'google' with that strategy
  app.get('/auth/google', passport.authenticate('google', {
      //scope dictates what comes back from google
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', passport.authenticate('google'));

//Note: this is AUTHORIZE not AUTHENTICATE, this is for already registered/logged in users
/*  app.get('/auth/google', passport.authorize('google', {
    scope : ['profile', 'email']
  })
);
app.get('/auth/google/callback', passport.authorize('google'));*/


  app.get('/api/logout', (req, res) => {
    req.logout();
    res.send(req.user);
  });

  app.get('/api/current_user', (req, res) => {
    res.send(req.user);
  });
};
