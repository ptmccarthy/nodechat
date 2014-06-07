var flash = require('connect-flash');

var Character = require('../models/character');

module.exports.index = function(req, res) {
  var username = req.user.username;
  Character.findOne({_id: req.session.character}, function(err, character) {
    res.render('index', { 'user': username,
                          'character': character });
  });
}

module.exports.logout = function(req, res) {
  req.logout();
  req.session.character = null;
  res.redirect('/login');
}

module.exports.loginPage = function(req, res) {
  res.render('login', { success: req.flash('success'),
                        error: req.flash('error')} );
}
