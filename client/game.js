var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var socket;
var myId;
var word = "";
var drawPoints = [];
var thickness = 1;
var color = 'black';
var colors = ['black', 'white', 'red', 'yellow', 'green', 'blue'];
var colorButtons = ['blackbutton', 'whitebutton', 'redbutton', 'yellowbutton', 'greenbutton', 'bluebutton'];

const drawTimeSec = 80;

var turnDate = new Date();
var timerOffset = 10000;

var enterGame = function() {
    socket = io();
    socket.emit('enterGame', {
        name: document.getElementById('namehidden').innerHTML,
    });
    socket.on('enterGame', function(enterData) {
        socket.on('id', function(data) {
            myId = data;
        });
        // incoming data
        socket.on('messages', function(data) {
            var messageBox = document.getElementById("messagebox");
            for(var i in data) {
                if(data[i].displayname) {
                    data[i].text = '<b>' + data[i].name + "</b>: " + data[i].text;
                }
                if(data[i].special) {
                    data[i].text = '<span style="color:#008800">' + data[i].text + '</span>';
                }
                messageBox.innerHTML += data[i].text + "<br>";
                messageBox.scrollTop = messageBox.scrollHeight;
            }
        });
        socket.on('drawing', function(data) {
            //drawPoints = drawPoints.concat(data);
            for(var i = 0; i < data.length; i++) {
                if(data[i].type == 'clear') {
                    drawPoints = [];
                }else if(data[i].type == 'undo') {
                    var j = drawPoints.length - 1;
                    for(; j >= 0; j--) {
                        if(drawPoints[j].type != 'drag') {
                            break;
                        }
                    }
                    drawPoints.splice(j);
                }else {
                    drawPoints.push(data[i]);
                }
            }
        });
        socket.on('players', function(data) {
            var userBox = document.getElementById('userbox');
            var players = data.players;
            var drawerId = data.drawerId;
            userBox.innerHTML = "";
            for(var i in players) {
                if(players[i].id == drawerId) {
                    userBox.innerHTML += '<div class="user"><img src="client/img/pencil.png" width="16px" height="16px"><b>' + players[i].name + '</b><br>Score: ' + players[i].score + '</div>';
                }else if(players[i].guessed) {
                    userBox.innerHTML += '<div class="user" style="background-color: #ccffcc;"><b>' + players[i].name + '</b><br>Score: ' + players[i].score + '</div>';
                }else {
                    userBox.innerHTML += '<div class="user"><b>' + players[i].name + '</b><br>Score: ' + players[i].score + '</div>';
                }
            }
            var toolbox = document.getElementById('toolbox');
            if(socket && socket.id == drawerId) {
                toolbox.style.display = "";
            }else {
                toolbox.style.display = "none";
            }
        });
        socket.on('word', function(data) {
            word = data;
            document.getElementById('word').innerHTML = word;
        });
        socket.on('timer', function(data) {
            turnDate = new Date();
            timerOffset = data;
        });
        socket.on('wordchoices', function(data) {
            var wcbox = document.getElementById('wordchoicebox');
            wcbox.style.display = "block";
            wcbox.style.lineHeight = "" + c.height + "px";
            wcbox.innerHTML = '<input id="wordChoice" type="button" value="' + data[0] + '" onclick="chooseWord(0);" />';
            wcbox.innerHTML += '<input id="wordChoice" type="button" value="' + data[1] + '" onclick="chooseWord(1);" />';
            wcbox.innerHTML += '<input id="wordChoice" type="button" value="' + data[2] + '" onclick="chooseWord(2);" />';
        });
        socket.on('choosing', function(data) {
            if(data) {
                // the next word is being chosen
                timerOffset = 10000;
            }else {
                var wcbox = document.getElementById('wordchoicebox');
                wcbox.style.display = "none";
            }
        });
    });
}

var chooseWord = function(idx) {
    if(socket) {
        socket.emit('wordchoice', idx);
        var wcbox = document.getElementById('wordchoicebox');
        wcbox.style.display = "none";
    }
}

// updating things that cannot be triggered by an event
function update() {
    var secs = Math.round(Math.max(drawTimeSec - timerOffset - (new Date() - turnDate) / 1000, 0));
    document.getElementById("timerbox").innerHTML = secs;
}

// function to draw to the screen
function draw() {
    update();
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
c.addEventListener('touchend', function(e) {
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
c.addEventListener('touchstart', function(e) {
    mousedown = true;
    var touch = e.touches[0];
    var rect = c.getBoundingClientRect();
    var mx = 1.0 * (touch.clientX - rect.left) / c.width;
    var my = 1.0 * (touch.clientY - rect.top) / c.height;
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
c.addEventListener('touchmove', function(e) {
    if(mousedown) {
        var touch = e.touches[0];
        var rect = c.getBoundingClientRect();
        var mx = 1.0 * (touch.clientX - rect.left) / c.width;
        var my = 1.0 * (touch.clientY - rect.top) / c.height;
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

enterGame();
