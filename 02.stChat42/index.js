//import './app.css';

let path = require('path');
let express = require('express');

let app= express();
app.use(express.static(path.join(__dirname, 'public')));
//let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(`${__dirname}/index.html` );
});

io.on('connection', function(socket){
    console.log('a user connected');
    //socket.broadcast.emit('hi');
    socket.on('disconnect', function (){
        console.log('user disconnected');
    });

    socket.on('chat message', function(msg){
        console.log(`Message: ${msg}`);
        io.emit('chat message', msg);
    })
});

io.emit('some event', {for: 'evereyone'});



http.listen(3000, function(){
    console.log('listening on port 3000');
})