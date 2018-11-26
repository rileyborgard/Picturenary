var c = document.getElementById("c");
var ctx = c.getContext("2d");

socket = io();
var myId;

socket.on('id', function(data) {
    myId = data;
});

// function to draw to the screen
function draw() {
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 500, 500);
    ctx.fillStyle = "#000";
    ctx.fillText("" + myId, 100, 100);
    ctx.fillText("" + socket.id, 100, 200);
}

setInterval(draw, 1000 / 60);
