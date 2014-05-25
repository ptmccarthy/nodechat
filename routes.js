var config = require('./config/config_server');

var monk = require('monk');
var db = monk(config.mongoURL);

var users = db.get('users');

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, function(req, res) {
    res.render('index');
  });

  app.get('/signup', function(req, res) {
    res.render('signup');
  });

  // display current users. Currently very ugly.
  app.get('/users', isLoggedIn, function(req, res) {
    users.find({}, {}, function(err, doc) {
      if(err) {
        res.status(400).send('error');
        console.log("The Doc: " + doc);
      } else {
        res.send(doc);
      }
    });
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/login');
  });

  app.get('/login', function(req, res) {
    res.render('login');
  });

  app.post('/login', passport.authenticate('local-login',
                                           { successRedirect: '/',
                                             failureRedirect: '/login'}));

  // sign up route
  app.post('/signup', passport.authenticate('local-signup',
                                            { successRedirect: '/login',
                                              failureRedirect: '/signup'}));
};

var userExists = function(username, onExists, onNotExists) {
  users.find({username: username}, function(err, doc) {
    if (doc.length == 0)
      onNotExists();
    else
      onExists();
  });
}

var isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}
