// server garbage
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var serv = require('http').Server(app);
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
mongoose.connect('mongodb://rborgard:ThisprojectTookafoReverAndaHalf@picturenary-shard-00-00-qmtky.mongodb.net:27017,picturenary-shard-00-01-qmtky.mongodb.net:27017,picturenary-shard-00-02-qmtky.mongodb.net:27017/test?ssl=true&replicaSet=Picturenary-shard-0&authSource=admin&retryWrites=true');
var router = require('./routes/router');
var User = require('./models/user');

app.set('views', './views');
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

// parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

// validator
app.use(expressValidator({
	errorFormatter: function(param, msg, value) {
		var namespace = param.split('.'),
		root = namespace.shift(),
		formParam = root;
		while(namespace.length) {
			formParam += '[' + namespace.shift() + ']';
		}
		return {
			param: formParam,
			msg: msg,
			value: value
		};
	}
}));

// session
app.use(session({
	secret: 'secret',
	saveUninitialized: true,
	resave: true
}));

// passport
passport.use(new LocalStrategy(
	function(username, password, done) {
		User.getUserByUsername(username, function(err, user) {
			if(err) throw err;
			if(!user) {
				return done(null, false, {message: 'Unknown User'});
			}
			User.comparePassword(password, user.password, function(err, isMatch) {
				if(err) throw err;
				if(isMatch) {
					return done(null, user);
				}else {
					return done(null, false, {message: 'Invalid password'});
				}
			});
		});
	}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});
passport.deserializeUser(function(id, done) {
	User.getUserById(id, function(err, user) {
		done(err, user);
	});
});

app.use(passport.initialize());
app.use(passport.session());

// flash
app.use(flash());
app.use(function(req, res, next) {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	res.locals.user = req.user || null;
	next();
});

app.use('/', router);
app.use('/client', express.static(__dirname + '/client'));
serv.listen(process.env.PORT || 2000, '0.0.0.0');
console.log('server started');

var sockets = {};

var updateWord = false;
var word = 'potato';
var wordBlanks = '_ _ _ _ _ _';

var updatePlayers = false;
var Player = require('./server/player.js');
var players = {};
var drawerId = null;
var io = require('socket.io')(serv, {});

var messages = [];
var drawpoints = [];
var lineWidth = [1.0 / 500, 4.0 / 500, 10.0 / 500];

var onUndo = function(data) {
    var i = drawpoints.length - 1;
    for(; i >= 0; i--) {
        if(drawpoints[i].type != 'drag') {
            break;
        }
    }
    drawpoints.splice(i);
}
var sanitize = function(str) {
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/\"/g, "&quot;");
    str = str.replace(/\'/g, "&#039;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/>/g, "&gt;");
    return str;
}

io.sockets.on('connection', function(socket) {
    socket.on('enterGame', function(enterData) {
        if(drawerId == null) {
            drawerId = socket.id;
        }
        sockets[socket.id] = socket;
        players[socket.id] = Player(sanitize(enterData.name));
        console.log(players[socket.id].name);
        updatePlayers = true;
        updateWord = true;

        socket.emit('enterGame', {});
        socket.emit('id', socket.id);

        socket.on('disconnect', function() {
            delete players[socket.id];
            delete sockets[socket.id];

            if(drawerId == socket.id) {
                drawerId = null;
                for(var i in players) {
                    drawerId = i;
                    break;
                }
            }
            updatePlayers = true;
            updateWord = true; //drawer could have changed
        });
        socket.on('guess', function(data) {
            if(players[socket.id].guessed || socket.id == drawerId) {
                return;
            }
            if(data.text == word) {
                players[socket.id].guessed = true;
                updatePlayers = true;
            }else {
                data.name = players[socket.id].name;
                data.text = sanitize(data.text);
                messages.push(data);
            }
        });
        socket.on('draw', function(data) {
            if(socket.id == drawerId) {
                data.lineWidth = lineWidth[data.thickness - 1];
                drawpoints.push(data);
            }
        });
        socket.on('clear', function(data) {
            drawpoints = [];
        });
        socket.on('undo', onUndo);
    });
});

setInterval(function() {
    // send the first n messages, like a queue
    var n = messages.length;
    var messageData = messages.slice(0, n);
    messages.splice(0, n);
    for(var id in sockets) {
        var socket = sockets[id];
        socket.emit('messages', messageData);
        socket.emit('drawing', drawpoints);
        if(updatePlayers) {
            socket.emit('players', {
                players: players,
                drawerId: drawerId,
            });
        }
        if(updateWord) {
            if(socket.id == drawerId) {
                socket.emit('word', word);
            }else {
                socket.emit('word', wordBlanks);
            }
        }
    }
    // reset
    updatePlayers = false;
    updateWord = false;
}, 1000/40);
