var Character = require('../models/character');
var User = require('../models/users');
var logger = require('../logger');

var races = require('../rules/races.json')
var classes = require('../rules/classes.json')
var alignments = require('../rules/alignments.json')
var genders = require('../rules/genders.json')

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
  res.redirect('/users/me');
}

module.exports.getChar = function(req, res) {
  Character
  .findOne({ _id: req.params.char_id })
  .populate('inventory')
  .exec(function(err, character) {
    var user = req.user;
    var userCanEdit = false;
    if (err) throw err;
    for (var ch in user.characters) {
      if (user.characters[ch] == req.params.char_id) {
        userCanEdit = true;
      }
    }
    if (user.hasSufficientPermissions('admin')) {
      userCanEdit = true;
    }
    res.render('char', { 'character': character,
                         'editable': userCanEdit });
  });
}

module.exports.updateChar = function(req, res) {
  var charId = req.params.char_id;
  var body = req.body;
  Character.findOne({_id: charId}, function(err, character) {
    if (err) throw err;
    character.name = body.char_name;
    character.age = body.char_age;
    character.gender = body.char_gender;
    character.race = body.char_race;
    character.class = body.char_class;
    character.alignment = body.char_alignment;
    character.save();

    res.redirect('/users/me');
  });
}

module.exports.renderCreateChar = function(req, res) {
  User
  .findOne({_id: req.user._id})
  .populate('characters')
  .exec(function(err, user) {
    res.render('gen_char', {  'user_with_chars': user,
                              'races': races,
                              'classes': classes,
                              'alignments': alignments,
                              'genders': genders });
  });
}

module.exports.chars = function(req, res) {
  Character.find({}, function(err, doc) {
    if (err) throw err;
    res.send(doc);
  });
}
