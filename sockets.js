var config = require('./config/config_server');
var moment = require('moment');
var monk = require('monk');
var db = monk(config.mongoURL);
var io;

var chats = db.get('history');

module.exports.init = function(sio) {
  io = sio;
  io.sockets.on('connection', onConnect);
}
var onConnect = function (socket) {
  socket.emit('message', {
    message: 'Connected to chat. Displaying ' + config.displayRecent + ' most recent messages...',
    timestap: moment()
  });

  sendRecentHistory(socket);
  initializeListeners(socket);
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


