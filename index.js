const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session'); //access to cookies
const passport = require('passport'); //tell passport to use cookies
const keys = require('./config/keys');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser'); //needed to get information from HTML
const nodemailer = require('nodemailer');
const async = require('async');
require('./models/user');
require('./services/passport');


mongoose.connect(keys.mongoUri);

const app = express();

app.use(
  cookieSession({
    maxAge: 30 * 24 * 60 * 60 * 1000,
    keys: [keys.cookieKey]
  })
);
//sets the view engine to ejs
//could include app.set('views', './views') to specify a different folder
//than the default 'views' that holds the templates
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(session({ secret: 'session secret key' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); //to use, call req.flash()

//body parser: parses incoming requests in a middleware
app.use(bodyParser.json());//only parses json
app.use(bodyParser.urlencoded({ extended: true })); //used to get information from html forms (in my case, ejs files)

require('./routes/authRoutes')(app);

const PORT = process.env.PORT || 15000;
app.listen(PORT);
