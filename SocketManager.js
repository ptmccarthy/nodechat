module.exports = {
  typeToId: {},

  register: function(socket) {
    var socketUser = socket.manager.handshaken[socket.id].user;
    // use this label with appended 'user-' so that we don't
    // have collisions with users and method names
    var userLabel = 'user-' + socketUser.username;
    if (!this[userLabel]) {
      this['user-' + socketUser.username] = [socket];
    } else {
      if (!this.hasSocket(socket)) {
        this[userLabel].push(socket);
      }
    }
  },

  registerAsType: function(socket, type) {
    if (!this.hasSocket(socket)) {
      this.register(socket);
    }
    var types = Object.keys(this.typeToId);
    for (var i = 0; i < types.length; i++){
      if (types[i] == type) {
        if (!this.isSocketOfType(socket)) {
          this.typeToId[type].push(socket.id);
          return;
        }
      }
    }
    this.typeToId[type] = [socket.id];
  },

  unregister: function(socket) {
    // first remove all entries for the socket from
    // the typeToId object
    var types = this.typesForSocket(socket);
    for (var i = 0; i < types.length; i++) {
      this.dissociateFromType(socket, types[i]);
    }

    // then remove the object from the user mappings
    var socketUser = socket.manager.handshaken[socket.id].user;
    var userLabel = 'user-' + socketUser.username;
    var socketsArr = this[userLabel];
    for (var i = 0; i < socketsArr.length; i++) {
      if (socketsArr[i].id === socket.id) {
        socketsArr.splice(i, 1);
      }
    }
  },

  getSocketsOfTypeForUser: function(type, username) {
    var userSockets = this.getSocketsForUser(username);
    var socketsOfType = this.typeToId[type];
    var finalArr = [];
    for (var i = 0; i < userSockets.length; i++) {
      for (var j = 0; j < socketsOfType.length; j++) {
        if (userSockets[i].id == socketsOfType[j]) {
          finalArr.push(userSockets[i]);
        }
      }
    }
    return finalArr;
  },

  getSocketsForUser: function(username) {
    return this['user-' + username];
  },

  isSocketOfType: function(socket, type) {
    var typeSockets = this.typeToId[type];
    var answer = false;
    if (typeSockets === undefined) { return answer; }
    for (var i = 0; i < typeSockets.length; i++) {
      if (typeSockets[i] == socket.id) {
        answer = true;
      }
    }
    return answer;
  },

  typesForSocket: function(socket) {
    var types = Object.keys(this.typeToId);
    var typesForSocket = [];
    for (var i = 0; i < types.length; i++) {
      var typeSockets = this.typeToId[types[i]];
      for (var j = 0; j < typeSockets.length; j++) {
        if (typeSockets[j] == socket.id) {
          typesForSocket.push(types[i]);
        }
      }
    }
    return typesForSocket;
  },

  getSocketsOfType: function(type) {
    var users = this.activeUsers();
    var sockets = [];
    for (var i = 0; i < users.length; i++) {
      var socketsForUser = this.getSocketsOfTypeForUser(type, users[i]);
      sockets = sockets.concat(socketsForUser);
    }
    return sockets;
  },

  hasSocket: function(socket) {
    var answer = false;
    var userLabel = 'user-' + socket.manager.handshaken[socket.id].user.username;
    var socketsArr = this[userLabel];
    for (var i = 0; i < socketsArr.length; i++) {
      if (socketsArr[i].id === socket.id) {
        answer = true;
      }
    }
    return answer;
  },

  dissociateFromType: function(socket, type) {
    for (var i = 0; i < this.typeToId[type].length; i++) {
      if (this.typeToId[type][i] == socket.id) {
        this.typeToId[type].splice(i, 1);
      }
    }
  },

  activeUsers: function() {
    var keys = Object.keys(this);
    var users = [];
    for (var index in  keys) {
      if (keys[index].substring(0, 5) === 'user-') {
        if (this[keys[index]].length > 0) {
          users.push(keys[index].substring(5));
        }
      }
    }
    return users;
  }
};
