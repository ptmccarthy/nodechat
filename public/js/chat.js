var messages = [];
var users = [];
var socket;
var chatfield;
var sendButton;
var giveItemButton;
var chatbox;
var buddyList;
var inventory;

var displayMessage = function (data) {
   if (data.message) {
    messages.push(data);
    var html = '';
    html += '<b>[' + moment(data.timestamp).format('h:mm a') + '] ';
    if (data.recipients != 'all') {
      html += '(to ';
      for (var i = 0; i < data.recipients.length; i++) {
        if (data.recipients[i] == username) {
          html += 'you';
        } else {
          html += data.recipients[i];
        }
        if (i + 1 < data.recipients.length) {
          html += ', ';
        }
      }
      html += ') ';
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
    html += '<span class="buddyItems" id="' + users[i]._id + '">';
    html += '<input type="checkbox">';
    html += users[i].username;
    html += '</span>';
  }
  buddyList.html(html);
}

// hacked in for inventory
var updateInventory = function(data) {
  if (data.inventory) {
    inv = data.inventory;
  }
  var html = '';
  for (var i = 0; i < inv.length; i++) {
    html += '<span class="inv_item" id="' + inv[i]._id + '">';
    html += '<input type="checkbox">';
    html += inv[i].name + ' -- ' + inv[i].description;
    html += '</span><br>';
  }
  inventory.html(html);
}

$(document).ready(function () {
  socket = io.connect(document.URL);
  socket.emit('subscribe', {room: 'chat'});
  socket.emit('subscribe', {room: 'inventory'});

  chatfield = $('#chatfield').select();
  sendButton = $('#sendbtn').select();
  giveItemButton = $('#give_item_btn').select();
  chatbox = $('#chatbox').select();
  buddyList = $('#buddylist').select();
  inventory = $('#inventory').select();

  socket.on('message', function (data) {
    displayMessage(data);
  });

  socket.on('active-users', function(data) {
    updateBuddyList(data);
  });

  // hacked in for inventory
  socket.on('update-inventory', function(data) {
    updateInventory(data);
  });

  socket.on('disconnect', function () {
    data = {
      message: 'Connection to server lost.',
      timestamp: moment(),
      recipients: 'all'
    }
    displayMessage(data);
  });

  sendButton.click(function () {
    var text = chatfield.val();
    var recipients = [];
    buddyList.children().each(function(index, element) {
      var recip = $(element).prop('id');
      if ( $(element).find("input").is(':checked') ) {
        recipients.push(recip);
      }
    });

    var response = {
      message: text,
      recipients: recipients,
      timestamp: moment(),
      room: 'chat'
    };

    socket.emit('chat-send', response);
    chatfield.val('');
  });

  giveItemButton.click(function() {
    var items = [];
    var recipient = null;
    var err = null;

    inventory.children().each(function(index, element) {
      if ( $(element).find("input").is(':checked') ) {
        items.push($(element).prop('id'));
      }
    });
    buddyList.children().each(function(index, element) {
      if ( $(element).find("input").is(':checked') ) {
        if (recipient) {
          // we already have a recipient!
          err = true;
        }
        recipient = $(element).prop('id');
      }
    });

    if (!err) {
      var response = {
        items: items,
        recipient: recipient
      };
      socket.emit('item-transfer', response);
    }
  });


  chatfield.keyup(function (e) {
    if (e.keyCode === 13) {
      sendButton.click();
    }
  });

});
