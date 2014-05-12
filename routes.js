var config = require('./config/config_server');

var monk = require('monk');
var db = monk(config.mongoURL);

var auth = require('./auth');
var users = db.get('users');

module.exports.index = function(req, res) {
  res.render('index');
}

// Temporary signup route. Once we have session-based auth
// we will use that to selectively show the signup content
// instead of the content for the selected route
module.exports.signup = function(req, res) {
  res.render('signup');
}

// POST sign up route
module.exports.newUser = function(req, res) {
  userExists(req.body.username,
                 function() { res.status(406).render('signup'); },
                 function() {
                   console.log("New user " + req.body.username);
                   users.insert({username: req.body.username, password: req.body.password});
                   //res.render('login');
                 }
            );
}

// display current users. Currently very ugly.
module.exports.users = function(req, res) {
  users.find({}, {}, function(err, doc) {
    if(err) res.status(400).send('error');
    else {
      res.send(doc);
    }
  });
}

// Temporary login route
module.exports.login = function(req, res) {
  res.render('login');
}

function userExists(username, onExists, onNotExists) {
  users.find({username: username}, function(err, doc) {
    if (doc.length == 0)
      onNotExists();
    else
      onExists();
  });
}
