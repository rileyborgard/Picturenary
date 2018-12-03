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

mongoose.connect('mongodb+srv://rborgard:ThisprojectTookafoReverAndaHalf@picturenary-qmtky.mongodb.net/test?retryWrites=true');
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

// read dictionary
var fs = require('fs');
var text = fs.readFileSync('./server/dict.txt', 'utf-8');
var dict = text.split('\r\n');

// 20 seconds
const drawTime = 20000;
const maxMessage = 200;

var sockets = {};
var place = {};

var updateWord = false;
var word = 'potato';
var wordBlanks = '_ _ _ _ _ _';

var updatePlayers = false;
var Player = require('./server/player.js');
var sanitize = require('./server/sanitize.js');
var players = [];
var drawerId = null;
var io = require('socket.io')(serv, {});

var messages = [];
var allMessages = [];
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
var onDisconnect = function(socket) {
	players.splice(place[socket.id], 1);
	delete sockets[socket.id];
	delete place[socket.id];

	// update places based on shifting
	for(var i in players) {
		place[players[i].id] = i;
	}

	if(drawerId == socket.id) {
		drawerId = players.length == 0 ? null : players[0].id;
		beginTurn();
	}
	updatePlayers = true;
	updateWord = true; //drawer could have changed
}
var onGuess = function(socket, data) {
	var special = players[place[socket.id]].guessed || socket.id == drawerId;
	data.name = players[place[socket.id]].name;
	if(data.text == word && !special) {
		players[place[socket.id]].guessed = true;
		updatePlayers = true;
		data.text = '<b style="color: green">' + data.name + " guessed the word.</b>";
		data.displayname = false;
		data.special = false;
	}else {
		data.text = sanitize(data.text.substr(0, maxMessage));
		data.special = special;
		data.displayname = true;
	}
	allMessages.push(data);
	if(!special) {
		messages.push(data);
	}
}
var onDraw = function(socket, data) {
	if(socket.id == drawerId) {
		data.lineWidth = lineWidth[data.thickness - 1];
		drawpoints.push(data);
	}
}

var turn = 0;
var turnDate;
var updateTimer = false;
var beginTurn = function() {
	// assuming drawerId is the new drawer, not the old drawer
	drawpoints = [];

	// reset guessed variable
	for(var i in players) {
		players[i].guessed = false;
	}

	// choose random word
	word = dict[Math.floor(Math.random() * dict.length)];
	wordBlanks = "_";
	for(var i = 0; i < word.length - 1; i++) {
		wordBlanks += " _";
	}

	updateTimer = true;
	turnDate = new Date();
}
var endTurn = function() {
	// assuming drawerId is the drawer of the turn that just ended
	// add scores
	var n = 0;
	for(var i in players) {
		if(players[i].guessed) {
			n++;
			players[i].score += 100;
		}
	}
	players[place[drawerId]].score += n * 50;
}

io.sockets.on('connection', function(socket) {
    socket.on('enterGame', function(enterData) {
        if(drawerId == null) {
            drawerId = socket.id;
			beginTurn();
        }

        sockets[socket.id] = socket;
		place[socket.id] = players.length;
		if(enterData.name) {
			players.push(Player(socket.id, sanitize(enterData.name)));
		}else {
			players.push(Player(socket.id, ""));
		}
        updatePlayers = true;
        updateWord = true;

        socket.emit('enterGame', {});
        //socket.emit('id', socket.id);

        socket.on('disconnect', function() {
			onDisconnect(socket);
        });
        socket.on('guess', function(data) {
            onGuess(socket, data);
        });
        socket.on('draw', function(data) {
            onDraw(socket, data);
        });
        socket.on('clear', function(data) {
            drawpoints = [];
        });
        socket.on('undo', onUndo);
    });
});

// game loop
setInterval(function() {
    // send the first n messages, like a queue
    var n = messages.length;
    var messageData = messages.slice(0, n);
    messages.splice(0, n);

	var m = allMessages.length;
	var allMessageData = allMessages.slice(0, m);
	allMessages.splice(0, m);

    for(var id in sockets) {
        var socket = sockets[id];
		if(players[place[id]].guessed || id == drawerId) {
			socket.emit('messages', allMessageData);
		}else {
	        socket.emit('messages', messageData);
		}
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
		if(updateTimer) {
			socket.emit('timer', turnDate);
		}
    }
    // reset
    updatePlayers = false;
    updateWord = false;
	updateTimer = false;

	// check time
	if(new Date() - turnDate >= drawTime) {
		if(players.length > 0) {
			endTurn();
			drawerId = players[(place[drawerId] + players.length - 1) % players.length].id;
			beginTurn();
			updatePlayers = true;
			updateWord = true;
		}
	}
}, 1000/40);
