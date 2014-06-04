var config = require('../config/config_server');
var logger = require('../logger');

var mongoose = require('mongoose');

var charSchema = mongoose.Schema({
  name: String,
});

charSchema.methods.create = function(details) {
  logger.info('Creating character: ' + JSON.stringify(details));
  this.name = details.char_name;
  this.save(function(err,char) {
    logger.info('Saved character ' + char.name + ' with id: ' + char._id);
  });
}

var model = mongoose.model('Character', charSchema);

module.exports = model;
