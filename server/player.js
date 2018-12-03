
var Player = function(id, name) {
    var self = {
        id: id,
        name: name,
        score: 0,
        guessed: false,
    };
    return self;
}

module.exports = Player;
