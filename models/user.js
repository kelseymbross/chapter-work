const mongoose = require('mongoose');
const { Schema } = mongoose; //curlies indicate that mongoose has a property called schema
const bcrypt = require('bcrypt-nodejs');

/*
PREVIOUS:
const userSchema = new Schema({
  googleId: String
});
*/

const userSchema = new Schema({
  //all accounts are their own object now
  emailPass: {
    //need this in order to make email and password sparse so they can be null
    //echo -e "use emaily-dev\n db.users.getIndices()" | mongo
    //echo -e "use emaily-dev\n db.users.createIndex( { 'emailPass.email': 1 }, { sparse: true } )" | mongo
    //echo -e "use emaily-dev\n db.users.dropIndex('emailPass.email_1')" | mongo

    //Both of these are, by nature, required but in the event you head
    //more information that needed to be required, if the user did not
    //provide it, the sign-up would fail and an error would be logged
    email: {
      //validations
      type: String,
      sparse: true
      //unique: true,
      //required: true => can't do this because if you try to create a google login, it won't work, 'UnhandledPromiseRejectionWarning'
    },
    password: {
      type: String
      //required: true
    },
    //the token and expiry will only be set if a password reset
    //is requested, otherwise, they will not appear in the collection
    resetPasswordToken: String,
    resetPasswordExpires: Date
  },
  spotify: {
    spotifyId: String
  },
  google: {
    googleId: String
  }
});

//generate a hash of the password
//change to async because it is less intensive on the CPU
userSchema.methods.generateHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
};

/*
userSchma.methods.generateHash = (password) => {
  bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt, function(err, hash) { //callback
          if (err) return next(err);
          return done(null, hash);
      });
    });
};
*/

//validate the password
userSchema.methods.validPassword = (password, existingPassword) => {
  return bcrypt.compareSync(password, existingPassword); //true or false
};

mongoose.model('users', userSchema); //create a new collection called users
