var config = require('./config/config_server');

var flash = require('connect-flash');

var User = require('./models/users');

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, function(req, res) {
    res.render('index', { 'username': req.user.username });
  });

  // display current users. Currently very ugly.
  app.get('/users', isLoggedIn, isAdmin, function(req, res) {
    User.find({}, function(err, doc) {
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
    res.render('login', { success: req.flash('success'),
                          error: req.flash('error')} );
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
                                              successFlash: true,
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

var isAdmin = function(req, res, next) {
  hasPermissions(req, res, 'admin', next);
}

var isSuperUser = function(req, res, next) {
  hasPermissions(req, res, 'superuser', next);
}

var hasPermissions = function(req, res, required, next) {
  if (req.user.hasSufficientPermissions(required))
    next();
  else
    res.status(403).send("Insufficient privileges to view this resource.");
}
