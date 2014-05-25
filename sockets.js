var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');

var io;

var socketManager = {
  register: function(socket) {
    var socketUser = socket.manager.handshaken[socket.id].user;
    // use this label with appended 'user-' so that we don't
    // have collisions with users and method names
    var userLabel = 'user-' + socketUser.username;
    if (!this[userLabel]) {
      this['user-' + socketUser.username] = [socket];
    } else {
      this[userLabel].push(socket);
    }
  },

  unregister: function(socket) {
    var socketUser = socket.manager.handshaken[socket.id].user;
    var userLabel = 'user-' + socketUser.username;
    var socketsArr = this[userLabel];
    for (var i = 0; i < socketsArr.length; i++) {
      if (socketsArr[i].id === socket.id) {
        socketsArr.splice(i, 1);
      }
    }
  }
};

module.exports = function(sio, passport, sessionStore) {
  io = sio;
  io.sockets.on('connection', onConnect);
  io.set('authorization', passportio.authorize({
    cookieParser : cookieParser,
    key: config.sessionKey,
    secret: config.sessionSecret,
    store: sessionStore,
    success: authSuccess,
    failure: authFailure
  }));
}

var onConnect = function (socket) {
  socketManager.register(socket);
  socket.emit('message', {
    message: 'Connected to chat. Displaying ' + config.displayRecent + ' most recent messages...',
    timestap: moment()
  });

  sendRecentHistory(socket);
  initializeListeners(socket);

  socket.on('disconnect', function() {
    socketManager.unregister(socket);
    logger.info('Socket disconnected. ID: ' + socket.id);
  });
}

var initializeListeners = function (socket) {
  socket.on('send', function (data) {
    chats.insert(data);
    io.sockets.emit('message', data);
  });
}

var sendRecentHistory = function (socket) {
  chats.find({}, {limit: config.displayRecent, sort: {'timestamp': -1}}, function (err, doc){
    // work backwards to send recent history in chronological order
    for (var i = 1; i <= doc.length; i++) {
      socket.emit('message', doc[doc.length-i]);
    }
  });
}

var authSuccess = function(data, accept) {
  logger.info("Socket initiated by user " + data.user.username);
  accept(null, true);
}

var authFailure = function(data, message, error, accept) {
  if (error) throw new Error(message);
  logger.info("Socket auth failed: " + message);
  accept(null, false);
}
