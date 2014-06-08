var Item = require('../models/items.js');

module.exports.items = function(req, res) {
  Item.find({}, function(err, doc) {
    if (err) throw err;
    res.send(doc);
  });
}
