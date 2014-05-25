var config = require('./config/config_server');

var flash = require('connect-flash');
var monk = require('monk');
var db = monk(config.mongoURL);

var users = db.get('users');

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, function(req, res) {
    res.render('index', { 'username': req.user.username });
  });

  // display current users. Currently very ugly.
  app.get('/users', isLoggedIn, function(req, res) {
    users.find({}, {}, function(err, doc) {
      if(err) {
        res.status(400).send('error');
        logger.error("Error finding users. The doc is: " + doc);
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
    res.render('login', { message: req.flash('error')} );
  });

  app.post('/login', passport.authenticate('local-login',
                                           { successRedirect: '/',
                                             failureRedirect: '/login',
                                             failureFlash: true })
  );

  // sign up route
  app.post('/signup', passport.authenticate('local-signup',
                                            { successRedirect: '/login',
                                              failureRedirect: '/login',
                                              failureFlash: true })
  );
};

var isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}
