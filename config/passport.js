var config = require('./config_server');
var monk = require('monk');
var db = monk(config.mongoURL);

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
          return done(null, false, { message: "Incorrect username" });
        } else if (!users.passwordIsValid(password, user.password)) {
          return done(null, false, { message: "Incorrect password" });
        } else {
          return done(null, user);
        }
      });
    });
  }));

  passport.use('local-signup', new LocalStrategy(
    function(username, password, done) {
    process.nextTick(function() {
      users.create(username, password, function(success) {
        return done();
      });
    });
    })
  );
}
