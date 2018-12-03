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
// remove "empty words";
for(var i = 0; i < dict.length; i++) {
	if(dict[i].length == 0) {
		dict.splice(i, 1);
		i--;
	}
}

// 20 seconds
const drawTime = 20000;
const maxMessage = 200;
const wordChoiceTime = 8000;

var sockets = {};
var place = {};

var updateWord = false;
var word = "";
var wordBlanks = "";

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

var choosingWord = false;
var wordChoices = ["", "", ""];
var wordChoiceTimeout;

var turn = 0;
var turnDate;
var updateTimer = false;

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
	var prevPlace = place[socket.id];
	var name = players[place[socket.id]].name;
	players.splice(place[socket.id], 1);
	delete sockets[socket.id];
	delete place[socket.id];

	// update places based on shifting
	for(var i in players) {
		place[players[i].id] = i;
	}

	if(drawerId == socket.id) {
		clearTimeout(wordChoiceTimeout);
		drawerId = players.length == 0 ? null : players[(prevPlace + players.length - 1) % players.length].id;
		if(drawerId) {
			beginTurn();
		}
	}
	updatePlayers = true;
	updateWord = true; //drawer could have changed

	var data = {
		text: '<b style="color: #cc0000">' + name + " left.</b>",
		displayname: false,
		special: false,
	};
	messages.push(data);
	allMessages.push(data);
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
	if(socket.id == drawerId && !choosingWord) {
		data.lineWidth = lineWidth[data.thickness - 1];
		drawpoints.push(data);
	}
}

var onWordChoice = function(index) {
	if(choosingWord) {
		choosingWord = false;
		word = wordChoices[index];
		wordBlanks = "_";
		for(var i = 0; i < word.length - 1; i++) {
			wordBlanks += " _";
		}
		updateWord = true;

		updateTimer = true;
		turnDate = new Date();
	}
}
var beginTurn = function() {
	// assuming drawerId is the new drawer, not the old drawer
	drawpoints = [];

	// reset guessed variable
	for(var i in players) {
		players[i].guessed = false;
	}

	// choose random word
	choosingWord = true;
	for(var i in wordChoices) {
		wordChoices[i] = dict[Math.floor(Math.random() * dict.length)];
	}
	sockets[drawerId].emit('wordchoices', wordChoices);

	data = {
		text: '<b style="color: blue">' + players[place[drawerId]].name + " is choosing a word.</b>",
		displayname: false,
		special: false,
	};
	messages.push(data);
	allMessages.push(data);

	// give them 8 seconds to choose a word
	wordChoiceTimeout = setTimeout(function() {
		onWordChoice(Math.floor(Math.random(wordChoices.length)));
	}, wordChoiceTime);
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
        socket.emit('enterGame', {});

        sockets[socket.id] = socket;
		place[socket.id] = players.length;

		if(enterData.name) {
			players.push(Player(socket.id, sanitize(enterData.name)));
		}else {
			players.push(Player(socket.id, ""));
		}
        updatePlayers = true;
        updateWord = true;

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
		socket.on('wordchoice', function(data) {
			if(choosingWord && drawerId == socket.id && (data >= 0 && data < wordChoices.length)) {
				onWordChoice(data);
			}
		});

		var data = {
			text: '<b style="color: green">' + enterData.name + " joined.</b>",
			displayname: false,
			special: false,
		};
		messages.push(data);
		allMessages.push(data);

		if(drawerId == null) {
            drawerId = socket.id;
			beginTurn();
        }
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
	if(!choosingWord && new Date() - turnDate >= drawTime) {
		if(players.length > 0) {
			endTurn();
			drawerId = players[(place[drawerId] + players.length - 1) % players.length].id;
			beginTurn();
			updatePlayers = true;
		}
	}
}, 1000/40);
