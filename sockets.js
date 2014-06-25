var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');
var items = db.get('items');
var sessions = db.get('sessions');

var io;
var rooms = {}; // { room_name: client_count }
var buddyList = [];
var userToSocketId = {};


module.exports.init = function(sio, passport, sessionStore) {
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

module.exports.closeSocketForUser = function(user) {
  var socketId = userToSocketId[user.username];
  var socket = io.sockets.connected[socketId];
  socket.disconnect();
}

var onConnect = function (socket) {
  socket.on('subscribe', function(data) { onSubscribe(socket, data); });
  socket.on('unsubscribe', function(data) { onUnsubscribe(socket, data.room); });
  socket.on('disconnect', function() { onDisconnect(socket) });

  socket.on('chat-send', function(data) { onChatReceived(data); });

  var user = getUserFromSocket(socket);
  userToSocketId[user.username] = socket.id;
}

var onDisconnect = function(socket) {
  logger.info('Socket disconnected. ID: ' + socket.id);
  var roomNames = Object.keys(rooms);
  for (var i in roomNames) {
    onUnsubscribe(socket, roomNames[i]);
  }

  var user = getUserFromSocket(socket);
  delete userToSocketId[user.username];
}

var onSubscribe = function(socket, data) {
  var user = getUserFromSocket(socket);
  var room = data.room;
  socket.join(room);
  if (rooms[room] == undefined) {
    rooms[room] = 1;
  } else {
    rooms[room] += 1;
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

    addToBuddyList(user);
  }
  if (room == 'inventory') {
    sendInventory(socket, data.character);
  }
}

var onUnsubscribe = function(socket, room) {
  var user = getUserFromSocket(socket);
  socket.leave(room);
  rooms[room] -= 1;

  // custom exit behavior from different rooms
  if (room == 'chat') {
    // exited notification (to everyone)
    io.to(room).emit('message', {
      message: 'User ' + user.username + ' has left the chat.',
      timestamp: moment(),
      recipients: 'all'
    });

    removeFromBuddyList(user);
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
  }

  if (data.recipients == 'all') {
    io.to(room).emit('message', data);
  } else {
    for (var i = 0; i < data.recipients.length; i++) {
      var socketId = userToSocketId[data.recipients[i]];
      io.to(socketId).emit('message', data);
    }
    var socketId = userToSocketId[data.username];
    io.to(socketId).emit('message', data);
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

var addToBuddyList = function(user) {
  buddyList.push(user.username);
  io.to('chat').emit('active-users', { users: buddyList });
}

var removeFromBuddyList = function(user) {
  var index = buddyList.indexOf(user.username);
  if (index > -1) {
    buddyList.splice(index, 1);
    io.to('chat').emit('active-users', { users: buddyList });
  }
}

var getUserFromSocket = function(socket) {
  var user = socket.client.request.user;
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



// hacking in inventory stuff, this shit will need to be refactored

var sendInventory = function(socket, character) {
  items.find({ owned_by: character }, function (err, doc) {
    logger.info(JSON.stringify(doc));
    io.to(socket.id).emit('update-inventory', { inventory: doc });
  });

}

