var http = require("http");
var fs = require("fs");

var Session = require('express-session');
var SessionStore = require("session-file-store")(Session);
var session = Session({ store : new SessionStore({ path : 'tmp/sessions'}), secret : 'pass', resave : true, saveUninitialized : true});

var server = http.createServer(function (req, res) {
    fs.readFile('./index.html', 'utf-8', function (error, content) {
        res.writeHead(200, {'Content-Type' : 'text/html'});
        res.end(content);
    });
});

var ios = require('socket.io-express-session');
var io = require('socket.io').listen(server);

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
});

server.listen(process.env.PORT);