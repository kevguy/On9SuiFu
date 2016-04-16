var express = require("express");
var mongoose = require('mongoose');
var assert = require("assert");
var favicon = require('serve-favicon');
var autoIncrement = require('mongoose-auto-increment');
var functions = require("./public/js/functions.js");

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth2').Strategy;


var googleUser = null;

var reversi = require("./public/js/reversi.js");
//var url = 'mongodb://localhost:27017/chat';
var url = 'mongodb://johndoe:iamnumber1@ds011321.mlab.com:11321/kevchat';
var Schema = mongoose.Schema;
var connection = mongoose.createConnection(url);
autoIncrement.initialize(connection);

// Defining model for mongodb
var userSchema = new Schema({
  oauthID: Number,
  user_id: Number,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: Date,
  updated_at: Date
});

// Add the date before any save
userSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

var messageSchema = new Schema({
  message_id: Number,
  user_id: String,
  user_name: String,
  room_id: String,
  message: String,
  created_at: Date
});

// Add the date before any save
messageSchema.pre('save', function(next) {
  // get the current date
  var currentDate = new Date();
  
  // change the updated_at field to current date
  this.updated_at = currentDate;

  // if created_at doesn't exist, add to that field
  if (!this.created_at)
    this.created_at = currentDate;

  next();
});

// Create User and Message schema
userSchema.plugin(autoIncrement.plugin, {
  model: 'User',
  field: 'user_id',
  startAt: 1,
  incrementBy: 1
});
messageSchema.plugin(autoIncrement.plugin, {
  model: 'Message',
  field: 'message_id',
  startAt: 1,
  incrementBy: 1
});

// Create User and Message schema
var User = connection.model('User', userSchema);
var Message = connection.model('Message', messageSchema);

// serialize and deserialize
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


passport.use(new GoogleStrategy({
  clientID: '425570416506-kjrcqloc0maknnm0jeckehnlpcnmqt8m.apps.googleusercontent.com',
  clientSecret: 'C8LpBR8B1ep7nzxNoE7ExVx8',
  callbackURL: 'http://127.0.0.1:3700/auth/google/callback',
  passReqToCallback: true
  },
  function(request, accessToken, refreshToken, profile, done) {
    //console.log('Google Rules');
    googleUser = profile;
    //console.log(googleUser.id);
    //console.log(googleUser.displayName);
    //done(null, user);
    
    process.nextTick(function () {
      googleUser.id = profile.id;
      googleUser.displayName = profile.displayName;
      googleUser = profile;
      return done(null, profile);
    });
    
  }));



var app = express();
var http = require('http');
var server = http.createServer(app);
var port = 3700;
var users = [];
var userSockets = [];
var rooms = [];
var mainRoom = 'expresschat';

// Setting template engine Jade
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);

app.use(passport.initialize());
app.use(passport.session());


app.get("/", function(req, res){
  res.render("index");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/plus.profile.emails.read'
  ] }
));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
    console.log(googleUser.displayName);
  });

// Require public folder resources
app.use(express.static(__dirname + '/public'));
app.use(favicon(__dirname + '/public/favicon.ico'));

// Pass express to socket.io
var io = require('socket.io').listen(server);

