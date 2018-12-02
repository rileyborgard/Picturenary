var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');

function ensureAuthenticated(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}else {
		req.flash('error_msg', 'You are not logged in');
		res.redirect('/login');
	}
}

router.get('/', function(req, res) {
    res.render('index');
});
router.get('/login', function(req, res) {
    res.render('login', {layout: 'menulayout'});
});
router.get('/register', function(req, res) {
    res.render('register', {layout: 'menulayout'});
});
router.get('/profile', ensureAuthenticated, function(req, res) {
    res.render('profile', {layout: 'menulayout'});
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
			errors: errors,
            layout: 'menulayout',
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
				res.redirect('/register');
			}
		});
	}
});

router.post('/login',
	passport.authenticate('local', {successRedirect:'/', failureRedirect:'/login', failureFlash:true}),
	function(req, res) {
		res.redirect('/');
	});

module.exports = router;
