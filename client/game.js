var c = document.getElementById("c");
var ctx = c.getContext("2d");

c.width = "500";
c.height = "500";

// function to draw to the screen
function draw() {
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, 500, 500);
}

setInterval(draw, 1000 / 60);
