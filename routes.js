var appRoutes = require('./routes/app');
var characterRoutes = require('./routes/characters');
var userRoutes = require('./routes/users');

module.exports = function(app, passport) {
  // User routes
  app.get('/users', isLoggedIn, isAdmin, userRoutes.users);
  app.get('/user/:username/delete', isLoggedIn, isAdmin, userRoutes.deleteUser);

  // Character routes
  app.get('/gen_char', isLoggedIn, characterRoutes.renderCreateChar);
  app.post('/gen_char', isLoggedIn, characterRoutes.createChar);
  app.get('/pick_char', isLoggedIn, characterRoutes.renderSelectChar);
  app.post('/pick_char', isLoggedIn, characterRoutes.selectChar);

  // general-purpose routes
  app.get('/', isLoggedIn, hasActiveCharacter, appRoutes.index);
  app.get('/logout', appRoutes.logout);
  app.get('/login', appRoutes.loginPage);
  // these two can't be refactored because they rely on having access to the passport object
  app.post('/login', passport.authenticate('local-login', { successRedirect: '/',
                                                            failureRedirect: '/login',
                                                            failureFlash: true }) );
  app.post('/signup', passport.authenticate('local-signup', { successRedirect: '/login',
                                                              failureRedirect: '/login',
                                                              successFlash: true,
                                                              failureFlash: true }) );
};

// custom middleware
var isLoggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
}

var hasActiveCharacter = function(req, res, next) {
  if (req.session.character) {
    next();
  } else {
    res.redirect('pick_char');
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
