var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var drawPoints;

ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, c.width, c.height);

var xhr = new XMLHttpRequest();

xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;

    //console.log('status: ' + xhr.status);
    if(this.status == 204) {
        var wcbox = document.getElementById('wordchoicebox');
        wcbox.innerHTML = 'You have no drawings saved.';
        wcbox.style.display = 'block';
        wcbox.style.lineHeight = "" + c.height + "px";
    }else if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        drawPoints = data.points;

        // draw to canvas
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
};

xhr.open('GET', '/drawing', true);
xhr.send();
