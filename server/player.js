
var Player = function(name) {
    var self = {
        name: name,
        score: 0,
        guessed: false,
    };
    return self;
}

module.exports = Player;
