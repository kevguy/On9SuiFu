/**
* TODO: Stream simple music between clients
*/

// SERVER address and port
var SERVER = 'http://localhost:3700';

var MAIN_ROOM = 'expresschat';

// Chat window is current window
var chatWindow = window.self;

$(window).load(function() {

  // Add regular expression to check username valid
  $.validator.addMethod("regex", function(value, element, regexpr) {          
    return regexpr.test(value);
  }, "Please enter a valid username.");

  // Current user name
  var _username = null;

  // Current user_id
  var _userId = null;

  // socket of current connection
  var socket = io.connect(SERVER);

  // Field of message
  var field = $("#message");

  // Current client_id
  var clientId = null;

  // All users connected
  var users = [];

  // Current room_id. Default is MAIN_ROOM
  var currRoomId = MAIN_ROOM;

  // First register user
  var loginDialog = new BootstrapDialog.show({
    title: 'Login',
    closable: false,
    message: '<form id="login_form">Login ID: <input type="text" name="username" class="form-control" id="username"><br>Login Password: <input type="password" name="password" class="form-control" id="password"></form>',
    onshown: function(dialogRef) {
      $('#username').focus();
    },
    onhidden: function(dialogRef){
      $('#message').focus();
    },
    buttons: [
    {
      label: 'Sign In',
      cssClass: 'btn-primary',
      action: function(dialogRef) {
        $('#login_form').validate({
          debug: true,
          rules: {
            username: {
              required: true,
              regex: /^\S+$/ // Check has no whitespace
            },
            password: "required"
          }
        });

        var username = $('#username').val();
        var password = $('#password').val();

        if ($('#login_form').valid()) {
          _username = username;
          // Login user
          socket.emit('login', { username: username, password: password });
          $('body').after('<div id="active_room" style="display:none;">' + MAIN_ROOM + '</div>');
          $('#profile').text(username);
        }
      }
    },
    {
      label: 'Create Account',
      action: function(dialogRef) {
        $('#login_form').validate({
          debug: true,
          rules: {
            username: {
              required: true,
                regex: /^\S+$/ // Check has no whitespace
            },
            password: "required"
          }
        });

        var username = $('#username').val();
        var password = $('#password').val();

        if ($('#login_form').valid()) {
          _username = username;
          // Register user
          socket.emit('regist', { username: username, password: password });
          $('body').after('<div id="active_room" style="display:none;">' + MAIN_ROOM + '</div>');
          $('#profile').text(username);
        }
      }
    }
    ]
  });

  // On exception, show alert dialog and reset username
  socket.on('exception', function (data) {
    _username = null;

    alert(data.message);
  });

  /** Trigger message event
  * _clientUserId id of user on server database
  * _clientId id of current user socket
  * data hold message data
  */
  socket.on('message', function (_clientUserId, _clientId, data) {
    console.log('Message on room ' + data.room_id);
    var room_id = data.room_id;

    var tempRoom = room_id.split('_');
    var tempRoomId = tempRoom.length == 2 ? tempRoom[1] + '_' + tempRoom[0] : '';

    if(data.message) {
      var cls = 'row';
      // Handle on destination client
      if (_clientId != clientId) {
        cls = 'row_other';
        notifyMe(data);

        // If not is MAIN_ROOM, show unread count message
        if (room_id == MAIN_ROOM) {
          if (currRoomId != MAIN_ROOM) {
            var currUnread = $('#user-list li#main_room .unread').text();
            currUnread++;
            $('#user-list li#main_room .unread').text(currUnread).show();
          }
        } else if (currRoomId != room_id && currRoomId != tempRoomId) {
          // Show unread count message on private chat
          var currUnread = $('#user-list li[data-rid=' + _clientUserId + '] .unread').text();
          currUnread++;
          $('#user-list li[data-rid=' + _clientUserId + '] .unread').text(currUnread).show();
        }
      }

      if (currRoomId == room_id || tempRoomId == currRoomId) {
        // Show message on screen
        var date = new Date();
        var html = '<div class="' + cls + '">' +
        '<div class="r-message"><div class="username">' + data.username + '</div><div class="message">' + data.message + '</div>' +
        '<div class="profile"><img src="/images/profile.jpg" class="img-rounded"></div></div>' +
        '<div class="date">' + date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2) + '</div>' +
        '</div>';
        $('#' + MAIN_ROOM).append(html).scrollTop($('#' + MAIN_ROOM)[0].scrollHeight);
      }
    } else {
      console.log("There is a problem:", data);
    }
  });

  /** Show user after logged in successfully
  * _clientUserId id of user on server database
  * _clientId id of current user socket
  * _users array of all connected users
  */
  socket.on('show_user', function (_clientUserId, _clientId, _users) {
    // Set clientId for the first time
    if (!clientId) {
      clientId = _clientId;
      _userId = _clientUserId;
    }

    // Close login dialog
    loginDialog.close();

    // Main chat room
    if (!$('#main_room').is(':visible')) {
      var html = '<li class="row-user active" id="main_room" data-rid="' + MAIN_ROOM + '"><span class="user_name">Express Chat Room</span><span class="unread">0</span></li>';
      $('#user-list').append(html);
    }
    users = _users;

    // Show all users. If new users connected, only show that user
    for (key in users) {
      var user = users[key];

      var cId = user.client_id;
      var userId = user.user_id;
      var username = user.user_name;

      if (_username == username) {
        continue;
      }

      // If this user is not shown, show it
      if (!$('#' + cId).is(':visible')) {
        var html = '<li class="row-user" id="' + cId + '" data-rid="' + userId + '"><img src="/images/profile.jpg" class="img-circle"><span class="user_name">' + username + '</span><span class="unread">0</span></li>';

        $('#user-list').append(html);
      }
    }

    // Display message history
    socket.emit('load_message', _clientId, MAIN_ROOM);
  });

  /**
  * _clientId id of current user socket
  * room_id room_id that user want to connect to
  */
  socket.on('subscribe', function (_clientId, room_id) {
    // Show messages of this room
    if (_clientId == clientId) {
      currRoomId = room_id;

      console.log('Subscribe Room ' + currRoomId);

      // Load messages for this room
      socket.emit('load_message', _clientId, currRoomId);
      $('#active_room').text(currRoomId);
    }
  });

  // Remove users from data
  socket.on('remove_user', function (_clientId, _users) {
    users = _users;

      // Remove from channel
      $('#' + _clientId).remove();
    });

  socket.on('display_message', function (_clientId, messages) {
    $('#' + MAIN_ROOM).html('');

    for (key in messages) {
      var message = messages[key];
      var user_id = message.user_id;

      var cls = 'row';
      if (_userId != user_id) {
        cls = 'row_other';
      }

      // Show message on screen
      var date = new Date(message.created_at);
      var today = new Date();
      var dateString = '';
      if (date.getDate() == today.getDate() && date.getMonth() == today.getMonth() && date.getFullYear() == today.getFullYear()) {
        // Show only hour and minute
        dateString = date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);
      } else {
        if (date.getFullYear() == today.getFullYear()) {
          dateString = (date.getMonth()+1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);
        } else {
          dateString = date.getFullYear() + '/' + (date.getMonth()+1) + '/' + date.getDate() + ' ' + date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2);
        }
      }
      var html = '<div class="' + cls + '">' +
      '<div class="r-message"><div class="username">' + message.user_name + '</div><div class="message">' + message.message + '</div>' +
      '<div class="profile"><img src="/images/profile.jpg" class="img-rounded"></div></div>' +
      '<div class="date">' + dateString + '</div>' +
      '</div>';
      $('#' + MAIN_ROOM).append(html).scrollTop($('#' + MAIN_ROOM)[0].scrollHeight);
    }
  });

  /**
  * User interaction. Active private chat for user clicked
  */
  $('#user').on('click', '.row-user', function () {
    // Hide unread notify
    $(this).find('.unread').text('').hide();

    var roomId = $(this).attr('data-rid');
    var _clientId = $(this).attr('id'); // Client ID of the socket connected
    var roomTitle = $(this).find('.user_name').text();
    $('.room-title').text(roomTitle);

    $('#user-list li').removeClass('active');

    $('#user-list li[data-rid=' + roomId + ']').addClass('active');

    var activeRoom = _userId + '_' + roomId;
    if ($('#' + activeRoom).length == 0) {
        // Change room for private chat
        socket.emit('subscribe', _userId, _clientId, roomId);
    } else {
      // Only active current private chat
      currRoomId = activeRoom;

      // Load messages for this room
      socket.emit('load_message', _clientId, currRoomId);
      $('#active_room').text(currRoomId);
    }

    $('#message').focus();
  });

  // User click Send button
  $('#send').click(function() {
    var text = field.val().trim();

    if (text !== '') {
      socket.emit('send', { message: text, username: _username, room_id: currRoomId });

      field.val('').focus();
    }
  });

  // Catch when user press Enter on keyboard
  $('#message').keypress(function(e) {
    var text = field.val().trim();

    if (e.which == 13 && text !== '') {
      socket.emit('send', { message: text, username: _username, room_id: currRoomId });

      console.log('Send message in room ' + currRoomId);

      $(this).val('').focus();
    }
  });
});

// Show desktop notification
$(function() {
  // request permission on page load
  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

function notifyMe(data) {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.');
    return;
  }

  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification('New message', {
      icon: SERVER + '/images/so_icon.png',
      body: data.message,
    });

    // Open and active current chat window
    notification.onclick = function () {
      chatWindow.focus();
    };
  }
}
