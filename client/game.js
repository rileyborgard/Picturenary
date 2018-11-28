var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

socket = io();
var myId;
var drawPoints;
var thickness = 1;

socket.on('id', function(data) {
    myId = data;
});

// function to draw to the screen
function draw() {
    // clear screen
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = "#000";
    for(var i in drawPoints) {
        if(drawPoints[i].type == 'click') {
            ctx.beginPath();
            ctx.arc(c.width * drawPoints[i].x, c.height * drawPoints[i].y, c.width * drawPoints[i].lineWidth / 2, 0, 2 * Math.PI, false);
            ctx.fill();

            //ctx.fillRect(c.width * drawPoints[i].x, c.height * drawPoints[i].y + 0.5, drawPoints[i].lineWidth, drawPoints[i].lineWidth);
            //ctx.fillRect(Math.round(c.width * drawPoints[i].x), Math.round(c.height * drawPoints[i].y) + 0.5, 1, 1);
        }else if(drawPoints[i].type == 'drag' && i > 0) {
            ctx.beginPath();
            ctx.lineWidth = c.width * drawPoints[i].lineWidth;
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

// buttons
document.getElementById('thickness1').onclick = function() {
    thickness = 1;
};
document.getElementById('thickness2').onclick = function() {
    thickness = 2;
};
document.getElementById('thickness3').onclick = function() {
    thickness = 3;
};
document.getElementById('trashbutton').onclick = function() {
    socket.emit('clear', {});
}

// incoming data
socket.on('messages', function(data) {
    var messageBox = document.getElementById("messagebox");
    for(var i in data) {
        messageBox.innerHTML += data[i] + "<br>";
    }
});
socket.on('drawing', function(data) {
    drawPoints = data;
});

// events
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
        thickness: thickness,
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
            thickness: thickness,
        });
    }
});
