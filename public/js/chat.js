window.onload = function() {
  var messages = [];
  var socket = io.connect('http://localhost:8000');
  var chatfield = $('#chatfield').select();
  var sendButton = $('#sendbtn').select();
  var content = $('#content').select();
  var username = $('#username').select();

  socket.on('message', function (data) {
    if (data.message) {
      messages.push(data);
      var html = '';
      html += '<b>[' + data.humanTime + '] ';
      html += (data.username ? data.username : 'Server') + ': </b>';
      html += data.message + '<br />';
      content.append(html);
      content.scrollTop = content.scrollHeight;
    } else {
      console.log('Error', data)
    }
  });

  sendButton.click(function() {
    var text = chatfield.val();
    var user = username.val();
    if (user === '') {
      alert('You must enter a username');
    } else {
      socket.emit('send', { message: text, username: user, timestamp: Date.now() });
      chatfield.val('');// = '';
    }
  });

  $(document).ready(function() {
    chatfield.keyup(function(e) {
      if (e.keyCode === 13) {
        sendButton.click();
      }
    });
  });

}

