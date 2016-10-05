var fs = require("fs");
var app = require('express')();
var server = require("http").Server(app);

app.set('port', process.env.PORT || 3000);

var Session = require('express-session');
var SessionStore = require("session-file-store")(Session);
var session = Session({ store : new SessionStore({ path : 'tmp/sessions'}), secret : 'pass', resave : true, saveUninitialized : true});

app.get('/', function (req, res) {
    res.sendFile('index.html', {root: __dirname} );
})
    .use(function (req, res, next) {
        res.setHeader('Content-Type', 'text/plain');
        res.status(404).send('page introuvable');
    });

var ios = require('socket.io-express-session');
var io = require('socket.io')(server);

io.use(ios(session));

io.sockets.on("connection", function (socket) {

    ///////// LOGS //////////
    socket.handshake.session.uid = Date.now();
    ///////// LOGS //////////

    socket.emit('welcome', 'vous êtes bien connecté');
    socket.handshake.session.messages = [];
    
    socket.on('message', function (message) {
        socket.handshake.session.messages.push(
            {
                "pseudo" : socket.handshake.session.pseudo,
                "content" : message
            }
        );

        socket.emit("message", socket.handshake.session.messages[socket.handshake.session.messages.length - 1]);
        socket.broadcast.emit("message", socket.handshake.session.messages[socket.handshake.session.messages.length - 1]);
    });

    socket.on('petit_nouveau', function(pseudo) {
        socket.handshake.session.pseudo = pseudo;
        socket.broadcast.emit('new_arrived', pseudo + ' vient de se connecter !');
    });

    socket.on('disconnect', function () {
       socket.broadcast.emit('user_disconnected', socket.handshake.session.pseudo + ' vient de se déconnecter');
    });
});

server.listen(app.get('port'));