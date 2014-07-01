var appRoutes = require('./routes/app');
var characterRoutes = require('./routes/characters');
var userRoutes = require('./routes/users');
var itemRoutes = require('./routes/items');

module.exports = function(app, passport) {
  // User routes
  app.get('/users', isLoggedIn, isAdmin, userRoutes.users);
  app.delete('/users/:username', isLoggedIn, isAdmin, userRoutes.deleteUser);

  app.get('/users/me', isLoggedIn, userRoutes.getChars);
  app.post('/users/chars', isLoggedIn, userRoutes.selectChar);

  // Character routes
  app.get('/chars', isLoggedIn, isAdmin, characterRoutes.chars);
  app.get('/chars/new', isLoggedIn, characterRoutes.renderCreateChar);
  app.get('/chars/:char_id', isLoggedIn, characterRoutes.getChar);
  app.post('/chars', isLoggedIn, characterRoutes.createChar);
  app.post('/chars/:char_id', isLoggedIn, characterRoutes.updateChar);

  // Item routes
  app.get('/items', isLoggedIn, isAdmin, itemRoutes.items);
  app.get('/items/me', isLoggedIn, itemRoutes.myItems);
  app.get('/items/new', isLoggedIn, isAdmin, itemRoutes.renderCreateItem);
  app.post('/items', isLoggedIn, isAdmin, itemRoutes.createItem);

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
  if (req.user.currentChar) {
    next();
  } else {
    res.redirect('users/me');
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
