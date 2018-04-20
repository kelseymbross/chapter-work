const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session'); //access to cookies
const passport = require('passport'); //tell passport to use cookies
const keys = require('./config/keys');
const flash = require('connect-flash');
const bodyParser = require('body-parser'); //needed to get information from HTML 
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

app.use(session({ secret: 'session secret key' }))

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes/authRoutes')(app);

const PORT = process.env.PORT || 15000;
app.listen(PORT);
