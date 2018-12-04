var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var UserSchema = mongoose.Schema({
    username: {
        type: String,
        index: {unique: true, dropDups: true},
    },
    password: {
        type: String,
    },
    email: {
        type: String,
    },
    displayname: {
        type: String,
    },
    drawings: [[{
        type: {type: String},
        x: Number,
        y: Number,
        thickness: String,
        color: String,
    }]],
});

var User = mongoose.model('User', UserSchema);

User.createUser = function(newUser, callback) {
	bcrypt.genSalt(10, function(err, salt) {
		bcrypt.hash(newUser.password, salt, function(err, hash) {
			newUser.password = hash;
			newUser.save(callback);
		});
	});
}

User.getUserByUsername = function(username, callback) {
	var query = {username: username};
	User.findOne(query, callback);
}

User.getUserById = function(id, callback) {
	User.findById(id, callback);
}

User.comparePassword = function(candidatePassword, hash, callback) {
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
		if(err) throw err;
		callback(null, isMatch);
	});
}

User.addDrawing = function(userId, newDrawing, callback) {
    User.getUserById(userId, function(err, user) {
        if(err) {
            throw err;
        }else if(user) {
            user.drawings.push(newDrawing);
            user.save(callback);
        }
    });
}

module.exports = User;
