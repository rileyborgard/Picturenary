var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var socket;
var myId;
var drawPoints;
var thickness = 1;
var color = 'black';
var colors = ['black', 'white', 'red', 'yellow', 'green', 'blue'];
var colorButtons = ['blackbutton', 'whitebutton', 'redbutton', 'yellowbutton', 'greenbutton', 'bluebutton'];

var enterGame = function() {
    socket = io();
    socket.emit('enterGame', {
        name: document.getElementById('nameinput').value,
    });
    socket.on('enterGame', function(enterData) {
        document.getElementById('entergamebox').style.display = 'none';
        document.getElementById('gamecontentbox').style.display = "";

        socket.on('id', function(data) {
            myId = data;
        });
        // incoming data
        socket.on('messages', function(data) {
            var messageBox = document.getElementById("messagebox");
            for(var i in data) {
                messageBox.innerHTML += '<b>' + data[i].name + "</b>: " + data[i].text + "<br>";
            }
        });
        socket.on('drawing', function(data) {
            drawPoints = data;
        });
        socket.on('players', function(data) {
            var userBox = document.getElementById('userbox');
            var players = data.players;
            var drawerId = data.drawerId;
            userBox.innerHTML = "";
            for(var i in players) {
                if(i == drawerId) {
                    userBox.innerHTML += '<div class="user"><img src="client/pencil.png" width="16px" height="16px"><b>' + players[i].name + '</b><br>Score: ' + players[i].score + '</div>';
                }else {
                    userBox.innerHTML += '<div class="user"><b>' + players[i].name + '</b><br>Score: ' + players[i].score + '</div>';
                }
            }
        });
        socket.on('drawerId', function(data) {

        });
    });
}

// function to draw to the screen
function draw() {
    // clear screen
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = "#000";
    for(var i in drawPoints) {
        if(drawPoints[i].type == 'click') {
            ctx.beginPath();
            ctx.fillStyle = drawPoints[i].color;
            ctx.arc(c.width * drawPoints[i].x, c.height * drawPoints[i].y, c.width * drawPoints[i].lineWidth / 2, 0, 2 * Math.PI, false);
            ctx.fill();

            //ctx.fillRect(c.width * drawPoints[i].x, c.height * drawPoints[i].y + 0.5, drawPoints[i].lineWidth, drawPoints[i].lineWidth);
            //ctx.fillRect(Math.round(c.width * drawPoints[i].x), Math.round(c.height * drawPoints[i].y) + 0.5, 1, 1);
        }else if(drawPoints[i].type == 'drag' && i > 0) {
            ctx.beginPath();
            ctx.strokeStyle = drawPoints[i].color;
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
var setThickness = function(newThickness) {
    var thicknessButton = document.getElementById('thickness' + thickness);
    thicknessButton.style.background = "";
    thickness = newThickness;
    thicknessButton = document.getElementById('thickness' + thickness);
    thicknessButton.style.background = '#00ffff';
}

document.getElementById('thickness1').onclick = function() {
    setThickness(1);
};
document.getElementById('thickness2').onclick = function() {
    setThickness(2);
};
document.getElementById('thickness3').onclick = function() {
    setThickness(3);
};
// buttons that communicate with server
document.getElementById('trashbutton').onclick = function() {
    if(socket) {
        socket.emit('clear', {});
    }
}
document.getElementById('undo').onclick = function() {
    if(socket) {
        socket.emit('undo', {});
    }
};

document.getElementById('enterguestbutton').onclick = enterGame;

var setColor = function(newColor) {
    var lastColorButton = document.getElementById(color + 'button');
    lastColorButton.style.width = '32px';
    lastColorButton.style.height = '32px';
    color = newColor;
    lastColorButton = document.getElementById(color + 'button');
    lastColorButton.style.width = '46px';
    lastColorButton.style.height = '46px';
}
document.getElementById('blackbutton').onclick = function() { setColor('black'); };
document.getElementById('whitebutton').onclick = function() { setColor('white'); };
document.getElementById('redbutton').onclick = function() { setColor('red'); };
document.getElementById('yellowbutton').onclick = function() { setColor('yellow'); };
document.getElementById('greenbutton').onclick = function() { setColor('green'); };
document.getElementById('bluebutton').onclick = function() { setColor('blue'); };

setColor('black');
setThickness(1);

// events
var guessinput = document.getElementById("guessinput");
guessinput.addEventListener('keydown', function(e) {
    if(e.keyCode == 13) {
        //enter key was pressed
        if(socket) {
            socket.emit('guess', {
                text: guessinput.value,
                name: 'Jim',
            });
        }
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
    if(socket) {
    socket.emit('draw', {
            type: 'click',
            x: mx,
            y: my,
            thickness: thickness,
            color: color,
        });
    }
});
c.addEventListener('mousemove', function(e) {
    if(mousedown) {
        var mx = 1.0 * e.offsetX / c.width;
        var my = 1.0 * e.offsetY / c.height;
        if(socket) {
        socket.emit('draw', {
                type: 'drag',
                x: mx,
                y: my,
                thickness: thickness,
                color: color,
            });
        }
    }
});
