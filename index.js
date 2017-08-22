// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var users = {};

io.on('connection', function (socket) {
    var addedUser = false;

    // when the client emits 'new message', this listens and executes
    socket.on('new message', function (data) {
        // we tell the client to execute 'new message'
        socket.broadcast.to(socket.room).emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', function (username, room) {
        if (addedUser) return;

        socket.room = room;
        socket.username = username;
        socket.join(socket.room);

        if (!users[socket.room])
            users[socket.room] = new Array();
        users[socket.room].push(username);

        addedUser = true;
        socket.emit('login', {
            room: socket.room,
            users: users[socket.room]
        });
        // echo globally (all clients) that a person has connected
        socket.broadcast.to(socket.room).emit('user joined', {
            username: socket.username,
            room: socket.room,
            users: users[socket.room]
        });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', function () {
        socket.broadcast.to(socket.room).emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function () {
        socket.broadcast.to(socket.room).emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        if (addedUser) {
            addedUser = false;
            let idx = users[socket.room].indexOf(socket.username);
            users[socket.room].splice(idx, 1);
            // echo globally that this client has left
            socket.broadcast.to(socket.room).emit('user left', {
                username: socket.username,
                room: socket.room,
                users: users[socket.room]
            });
        }
    });

});