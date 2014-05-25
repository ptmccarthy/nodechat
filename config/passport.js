var config = require('./config_server');
var monk = require('monk');
var db = monk(config.mongoURL);
var logger = require('../logger');

var LocalStrategy = require('passport-local').Strategy;

var users = require('../models/users');


module.exports = function(passport, app) {
  passport.serializeUser(function(user, done) {
    done(null, user.username);
  });

  passport.deserializeUser(function(username, done) {
    users.find(username, function(user) {
      done(null, user);
    });
  });

  passport.use('local-login', new LocalStrategy(
    function(username, password, done) {
    process.nextTick(function() {
      users.find(username, function(user) {
        if (!user) {
          var message = "Login failed: User " + username + " not found";
          logger.info(message);
          return done(null, false, { message: message });

        } else if (!users.passwordIsValid(password, user.password)) {
          var message = "Login failed: Incorrect password for user " + username;
          logger.info(message);
          return done(null, false, { message: message });

        } else {
          return done(null, user);
        }
      });
    });
  }));

  passport.use('local-signup', new LocalStrategy(
    function(username, password, done) {
    process.nextTick(function() {
      users.create(username, password, function(err, user) {
        if (err) throw err;
        if (!user) {
          var message = 'Signup Failed: User ' + username + ' already exists';
          logger.info(message);
          return done(null, false, { message: message });
        } else {
          var message = 'Created new user: ' + username + '. You may now login';
          logger.info(message);
          return done(null, user, { message: message });
        }
      });
    });
    })
  );
}
