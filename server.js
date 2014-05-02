var express = require('express');
var io = require('socket.io')
var port = 8000;
var app = express();

io = io.listen(app.listen(port));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
  response.render('chat');
});

io.sockets.on('connection', function (socket) {
  socket.emit('message', { message: 'welcome to the chat'});
  socket.on('send', function (data) {
    io.sockets.emit('message', data);
  });
});

console.log('listening on port ' + port);
