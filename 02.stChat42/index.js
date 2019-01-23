//import './app.css';

let path = require('path');
let express = require('express');

let app= express();
app.use('/styles', express.static('public'));
console.log(__dirname);
//let http = require('http').Server(app);
let fs = require('fs');

let privateKey = fs.readFileSync('key.pem').toString();
let certificate = fs.readFileSync('cert.pem').toString();
let credentials = {
  key: privateKey,
  cert: certificate,
};
let https = require('https').Server(credentials,app);
let io = require('socket.io')(https);

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

https.listen(3001, function(){
    console.log('listening on port 3001');
})

/*
http.listen(3000, function(){
    console.log('listening on port 3000');
})
*/