// Initiate socket to handle all connection
io.sockets.on('connection', function (socket) {

  if (googleUser != null){
    //console.log('googleUser is not null');
    //console.log('See?');
    //console.log(googleUser.displayName);
    socket.emit('google_roundtrip', googleUser);
  }

	var _clientId = socket.id;

  socket.join(mainRoom);

  if (rooms.indexOf(mainRoom) == -1) {
    rooms.push(mainRoom);
  }

  // Load message for rooms
  socket.on('load_message', function (_clientId, roomId) {
    console.log('Loading message for room ' + roomId);
    boardData = [
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,2,1,0,0,0],
      [0,0,0,1,2,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0],
    ];
    var rooms = roomId.split('_');
    if (rooms.length == 2) {
      var room2 = rooms[1] + '_' + rooms[0];
      console.log('Load from ' + roomId + ' - ' + room2);
      Message.find().or([{ room_id: roomId }, { room_id: room2}]).sort({'created_at': 'asc'}).exec(function (err, messages) {
        socket.emit('display_message', _clientId, messages, boardData);
      });
    } else {
      Message.find({ room_id: roomId }).sort({'created_at': 'asc'}).exec(function (err, messages) {
        socket.emit('display_message', _clientId, messages, boardData);
      });
    }
  });

  // Initialize reversis
  //var playerX = reversi.createHuman("X");
  //var playerO = reversi.createHuman("O");
  reversi.Main();
  // Trigger on send event
  socket.on('send', function (data) {
    var _clientUser = functions.findByKey(users, 'client_id', _clientId);
    var _clientUserId = _clientUser.user_id;
    
    var message = new Message({
      user_id: _clientUserId,
      user_name: data.username,
      room_id: data.room_id,
      message: data.message
    });
    message.save(function (err) {
      if (err != null) {
        console.log('There is an error saving data ' + err);
      }

    });
	   // Reversi logic
	   //var row = data.message.charAt(0);	// [1-8]
	   //var col = data.message.charAt(1);	// [a-h]
	   
    io.sockets.in(data.room_id).emit('message', _clientUserId, _clientId, data);
    if (data.message.search("@Reversi ") == 0){
	    console.log(data.message.substr(9,2));
	    console.log(data.message);
		destination=data.message.substr(9,2);
		console.log(destination);
		col=destination.charAt(0).charCodeAt(0)-96
		row=destination.charAt(1);
		destination.charCodeAt(0)
		console.log( "row = " + row);
		console.log( "col = " + col );
		reversi.nextMove(row, col);
	}
  });

  socket.on('subscribe', function (_clientUserId, clientId, room_id) {
    if (room_id != mainRoom) {
      room_id = room_id + '_' + _clientUserId;
      
      if (rooms.indexOf(room_id) == -1) {
        // Create private chat between this socket and client
        socket.join(room_id);
        userSockets[clientId].join(room_id);

        rooms.push(room_id);
      }
    }

    // Create message content to hold between these two users
    io.sockets.in(room_id).emit('subscribe', _clientId, room_id);
  });

  // Listen for regist action
  socket.on('regist', function (data) {
    User.findOne({ username: data.username }, function (err, user) {
      if (user == null) {
        var newUser = new User({
          username: data.username,
          password: data.password
        });

        // Save user to database
        newUser.save(function (err) {
          console.log(err);

          if (err == null) {
            // Make this user online
            User.findOne({ username: data.username }, function (err, user) {
              console.log('User ' + user.username + ' is online');

              users.push({"client_id" : _clientId, "user_name" : data.username, "user_id": user.user_id});

              userSockets[_clientId] = socket;
              
              // Add new user to channel
              io.sockets.emit('show_user', user.user_id, _clientId, users);
            });
          }
        })
      } else {
        socket.emit('exception', {message: 'This user is already registered'});
      }
    });
  });
  
  // Login event
  socket.on('login', function (data) {
    User.findOne({ username: data.username }, function (err, user) {
      if (user == null) {
        socket.emit('exception', {message: 'This user is not exist. Please create your account !'});
      } else {
        User.findOne( { username: data.username, password: data.password }, function (err, user) {
          if (user == null) {
            socket.emit('exception', {message: 'Wrong password !'});
          } else {
            console.log('User ' + user.username + ' is online');
            // Add new user to store
            users.push({"client_id" : _clientId, "user_name" : data.username, "user_id": user.user_id});

            userSockets[_clientId] = socket;

            // Add new user to channel
            io.sockets.emit('show_user', user.user_id, _clientId, users);
          }
        });
      }
    });
  });

  // Google Login
  socket.on('google_login', function(googleUserData){




    console.log('starting running google_login');
    User.findOne({oauthID: googleUserData.id}, function(err, user){

      if (user == null){
        // can't find user in database
        // action: make this user online and  save this user into our database
        var newUser = new User({
          oauthID: googleUserData.id,
          username: googleUserData.displayName,
          password: 'Not Required'
        });

        // Save user to database
        newUser.save(function (err) {
          console.log(err);

          if (err == null) {
            // Make this user online
            User.findOne({ username: googleUserData.displayname }, function (err, user) {
              console.log('User ' + user.username + ' is online');

              users.push({oauthID: googleUserData.id, "client_id" : _clientId, "user_name" : googleUserData.displayName, "user_id": user.user_id});

              userSockets[_clientId] = socket;
              
              // Add new user to channel
              io.sockets.emit('show_user', user.user_id, _clientId, users);
            });
          }
        });
      } else {
        // This user has already registered, log this guy in
        users.push({oauthID: googleUserData.id, "client_id" : _clientId, "user_name" : googleUserData.displayName, "user_id": user.user_id});
        userSockets[_clientId] = socket;

        // Add new user to channel
        io.sockets.emit('show_user', user.user_id, _clientId, users);
      }
    });
  });

  // Listen for disconnect event
  socket.on('disconnect', function () {
    // Update current users online
    functions.removeObject(users, _clientId);

    // Remove user from all client channel
    io.sockets.emit('remove_user', _clientId, users);

    googleUser = null;

    console.log('User ' + _clientId + ' disconnected');
  });
});

server.listen(port);
console.log('Server started on port ' + port);


// test authentication
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}