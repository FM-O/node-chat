var fs = require("fs");
var app = require('express')();
var server = require("http").createServer(app);
var io = require('socket.io')(server);
var ios = require('socket.io-express-session');

app.set('port', process.env.PORT || 3000);

var Session = require('express-session');
var sessionStore = new Session.MemoryStore();
var session = Session({ name: 'sid', store : sessionStore, secret: 'secret', saveUninitialized: true, resave: true });

io.use(ios(session));
app.use(session);

app.get('/', function (req, res) {
    req.session.uid = Date.now();

    res.sendFile('public/index.html', {root: __dirname} );
})
    .use(function (req, res, next) {
        res.setHeader('Content-Type', 'text/plain');
        res.status(404).send('page introuvable');
    });

io.sockets.on("connection", function (socket) {

    ///////// LOGS //////////
    // console.log(socket.handshake.session.pseudo);
    ///////// LOGS //////////

    if (socket.handshake.session.pseudo !== undefined) {
        socket.broadcast.emit('new_arrived', socket.handshake.session.pseudo + ' vient de se connecter !');
    }

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
        var sessionsKeys = Object.keys(socket.handshake.sessionStore.sessions);
        var socketSession = socket.handshake.sessionID;

        if (sessionsKeys[sessionsKeys.length - 1] !== socketSession) {
            socket.handshake.sessionID = sessionsKeys[sessionsKeys.length - 1];
        }

        sessionStore.load(socket.handshake.sessionID, function (err, sess) {

            sess.pseudo = pseudo;

            socket.handshake.session.pseudo = sess.pseudo;

            sessionStore.set(socket.handshake.sessionID, sess, function () {
                console.log("saved");
            });
        });
        socket.emit('welcome', 'vous êtes bien connecté');
        socket.broadcast.emit('new_arrived', pseudo + ' vient de se connecter !');
    });

    socket.on('disconnect', function () {
        socket.broadcast.emit('user_disconnected', socket.handshake.session.pseudo + ' vient de se déconnecter');
    });
});

server.listen(app.get('port'));