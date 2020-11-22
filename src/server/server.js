/**
* First hack for submission:
* Uses [Node.js]{@link https://nodejs.org/en/} , [Express.js]{@link https://expressjs.com/} and [Socket.io]{@link https://socket.io/}.
* Initial setup from [this tutorial]{@link https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/} & https://socket.io/get-started/chat.
* TODO: add seperate rooms https://socket.io/docs/rooms/#Sample-use-cases
* @author Felix Moore
*/

const { deflateRawSync } = require('zlib');

module.exports.initialiseServer = function (app) {
  const port = process.env.PORT; // uncomment before push
  // const port = 3000; // uncomment for local use

  const server = require('http').createServer(app);
  const io = require('socket.io').listen(server);
  const players = {};
  const gameState = {}; //??
  const width = 800;
  const height = 600;

  io.on('connection', (socket) => { // socket.io detects a connection, output to console.
    console.log('User connected: ID', socket.id);

    socket.username = 'Anonymous' + socket.id;

    socket.on('change_username', (data) => { // TODO add a button for this...
      socket.username = data.username;
    });

    // create new player
    players[socket.id] = { 
      width: 40,
      height: 40,
      // places new player at random location
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600),
      id: socket.id,
      // generate random colour, taken from [here]{@link https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/1152508#comment971373_1152508}
      // TODO: pick from a list of predefined colours (since this can generate some ugly ones)
      colour: ('0x' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6))
    };

    /**
     * These objects will eventually be from classes
     */
    gameState.objects = {};

    gameState.objects['button_a'] = {
      width: 36,
      height: 36,
      x: 60,
      y: 60,
      image: 'button_a',
      linkedTo: 'button_b'
    };
    gameState.objects['button_b'] = {
      width: 36,
      height: 36,
      x: 660,
      y: 460,
      image: 'button_b',
      linkedTo: 'button_a'
    };

    /** 
     * Draw object layer first.
    */
    socket.emit('drawObjects', gameState.objects);

    // load all current players
    socket.emit('currentPlayers', players);
    // notify other players

    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('playerMovement', (data) => {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;

      socket.broadcast.emit('playerMoved', players[socket.id]);
      // io.sockets.emit('movement', players[socket.id]);
    });

    // TODO this isn't being fired so the colour change doesn't stick
    socket.on('colourUpdated', (data, colour) => {
      players[data].colour = colour;
    });

    // chat message
    socket.on('newMessage', (msg) => {
      io.emit('newMessage', (socket.username + ': ' + msg));
    });

    socket.on('impostorGenerated', (picked) => {
      io.emit('colourUpdate', picked, 0xFF0000); // turns the impostor red - just to demonstrate for now
      // TODO change this to a secret flag in player object
      // TODO make sure impostor can either only be generated once
      // or that if it's generated again, the previous impostor's flag is set to false
    });

    // player disconnected
    socket.on('disconnect', () => {
      console.log('User disconnected: ID', socket.id);
      delete players[socket.id]; // remove player
      io.emit('disconnect', socket.id); // notify other players
    });
  });

  /**
   * Currently sending the state of all objects (only 2 currently)
   * per transaction.
   * 
   * Should it occur this way? Actions on the client should be sent
   * to the server and the server state updated (consolidate game state
   * in one location), then client should subscribe to changes in state
   * and update accordingly. i.e. this is the propogation of the data
   * back to the 'view'
   */
  setInterval(() => {
      io.sockets.emit('sendState', gameState.objects);
  }, 1000 / 30); //emit game state 30 times per second

  server.listen(port, () => {
    console.log('Listening on *:' + port);
  });

}