// server garbage
var express = require('express');
var app = express();
var serv = require('http').Server(app);
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));
serv.listen(process.env.PORT || 2000, '0.0.0.0');
console.log('server started');

var sockets = {};
var io = require('socket.io')(serv, {});

var messages = [];
var drawpoints = [];

io.sockets.on('connection', function(socket) {
    sockets[socket.id] = socket;
    socket.emit('id', socket.id);
    socket.on('guess', function(data) {
        console.log(data);
        messages.push(data);
    });
    socket.on('draw', function(data) {
        drawpoints.push(data);
    });
});

setInterval(function() {
    // send the first n messages, like a queue
    var n = messages.length;
    var messageData = messages.slice(0, n);
    messages.splice(0, n);
    for(var id in sockets) {
        var socket = sockets[id];
        socket.emit('messages', messageData);
        socket.emit('drawing', drawpoints);
    }
}, 1000/40);
