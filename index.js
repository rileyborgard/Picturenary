// server garbege
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

io.sockets.on('connection', function(socket) {
    socket[socket.id] = socket;
    socket.emit('id', socket.id);
});
