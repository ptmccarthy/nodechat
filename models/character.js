var config = require('../config/config_server');
var logger = require('../logger');
var rules = require('../rules/rules');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var charSchema = Schema({
  name:       Object,
  gender:     Object,
  age:        Number,
  race:       Object,
  class:      Object,
  alignment:  Object,

  inventory:  [{ type: Schema.Types.ObjectId, ref: 'Item' }],
  gold:       Number
});

charSchema.methods.create = function(details) {
  logger.info('Creating character: ' + JSON.stringify(details));
  this.name = details.char_name;
  this.gender = rules.characters.genders[details.char_gender];
  this.age = details.char_age;
  this.race = rules.characters.races[details.char_race];
  this.class = rules.characters.classes[details.char_class];
  this.alignment = rules.characters.alignments[details.char_alignment];
  this.gold = 0;
  this.save(function(err,char) {
    logger.info(char);
    logger.info('Saved character ' + char.name + ' with id: ' + char._id);
  });
}

var model = mongoose.model('Character', charSchema);

module.exports = model;
