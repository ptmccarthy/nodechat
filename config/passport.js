var config = require('./config_server');
var logger = require('../logger');

var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/users');


module.exports = function(passport, app) {
  passport.serializeUser(function(user, done) {
    done(null, user.username);
  });

  passport.deserializeUser(function(username, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err)
        return done(err);

      done(null, user);
    });
  });

  passport.use('local-login', new LocalStrategy(
    function(username, password, done) {
    process.nextTick(function() {
    User.findOne({ username: username }, function(err, user) {
      if (err)
        return done(err);

      if (!user) {
        var message = "Login failed: User " + username + " not found";
        logger.info(message);
        return done(null, false, { message: message });
      } else if (!user.passwordIsValid(password)) {
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
      User.findOne({ username: username }, function(err, user) {
        if (err)
          return done(err);

        if (user) {
          var message = 'Signup Failed: User ' + username + ' already exists';
          logger.info(message);
          return done(null, false, { message: message });
        } else {
          var user = new User();
          user.username = username;
          user.setPassword(password);
          user.setPermissionLevel('player');
          user.save(function(err) {
            if (err)
              throw err;
            var message = 'Created new user: ' + username + '. You may now login';
            logger.info(message);
            return done(null, user, { message: message });
          });
        }
      });
      });
    })
  );
}
