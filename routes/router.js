var express = require('express');
var router = express.Router();

var User = require('../models/user');

router.get('/', function(req, res) {
    res.render('index');
});
router.get('/login', function(req, res) {
    res.render('login');
});
router.get('/register', function(req, res) {
    res.render('register');
});

router.post('/register', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
    var email = req.body.email;

	//validation
	req.checkBody('username', 'Username is required').notEmpty();
	req.checkBody('password', 'Password is required').notEmpty();
	req.checkBody('email', 'Not a valid email').isEmail();
	var errors = req.validationErrors();

    if(errors) {
		res.render('register', {
			errors: errors
		});
	}else {
		var newUser = new User({
			username: username,
			password: password,
			email: email,
            displayname: 'My name',
		});
		User.getUserByUsername(newUser.username, function(err1, user1) {
			if(err1)
				throw err1;
			else if(!user1) {
				User.createUser(newUser, function(err, user) {
					if(err) {
						throw err;
						req.flash('error_msg', 'This username is already taken');
						res.redirect('/register');
					}else {
						req.flash('success_msg', 'Successfully registered! Please login');
						res.redirect('/login');
					}
				});
			}else {
				req.flash('error_msg', 'Error registering');
				res.redirect('/users/register');
			}
		});
	}
});

module.exports = router;
