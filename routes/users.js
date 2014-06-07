var sockets = require('../sockets');

var User = require('../models/users');

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
