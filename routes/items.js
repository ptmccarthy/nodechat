var Item = require('../models/items');
var Character = require('../models/character');
var User = require('../models/users');

module.exports.items = function(req, res) {
  Item.find({}, function(err, doc) {
    if (err) throw err;
    res.send(doc);
  });
}

module.exports.renderCreateItem = function(req, res) {
  Item.find({template: true}, function(err, items) {
    User
    .find({})
    .populate('characters')
    .exec(function(err, users) {
      res.render('create_item', { templates: items,
                                  users: users } );
    });
  });
}

module.exports.createItem = function(req, res) {
  if (req.body.character != undefined) {
    Character.findOne({_id: req.body.character}, function(err, character) {
      generateItem(req, res, character);
    });
  } else {
    generateItem(req, res, null);
  }
}

var generateItem = function(req, res, character) {
  if (req.body.item_type == 'clone') {
    Item.findOne({_id: req.body.template}, function(err, item) {
      if (err) throw err;
      var item = Item.generateFromTemplate(item);
      if (character) {
        item.owned_by = character._id;
        character.inventory.push(item._id);
        character.save();
      }
    });
    res.redirect('/items');
  } else if (req.body.item_type == 'template' || req.body.item_type == 'unique') {
    var item = new Item();
    item.name = req.body.name;
    item.description = req.body.description;
    item.template = (req.body.item_type == 'template');
    item.save();
    if (req.body.item_type == 'unique') {
      if (character) {
        item.owned_by = character._id;
        character.inventory.push(item._id);
        character.save();
      }
    }
    res.redirect('/items');
  } else {
    res.redirect('/items/new');
  }
}
