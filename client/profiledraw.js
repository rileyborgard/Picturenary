var c = document.getElementById("c");
var ctx = c.getContext("2d");
ctx.imageSmoothingEnabled = false;

var drawPoints;
var index = 0;

var length = document.getElementById("lengthhidden").innerHTML;
var scrollnumber = document.getElementById('scrollnumber');
scrollnumber.innerHTML = "" + (index + 1) + "/" + length;

ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, c.width, c.height);

var loadDrawing = function() {
    var xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState != 4) return;

        //console.log('status: ' + xhr.status);
        if(this.status == 204) {
            var wcbox = document.getElementById('wordchoicebox');
            wcbox.innerHTML = 'Drawing not found';
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

    xhr.open('POST', '/drawing', true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify({
        index: index,
    }));
}

document.getElementById('scrollleftbutton').onclick = function() {
    if(index > 0) {
        index--;
        scrollnumber.innerHTML = "" + (index + 1) + "/" + length;
        loadDrawing();
    }
};
document.getElementById('scrollrightbutton').onclick = function() {
    if(index < length - 1) {
        index++;
        scrollnumber.innerHTML = "" + (index + 1) + "/" + length;
        loadDrawing();
    }
};

loadDrawing();
