var config = require('../config/config_server');

var mongoose = require('mongoose');

var itemSchema = mongoose.Schema({
  name:           String,
  description:    String,

  // for defining template items, which are not usable by characters
  template:       Boolean
});

// static factory method
itemSchema.statics.generateFromTemplate = function(template) {
  var newItem = new this();
  newItem.name = template.name;
  newItem.description = template.description;
  newItem.template = false;
  return newItem;
}

var model = mongoose.model('Item', itemSchema);
module.exports = model;
