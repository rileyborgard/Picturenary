var mongoose = require('mongoose');

var DrawingSchema = mongoose.Schema({
    userid: String,
    word: String,
    points: [{
        type: {type: String},
        x: Number,
        y: Number,
        lineWidth: String,
        color: String,
    }],
});

var Drawing = mongoose.model('Drawing', DrawingSchema);

Drawing.getDrawingByUserId = function(userid, callback) {
	var query = {userid: userid};
	Drawing.findOne(query, callback);
}

Drawing.getDrawingById = function(drawingid, callback) {
    var query = {_id: drawingid};
    Drawing.findOne(query, callback);
}

Drawing.createDrawing = function(userId, word, drawpoints, callback) {
    var drawing = new Drawing({
        userid: userId,
        word: word,
        points: drawpoints,
    });
    drawing.save(callback);
}

module.exports = Drawing;
