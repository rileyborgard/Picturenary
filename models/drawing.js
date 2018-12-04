var mongoose = require('mongoose');

var DrawingSchema = mongoose.Schema({
    userid: {
        type: String,
        index: true,
    },
    points: [{
        type: {type: String},
        x: Number,
        y: Number,
        thickness: String,
        color: String,
    }],
});

var Drawing = mongoose.model('Drawing', DrawingSchema);

Drawing.getDrawingByUserId = function(userid, callback) {
	var query = {userid: userid};
	Drawing.findOne(query, callback);
}

Drawing.createDrawing = function(userId, drawpoints, callback) {
    var drawing = new Drawing({
        userid: userId,
        points: drawpoints,
    });
    drawing.save(callback);
}

module.exports = Drawing;
