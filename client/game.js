var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

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
        if(drawPoints[i].type == 'click') {
            ctx.fillRect(c.width * drawPoints[i].x, c.height * drawPoints[i].y + 0.5, 1, 1);
            //ctx.fillRect(Math.round(c.width * drawPoints[i].x), Math.round(c.height * drawPoints[i].y) + 0.5, 1, 1);
        }else if(drawPoints[i].type == 'drag' && i > 0) {
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.lineJoin = ctx.lineCap = 'round';
            //ctx.moveTo(Math.round(c.width * drawPoints[i - 1].x), Math.round(c.height * drawPoints[i - 1].y) + 0.5);
            //ctx.lineTo(Math.round(c.width * drawPoints[i].x), Math.round(c.height * drawPoints[i].y) + 0.5);
            ctx.moveTo(c.width * drawPoints[i - 1].x, c.height * drawPoints[i - 1].y + 0.5);
            ctx.lineTo(c.width * drawPoints[i].x, c.height * drawPoints[i].y + 0.5);
            ctx.stroke();
        }
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

var mousedown = false;
c.addEventListener('mouseup', function(e) {
    mousedown = false;
});
c.addEventListener('mouseleave', function(e) {
    mousedown = false;
});

c.addEventListener('mousedown', function(e) {
    mousedown = true;
    var mx = 1.0 * e.offsetX / c.width;
    var my = 1.0 * e.offsetY / c.height;
    socket.emit('draw', {
        type: 'click',
        x: mx,
        y: my,
    });
});
c.addEventListener('mousemove', function(e) {
    if(mousedown) {
        var mx = 1.0 * e.offsetX / c.width;
        var my = 1.0 * e.offsetY / c.height;
        socket.emit('draw', {
            type: 'drag',
            x: mx,
            y: my,
        });
    }
});
