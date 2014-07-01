var config = require('../config/config_server');

var mongoose = require('mongoose');

var Character = require('./character');

var itemSchema = mongoose.Schema({
  owned_by:       String,
  name:           String,
  description:    String,

  // for defining template items, which are not usable by characters
  template:       Boolean
});

// static factory method
itemSchema.statics.generateFromTemplate = function(template, callback) {
  var newItem = new this();
  newItem.name = template.name;
  newItem.description = template.description;
  newItem.template = false;
  newItem.save(function(err, item) {
    callback(item);
  });
}

itemSchema.methods.giveToCharacter = function(charId, callback) {
  var that = this;
  var oldOwner = that.owned_by;
  Character.findById(oldOwner, function(err, character) {
    Character.findById(charId, function(err, newChar) {
      if (character) {
        if (newChar) {
          var inv = character.inventory;
          inv = inv.splice(inv.indexOf(that._id), 1);
          character.inventory = inv;
          character.save(function(err) {
            if (err) throw err;
            newChar.inventory.push(that._id);
            newChar.save(function(err) {
              if (err) throw err;
              that.owned_by = charId;
              that.save(function(err) {
                if (err) throw err;
                callback(that);
              });
            });
          });
        }
      }
    });
  });
}

var model = mongoose.model('Item', itemSchema);
module.exports = model;
