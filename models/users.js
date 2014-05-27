var config = require('../config/config_server');

var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');

mongoose.connect(config.mongoURL);

var userSchema = mongoose.Schema({
  username:     String,
  password:     String,
  characters:   Array,
  data:         mongoose.Schema.Types.Mixed
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.passwordIsValid = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
