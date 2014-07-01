var sockets = require('../sockets');
var logger = require('../logger');

var User = require('../models/users');
var Character = require('../models/character');

module.exports.users = function(req, res) {
  User.find({}, function(err, doc) {
    if(err) {
      res.status(400).send('error');
      logger.error("Error finding users. The doc is: " + doc);
    } else {
      res.send(doc);
    }
  });
}

module.exports.deleteUser = function(req, res) {
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
}

module.exports.selectChar = function(req, res) {
  logger.info('User ' + req.user.username + ' selected character id: ' + req.body.char_selection);
  req.user.currentChar = req.body.char_selection;
  req.user.save();
  res.redirect('/');
}

module.exports.getChars = function(req, res) {
  var selected_char;
  req.user.populate('characters currentChar', function(err, user) {
    selected_char = user.currentChar;
    if (!selected_char) {
      selected_char = { name: '[None]' };
    }
    res.render('pick_char', { 'user_with_chars': user,
                              'active_char': selected_char.name });
  });
}
