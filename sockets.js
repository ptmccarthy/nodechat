var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');

var io;

module.exports = function(sio, passport, sessionStore) {
  io = sio;
  io.set('authorization', passportio.authorize({
    cookieParser : cookieParser,
    key: config.sessionKey,
    secret: config.sessionSecret,
    store: sessionStore,
    success: authSuccess,
    failure: authFailure
  }));
}

var authSuccess = function(data, accept) {
  logger.info("Socket initiated by user " + data.user.username);
  io.sockets.on('connection', onConnect);
  accept(null, true);
}

var authFailure = function(data, message, error, accept) {
  if (error) throw new Error(message);
  logger.info("Socket auth failed: " + message);
  accept(null, false);
}

var onConnect = function (socket) {
  socket.emit('message', {
    message: 'Connected to chat. Displaying ' + config.displayRecent + ' most recent messages...',
    timestap: moment()
  });

  sendRecentHistory(socket);
  initializeListeners(socket);

  socket.on('disconnect', function() {
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
