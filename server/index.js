/**
* First multiplayer hack, from [Socket.io tutorial]{@link https://socket.io/get-started/chat/}.
* @author Felix Moore
*/

const port = 3000;
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
let players = {};
// app.get('/', (req, res) => {
//   res.send('<h1>Hello world</h1>'); //basic HTML output
// });

io.on('connection', (socket) =>{ //socket.io detects a connection, output to console.
  console.log('User connected: ID', socket.id);

  //create new player
    players[socket.id] = {
        id: socket.id,
        //places new player at random location
        x: Math.floor(Math.random()*800),
        y: Math.floor(Math.random()*600),

        //generate random colour, taken from [here]{@link https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/1152508#comment971373_1152508}
        //TODO: pick from a list of predefined colours (since this can generate some ugly ones)
        //colour: ('0x' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1,6))
    }

    //emit list of current players
    socket.emit('currentPlayers', players);

    //send client their own player JSON object
    socket.emit('socketID', players[socket.id]);

    //notify other players
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMoved', (update) =>{
        update.id = socket.id;
        socket.broadcast.emit('playerMoved', update);

        players[update.id].x = update.x;
        players[update.id].y = update.y;
    });

    //player disconnected
  socket.on('disconnect', () => {
    console.log('User disconnected: ID', socket.id);
    delete players[socket.id]; //remove player
    socket.broadcast.emit('playerDisconnected', players[socket.id]);
   // socket.emit('disconnect', socket.id); //notify player
  });
});

server.listen(port, () => {
  console.log('Server is running!');
  console.log('listening on *:'+port);
});
