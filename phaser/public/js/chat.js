/**
* First hack of chat function, from [Socket.io tutorial]{@link https://socket.io/get-started/chat/}.
* WIP - nicknames function, broadcasting connections/disconnections, online user list, private messaging (? potential for abuse)
* @author Felix Moore
*/

const app = require('express')();
const http = require('http').createServer(app);
const io = require.('socket.io')(http);
const port = 3000;

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>'); //basic HTML output
});

io.on('connection', (socket) =>){ //socket.io detects a connection, output to console.
  console.log('user connected');

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
}

http.listen(port, () => {
  console.log('listening on *:'+port);
});
