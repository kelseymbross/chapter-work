const mongoose = require('mongoose');
const { Schema } = mongoose; //curlies indicate that mongoose has a property called schema

const userSchema = new Schema({
  googleId: String
});

mongoose.model('users', userSchema); //create a new collection called users
