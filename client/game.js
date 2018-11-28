var c = document.getElementById("c");
var ctx = c.getContext("2d");

socket = io();
var myId;
var drawPoints;

socket.on('id', function(data) {
    myId = data;
});

// function to draw to the screen
function draw() {
    // clear screen
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 500, 500);

    ctx.fillStyle = "#000";
    for(var i in drawPoints) {
        ctx.fillRect(drawPoints[i].x, drawPoints[i].y, 4, 4);
    }
}

setInterval(draw, 1000 / 60);

socket.on('messages', function(data) {
    var messageBox = document.getElementById("messagebox");
    for(var i in data) {
        messageBox.innerHTML += data[i] + "<br>";
    }
});
socket.on('drawing', function(data) {
    drawPoints = data;
});

var guessinput = document.getElementById("guessinput");
guessinput.addEventListener('keydown', function(e) {
    if(e.keyCode == 13) {
        //enter key was pressed
        socket.emit('guess', guessinput.value);
        guessinput.value = "";
    }
});

c.addEventListener('mousedown', function(e) {
    var mx = e.offsetX;
    var my = e.offsetY;
    socket.emit('click', {
        x: mx,
        y: my,
    });
});
