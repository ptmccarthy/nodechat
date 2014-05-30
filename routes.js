var config = require('./config/config_server');
var logger = require('./logger')

var flash = require('connect-flash');
var monk = require('monk');
var db = monk(config.mongoURL);

var sockets = require('./sockets');

var User = require('./models/users');
var Character = require('./models/character');

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, function(req, res) {
    res.render('index', { 'username': req.user.username });
  });

  // scaffold for current users
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

  // scaffold for creating a character
  app.get('/char', isLoggedIn, function(req, res) {
    User.findOne({_id: req.user._id}, function(err, user) {
      Character.find({_id: { $in: user.characters }}, function(err, doc) {
        res.render('char', { 'character_list': doc });
      });
    });
  });

  app.post('/char', isLoggedIn, function(req, res) {
    var character = new Character();
    character.create(req.body);
    User.findOne({_id: req.user._id}, function(err, user) {
      if (err) {
        logger.error('Could not find user id in db')
      } else {
        user.characters.push(character._id);
        user.save();
      }
    })
    res.redirect('char');
  });

  app.get('/user/:username/delete', isLoggedIn, isAdmin, function(req, res) {
    User.findOne({ username: req.params.username }, function(err, user) {
      if (err) throw err;
      if (!user) {
        res.send("User " + req.params.username + " does not exist.");
      } else {
        user.remove();
        res.send("User " + req.params.username + " successfully removed.");

        sockets.closeSocketForUser(user);
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
