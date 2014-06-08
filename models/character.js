var config = require('../config/config_server');
var logger = require('../logger');

var mongoose = require('mongoose');

var charSchema = mongoose.Schema({
  name:       String,
  gender:     String,
  age:        Number,
  race:       String,
  class:      String,

  inventory:  [{ type: Schema.Types.ObjectId, ref: 'Item' }],
  gold:       Number
});

charSchema.methods.create = function(details) {
  logger.info('Creating character: ' + JSON.stringify(details));
  this.name = details.char_name;
  this.gender = details.char_gender;
  this.age = details.char_age;
  this.race = details.char_race;
  this.class = details.char_class;
  this.gold = 0;
  this.save(function(err,char) {
    logger.info('Saved character ' + char.name + ' with id: ' + char._id);
  });
}

var model = mongoose.model('Character', charSchema);

module.exports = model;
