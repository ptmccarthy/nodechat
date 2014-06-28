var config = require('../config/config_server');

var bcrypt = require('bcrypt-nodejs');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Permissions = {
  admin: 0,
  superuser: 1,
  player: 2
};

var userSchema = Schema({
  username:     String,
  password:     String,
  permissions:  Number,

  characters:   [{ type: Schema.Types.ObjectId, ref: 'Character' }],
  currentChar: {type: Schema.Types.ObjectId, ref: 'Character' },
  data:         Schema.Types.Mixed
});

userSchema.methods.setPassword = function(password) {
  this.password = bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.passwordIsValid = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.hasSufficientPermissions = function(required) {
  return (Permissions[required] >= this.permissions);
}

userSchema.methods.getPermissionLevel = function() {
  var perms = Object.keys(Permissions);
  for (var i = 0; i < perms.length; i++) {
    var p = Permissions[perms[i]];
    if (p == this.permissions) {
      return perms[i];
    }
  }
}

userSchema.methods.setPermissionLevel = function(p) {
  this.permissions = Permissions[p];
}

userSchema.methods.addCharacter = function(char_id) {
  this.characters.push(char_id);
}

var model = mongoose.model('User', userSchema);
module.exports = model;

// create a root user if the db is empty
model.findOne({username: 'root'}, function(err, user) {
  if (err) throw err;
  if (!user) {
    var admin = new model();
    admin.username = 'root';
    admin.setPassword('admin');
    admin.setPermissionLevel('admin');
    admin.save();
  }
});
