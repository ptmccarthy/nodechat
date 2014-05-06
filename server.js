var config = require('./config/config_server');

var express = require('express');
var io = require('socket.io');
var mongo = require('mongodb');
var monk = require('monk');
var moment = require('moment');

var db = monk(config.mongoURL);
var chats = db.get('history');
var app = express();
var logger;

io = io.listen(app.listen(config.port));
io.set('log level', config.logLevel);

// use socket.io's logger because its nice
logger = io.log;

// set express properties
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
  response.render('index');
});

// configure socket.io events
io.sockets.on('connection', function (socket) {
  socket.emit('message', { 
    message: 'Connected to chat. Displaying ' + config.displayRecent + ' most recent messages...', 
    timestamp: moment() });
  
  sendRecentHistory(socket);

  socket.on('send', function (data) {
    chats.insert(data);
    io.sockets.emit('message', data);
  });
});

// server started, display info
logger.info('server started at ' + moment().format('YYYY-MM-DD HH:MM:SS'));
logger.info('logger set to level: ' + logger.level);
logger.info('application listening on port ' + config.port);


var sendRecentHistory = function (socket) {
  chats.find({}, {limit: config.displayRecent, sort: {'timestamp': -1}}, function (err, doc){
    // work backwards to send recent history in chronological order
    for (var i = 1; i <= doc.length; i++) {
      socket.emit('message', doc[doc.length-i]);
    }
  });
}
