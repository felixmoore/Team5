/**
 * First hack of chat function, adapted from [Socket.io tutorial]{@link
 * https://socket.io/get-started/chat/}. WIP - nicknames function, broadcasting
 * connections/disconnections, online user list, private messaging (? potential
 * for abuse)
 * @author Felix Moore
 */

this.socket = io();

this.socket.on('connection', (socket) => {
  this.socket.broadcast.emit('hi');
  console.log("connection!");
});

this.socket.on('connection', (socket) => {
  this.socket.on('chat message', (msg) => {
    console.log('chat message', (msg));
    this.socket.emit('chat message', msg);
  });
});
