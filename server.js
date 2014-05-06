var express = require('express');
var io = require('socket.io');
var mongo = require('mongodb');
var monk = require('monk');
var moment = require('moment');

var db = monk('localhost:27017/chat_db');
var chats = db.get('history');
var app = express();
var logger;


io = io.listen(app.listen(8000));
logger = io.log; // use socket.io's logger

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
  response.render('chat');
});

io.sockets.on('connection', function (socket) {
  socket.emit('message', { message: 'Connected to chat. Displaying 10 most recent messages...', humanTime: moment().format('h:mm a') });
  sendRecentHistory(socket);

  socket.on('send', function (data) {
    data.humanTime = (moment(data.timestamp).format('h:mm a'));
    chats.insert(data);
    io.sockets.emit('message', data);
  });
});

var sendRecentHistory = function(socket) {
  chats.find({}, {limit: 10, sort: {'timestamp': -1}}, function(err, doc){
    // work backwards to send recent history in chronological order
    for (var i = 1; i <= doc.length; i++) {
      socket.emit('message', doc[doc.length-i]);
    }
  });
}

logger.info('listening on port 8000');
