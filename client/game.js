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

socket.on('messages', function(data) {
    var messageBox = document.getElementById("messagebox");
    messageBox.innerHTML = "";
    for(var i in data) {
        messageBox.innerHTML += data[i] + "<br>";
    }
});

var guessinput = document.getElementById("guessinput");
guessinput.addEventListener('keydown', function(e) {
    if(e.keyCode == 13) {
        //enter key was pressed
        socket.emit('guess', guessinput.value);
        guessinput.value = "";
    }
});
