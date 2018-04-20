const mongoose = require('mongoose');
const { Schema } = mongoose; //curlies indicate that mongoose has a property called schema
const bcrypt = require('bcrypt-nodejs');

/*const userSchema = new Schema({
  googleId: String
});*/

const userSchema = new Schema({
  emailPass: {
    email: String,
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  google: {
    googleId: String
  }
});

//methods

//generate a hash of the password
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//validate the password
userSchema.methods.validPassword = (password) => {
  return bcrypt.compareSync(password, this.emailPass.password);
};

mongoose.model('users', userSchema); //create a new collection called users
