var config = require('../config/config_server');

var bcrypt = require('bcrypt-nodejs');
var monk = require('monk');
var db = monk(config.mongoURL);

var users = db.get('users');

module.exports = {
  find: function(username, callback) {
    users.findOne({username: username}, function(err, doc) {
      if (err) throw err;
      if (doc.length == 0)
        callback(null);
      else
        callback(doc);
    });
  },

  create: function(username, password, success) {
    this.userExists(username, function(successVal) {
      if (!successVal) {
        success(false);
      } else {
        users.insert({username: username, password: generateHash(password) },
                     function(err, records) {
                       if (err) {
                         throw err;
                       } else {
                         success(true);
                       }
                     });
      }
    });
  },

  update: function(user, success) {
    users.update({id: user.id}, user, function(err, records) {
      if (err || records != 1) {
        success(false);
      } else {
        success(true);
      }
    });
  },

  userExists: function(username, exists) {
    users.find({username: username}, function(err, doc) {
      if (err) throw err;
      if (doc.length == 0)
        exists(true);
      else
        exists(false);
    });
  },

  passwordIsValid: function(password, hash) {
    return bcrypt.compareSync(password, hash);
  }
}

function generateHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
