var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');

var io;
var rooms = [];

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
  socket.on('subscribe', function(data) { onSubscribe(socket, data.room); });
  socket.on('unsubscribe', function(data) { onUnsubscribe(socket, data.room); });
  socket.on('disconnect', function() { onDisconnect(socket) });

  socket.on('chat-send', function(data) { onChatReceived(data); });
}

var onDisconnect = function(socket) {
  logger.info('Socket disconnected. ID: ' + socket.id);
  for (var i in rooms) {
    onUnsubscribe(socket, rooms[i]);
  }
}

var onSubscribe = function(socket, room) {
  var user = getUserFromSocket(socket);
  socket.join(room);
  if (rooms.indexOf(room) < 0) {
    rooms.push(room);
  }

  // custom startup behavior for different rooms
  if (room == 'chat') {
    // Login message (to the user)
    socket.emit('message', {
      message: 'Connected to chat. Displaying ' + config.displayRecent + ' most recent messages...',
      timestap: moment(),
      recipients: []
    });
    sendRecentHistory(socket);

    // joined notification (to everyone)
    socket.broadcast.to(room).emit('message', {
      message: 'User ' + user.username + ' has joined the chat.',
      timestamp: moment(),
      recipients: 'all'
    });
    updateBuddyList(room);
  }
}

var onUnsubscribe = function(socket, room) {
  var user = getUserFromSocket(socket);
  socket.leave(room);
  if (io.sockets.clients(room) == 0) {
    rooms.splice(rooms.indexOf(room), 1);
  }

  // custom exit behavior from different rooms
  if (room == 'chat') {
    // exited notification (to everyone)
    io.sockets.in(room).emit('message', {
      message: 'User ' + user.username + ' has left the chat.',
      timestamp: moment(),
      recipients: 'all'
    });

    updateBuddyList(room);
  }
}

var onChatReceived = function(data) {
  var targetSockets = [];
  var room = 'chat';
  if (data.recipients == undefined) {
    logger.debug("Initializing chat-send listener: recipients is undefined");
    data.recipients = 'all';
  } else if (data.recipients.length == 0) {
    logger.debug("Initializing chat-send listener: recipients is empty");
    data.recipients = 'all';
  } else {
    targetSockets = getSocketsForRoomByUsernames(room, data.recipients);
    targetSockets = targetSockets.concat(getSocketsForRoomByUsernames(room, data.username));
  }

  if (data.recipients == 'all') {
    io.sockets.in(room).emit('message', data);
  } else {
    for (var i = 0; i < targetSockets.length; i++) {
      var socket = targetSockets[i];
      socket.emit('message', data);
    }
  }

  chats.insert(data);
}

var sendRecentHistory = function (socket) {
  var user = getUserFromSocket(socket);
  chats.find(
    { $or: [{recipients: 'all'}, {recipients: user.username}, {username: user.username}] },
    { limit: config.displayRecent, sort: {'timestamp': -1} },
    function (err, doc) {
      // work backwards to send recent history in chronological order
      for (var i = 1; i <= doc.length; i++) {
        socket.emit('message', doc[doc.length-i]);
      }
    });
}

var updateBuddyList = function(room) {
  var users = getUsernamesFromRoom(room);
  io.sockets.in(room).emit('active-users', { users: users });
}

var getUsernamesFromRoom = function(room) {
  var allSockets = io.sockets.clients(room);
  var users = [];
  for (var i in allSockets) {
    var socketUser = getUserFromSocket(allSockets[i]);
    users.push(socketUser.username);
  }
  return users;
}

var getSocketsForRoomByUsernames = function(room, usernames) {
  var allSockets = io.sockets.clients(room);
  var filteredSockets = [];
  for (var i in allSockets) {
    var socketUser = getUserFromSocket(allSockets[i]);
    for (var j in usernames) {
      if (socketUser.username == usernames[j]) {
        filteredSockets.push(allSockets[i]);
      }
    }
  }
  return filteredSockets;
}

var getUserFromSocket = function(socket) {
  // the user is retardedly deeply nested in the socket object.
  var user = socket.manager.handshaken[socket.id].user;
  return user;
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
