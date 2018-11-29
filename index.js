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

var updatePlayers = false;
var players = {};
var io = require('socket.io')(serv, {});

var messages = [];
var drawpoints = [];
var lineWidth = [1.0 / 500, 4.0 / 500, 10.0 / 500];

var onUndo = function(data) {
    var i = drawpoints.length - 1;
    for(; i >= 0; i--) {
        if(drawpoints[i].type != 'drag') {
            break;
        }
    }
    drawpoints.splice(i);
}

io.sockets.on('connection', function(socket) {
    socket.on('enterGame', function(enterData) {
        sockets[socket.id] = socket;
        players[socket.id] = enterData.name;
        updatePlayers = true;

        socket.emit('enterGame', {});
        socket.emit('id', socket.id);

        socket.on('disconnect', function() {
            delete players[socket.id];
            delete sockets[socket.id];
            updatePlayers = true;
        });
        socket.on('guess', function(data) {
            data.name = players[socket.id];
            messages.push(data);
        });
        socket.on('draw', function(data) {
            data.lineWidth = lineWidth[data.thickness - 1];
            drawpoints.push(data);
        });
        socket.on('clear', function(data) {
            drawpoints = [];
        });
        socket.on('undo', onUndo);
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
        if(updatePlayers) {
            socket.emit('players', players);
        }
    }
    updatePlayers = false;
}, 1000/40);
