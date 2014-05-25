var messages = [];
var users = [];
var socket;
var chatfield;
var sendButton;
var chatbox;
var buddyList;

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
  }
}

var updateBuddyList = function(data) {
  if (data.users) {
    users = data.users;
  }
  var html = '';
  for (var i = 0; i < users.length; i++) {
    html += users[i];
    html += '<br />';
  }
  buddyList.html(html);
}

$(document).ready(function () {
  socket = io.connect(document.URL);

  chatfield = $('#chatfield').select();
  sendButton = $('#sendbtn').select();
  chatbox = $('#chatbox').select();
  buddyList = $('#buddylist').select();
  buddyList.html("abcd<br>defgh<br>");

  socket.on('message', function (data) {
    displayMessage(data);
  });

  socket.on('active-users', function(data) {
    updateBuddyList(data);
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
    socket.emit('send', { message: text, username: username, timestamp: moment() });
    chatfield.val('');
  });

  chatfield.keyup(function (e) {
    if (e.keyCode === 13) {
      sendButton.click();
    }
  });

});
