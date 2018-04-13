const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session'); //access to cookies
const passport = require('passport'); //tell passport to use cookies
const keys = require('./config/keys');
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

app.use(passport.initialize());
app.use(passport.session());

require('./routes/authRoutes')(app);

const PORT = process.env.PORT || 15000;
app.listen(PORT);
