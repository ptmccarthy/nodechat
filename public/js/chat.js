var messages = [];
var socket = io.connect('http://localhost:8000');
var chatfield;
var sendButton;
var chatbox;
var username;

var displayMessage = function (data) {
   if (data.message) {
    messages.push(data);
    var html = '';
    html += '<b>[' + moment(data.timestamp).format('h:mm a') + '] ';
    html += (data.username ? data.username : 'Server') + ': </b>';
    html += data.message + '<br />';
    chatbox.append(html);
    chatbox.animate({
      scrollTop: chatbox[0].scrollHeight
    }, 300);
  } else {
    console.log('Error', data)
  } 
}

$(document).ready(function () {
  chatfield = $('#chatfield').select();
  sendButton = $('#sendbtn').select();
  chatbox = $('#chatbox').select();
  username = $('#username').select();

  socket.on('message', function (data) {
    displayMessage(data);
  });

  socket.on('disconnect', function () {
    data = {
      message: 'Connection to server lost.',
      timestamp: moment()
    }
    displayMessage(data);
  });

  sendButton.click(function () {
    var text = chatfield.val();
    var user = username.val();
    if (user === '') {
      alert('You must enter a username');
    } else {
      socket.emit('send', { message: text, username: user, timestamp: moment() });
      chatfield.val('');
    }
  });

  chatfield.keyup(function (e) {
    if (e.keyCode === 13) {
      sendButton.click();
    }
  });

});
