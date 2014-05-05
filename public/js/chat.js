window.onload = function() {
  var messages = [];
  var chatfield;
  var socket = io.connect('http://localhost:8000');
  var field = document.getElementById('chatfield');
  var sendButton = document.getElementById('sendbtn');
  var content = document.getElementById('content');
  var username = document.getElementById('username');

  socket.on('message', function (data) {
    if (data.message) {
      messages.push(data);
      var html = '';
      for (var i = 0; i < messages.length; i++) {
        html += '<b>' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
        html += messages[i].message + '<br />';
      }
      content.innerHTML = html;
      content.scrollTop = content.scrollHeight;
    } else {
      logger.error('Error', data)
    }
  });

  sendButton.onclick = function() {
    var text = field.value;
    if (username.value === '') {
      alert('You must enter a username');
    } else {
      socket.emit('send', { message: text, username: username.value, timestamp: Date.now() });
      field.value = "";
    }
  }

  $(document).ready(function() {
    chatfield = $('#chatfield').select();

    chatfield.keyup(function(e) {
      if (e.keyCode === 13) {
        sendButton.click();
      }
    });
  });

}

