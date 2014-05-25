var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');
var socketManager = require('./socketManager');

var io;

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

  io.sockets.emit('active-users', {
    users: socketManager.activeUsers()
  });

  sendRecentHistory(socket);
  initializeListeners(socket);

  socket.on('disconnect', function() {
    socketManager.unregister(socket);
    logger.info('Socket disconnected. ID: ' + socket.id);
    io.sockets.emit('active-users', { users: socketManager.activeUsers() });
  });
}

var initializeListeners = function (socket) {
  socket.on('chat-send', function (data) {
    var targetSockets = [];
    var type = 'chat';
    if (data.recipients == undefined) {
      console.log("recipients is undefined");
      data.recipients = 'all';
      targetSockets = socketManager.getSocketsOfType(type);
    } else if (data.recipients.length == 0) {
      console.log("recipients is empty");
      data.recipients = 'all';
      targetSockets = socketManager.getSocketsOfType(type);
    } else {
      // get sockets for the recipients
      for (var i = 0; i < data.recipients.length; i++) {
        console.log(data.recipients[i]);
        targetSockets = targetSockets.concat(socketManager.getSocketsOfTypeForUser(type, data.recipients[i]));
      }
      // get sockets for the sender
      targetSockets = targetSockets.concat(socketManager.getSocketsOfTypeForUser(type, data.username));
    }
    for (var i = 0; i < targetSockets.length; i++) {
      var socket = targetSockets[i];
      logger.info("emitting message of type `" + type + "` to socket " + socket.id);
      socket.emit('message', data);
    }
        chats.insert(data);
  });

  socket.on('set-type', function(data) {
    socketManager.registerAsType(socket, data.type);
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
