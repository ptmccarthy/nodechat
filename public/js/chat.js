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
    console.log(data.recipients);
    if (data.recipients != 'all') {
      html += '[Private Message] ';
    }
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
    var spanId = '#user-' + users[i];
    html += '<span class="buddyItems" id="' + spanId + '">';
    html += '<input type="checkbox">';
    html += users[i];
    html += '</span>';
  }
  buddyList.html(html);
}

$(document).ready(function () {
  socket = io.connect(document.URL);
  socket.emit('set-type', {type: 'chat'});

  chatfield = $('#chatfield').select();
  sendButton = $('#sendbtn').select();
  chatbox = $('#chatbox').select();
  buddyList = $('#buddylist').select();

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
    var recipients = [];
    buddyList.children().each(function(index, element) {
      var recip = $(element).text();
      if ( $(element).find("input").is(':checked') ) {
        recipients.push(recip);
      }
    });

    var response = {
      message: text,
      username: username,
      recipients: recipients,
      timestamp: moment()
    };

    socket.emit('chat-send', response);
    chatfield.val('');
  });

  chatfield.keyup(function (e) {
    if (e.keyCode === 13) {
      sendButton.click();
    }
  });

});
