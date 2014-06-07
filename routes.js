var config = require('./config/config_server');
var logger = require('./logger')

var flash = require('connect-flash');
var monk = require('monk');
var db = monk(config.mongoURL);

var sockets = require('./sockets');

var User = require('./models/users');
var Character = require('./models/character');

module.exports = function(app, passport) {
  app.get('/', isLoggedIn, hasActiveCharacter, function(req, res) {
    var username = req.user.username;
    Character.findOne({_id: req.session.character}, function(err, character) {
      res.render('index', { 'user': username,
                            'character': character });
    });
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

  // routes for creating a character
  app.get('/gen_char', isLoggedIn, function(req, res) {
    User.findOne({_id: req.user._id}, function(err, user) {
      Character.find({_id: { $in: user.characters }}, function(err, character) {
        res.render('gen_char', { 'character_list': character });
      });
    });
  });

  app.post('/gen_char', isLoggedIn, function(req, res) {
    var character = new Character();
    character.create(req.body);
    User.findOne({_id: req.user._id}, function(err, user) {
      if (err) {
        logger.error('Could not find user id in db');
      } else {
        user.characters.push(character._id);
        user.save();
      }
    })
    res.redirect('pick_char');
  });

  // routes for picking a character
  app.get('/pick_char', isLoggedIn, function(req, res) {
    var selected_char;
    Character.findOne({_id: req.session.character}, function(err, doc) {
      selected_char = doc;
    });

    User.findOne({_id: req.user._id}, function(err, user) {
      Character.find({_id: { $in: user.characters }}, function(err, doc) {
        res.render('pick_char', { 'character_list': doc,
                                  'selected_char': selected_char });
      });
    });
  });

  app.post('/pick_char', isLoggedIn, function(req, res) {
    logger.info('User ' + req.user.username + ' selected character id: ' + req.body.char_selection);
    req.session.character = req.body.char_selection;
    res.redirect('/');
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
