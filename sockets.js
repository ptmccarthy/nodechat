var config = require('./config/config_server');
var logger = require('./logger');

var moment = require('moment');
var monk = require('monk');
var cookieParser = require('cookie-parser');
var passportio = require('passport.socketio');

var db = monk(config.mongoURL);
var chats = db.get('history');
var Item = require('./models/items');
var User = require('./models/users');
var Character = require('./models/character');

var sessions;

var io;
var rooms = {}; // { room_name: client_count }
var buddyList = [];


module.exports.init = function(sio, passport, sessionStore) {
  io = sio;
  sessions = sessionStore;
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
  var socket = io.sockets.adapter.rooms[user._id][0];
  socket.disconnect();
}

var updateInventoryForCharacter = function(charId) {
  Item.find({ owned_by: charId }, function (err, doc) {
    io.to(charId).emit('update-inventory', { inventory: doc });
  });
}
module.exports.updateInventoryForCharacter = updateInventoryForCharacter;

var onConnect = function (socket) {
  var user = getUserFromSocket(socket);

  socket.on('subscribe', function(data) { onSubscribe(socket, data.room); });
  socket.on('unsubscribe', function(data) { onUnsubscribe(socket, data.room); });
  socket.on('disconnect', function() { onDisconnect(socket) });

  socket.on('chat-send', function(data) { onChatReceived(socket, data); });
  socket.on('item-transfer', function(data) { onItemTransfer(data); });

  // auto-join some useful rooms
  socket.join(user._id);
  sessions.get(socket.client.request.sessionID, function(err, session) {
    socket.join(session.character);
  });

  if (user.getPermissionLevel() == 0)
    socket.join('admins');
  if (user.getPermissionLevel() == 1)
    socket.join('superusers');
  if (user.getPermissionLevel() == 2)
    socket.join('players');
}

var onDisconnect = function(socket) {
  logger.info('Socket disconnected. ID: ' + socket.id);
  var roomNames = Object.keys(rooms);
  for (var i in roomNames) {
    onUnsubscribe(socket, roomNames[i]);
  }
}

var onSubscribe = function(socket, room) {
  var user = getUserFromSocket(socket);
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
      recipients: [user.username]
    });
    sendRecentHistory(socket);

    // joined notification (to everyone)
    socket.broadcast.to(room).emit('message', {
      message: 'User ' + user.username + ' has joined the chat.',
      timestamp: moment(),
      recipients: 'all'
    });

    addToBuddyList(socket);
  }
  if (room == 'inventory') {
    sendInventory(socket);
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

var onChatReceived = function(socket, data) {
  var targetSockets = [];
  var room = 'chat';
  var user = getUserFromSocket(socket);
  data.username = user.username;
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
    User.find({ _id: { $in: data.recipients } }, function(err, doc) {
      data.recipients = [];
      for (var i = 0; i < doc.length; i++) {
        data.recipients.push(doc[i].username);
        io.to(doc[i]._id).emit('message', data);
      }
      io.to(user._id).emit('message', data);
      chats.insert(data);
    });
  }
}

var onItemTransfer = function(data) {
  Item.find({_id: {$in: data.items} }, function(err, items) {
    if (items.length > 0) {
      var currentOwner = items[0].owned_by;
      var targetChar = data.recipient;
      for (var i = 0; i < items.length; i++) {
        items[i].giveToCharacter(data.recipient, function(item) {
          updateInventoryForCharacter(currentOwner);
          updateInventoryForCharacter(targetChar);
        });
      }
    }
  });
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
    }
  );
}

var addToBuddyList = function(socket) {
  var user = getUserFromSocket(socket);
  getSessionFromSocket(socket, function(session) {
    Character.findById(session.character, function(err, character) {
      if (err) throw err;
      if (character) {
        user = user.toObject();
        user.currentChar = character;
        buddyList.push(user);
      }
      io.to('chat').emit('active-users', { users: buddyList });
    });
  });
}

var removeFromBuddyList = function(user) {
  var index = null;
  for (var i = 0; i < buddyList.length; i++) {
    if (buddyList[i]._id == user._id) {
      buddyList.splice(index, 1);
      i--;
    }
  }
  io.to('chat').emit('active-users', { users: buddyList });
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

var sendInventory = function(socket) {
  getSessionFromSocket(socket, function(session) {
    updateInventoryForCharacter(session.character);
  });
}

var getSessionFromSocket = function(socket, callback) {
  sessions.get(socket.client.request.sessionID, function(err, session) {
    if (err) throw err;
    callback(session);
  });
}
