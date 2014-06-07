var Character = require('../models/character');
var User = require('../models/users');
var logger = require('../logger');

module.exports.createChar = function(req, res) {
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
}

module.exports.renderCreateChar = function(req, res) {
  User.findOne({_id: req.user._id}, function(err, user) {
    Character.find({_id: { $in: user.characters }}, function(err, character) {
      res.render('gen_char', { 'character_list': character });
    });
  });
}

module.exports.renderSelectChar = function(req, res) {
  var selected_char;

  User.findOne({_id: req.user._id}, function(err, user) {
    Character.find({_id: { $in: user.characters }}, function(err, doc) {
      for (ch in doc) {
        if (doc[ch]._id == req. session.character) {
          selected_char = doc[ch];
        }
      }
      if (!selected_char) {
        selected_char = { name: '[None]' };
      }
      res.render('pick_char', { 'character_list': doc,
                                'active_char': selected_char.name });
    });
  });
}

module.exports.selectChar = function(req, res) {
  logger.info('User ' + req.user.username + ' selected character id: ' + req.body.char_selection);
  req.session.character = req.body.char_selection;
  res.redirect('/');
}
