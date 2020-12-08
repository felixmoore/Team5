/**
* MVP
* Uses [Node.js]{@link https://nodejs.org/en/} , [Express.js]{@link https://expressjs.com/} and [Socket.io]{@link https://socket.io/}.
* Initial setup from [this tutorial]{@link https://gamedevacademy.org/create-a-basic-multiplayer-game-in-phaser-3-with-socket-io-part-1/} & https://socket.io/get-started/chat.
* TODO: add seperate rooms https://socket.io/docs/rooms/#Sample-use-cases
* @author Felix Moore, James Kerr
*/

const { deflateRawSync } = require('zlib');

module.exports.initialiseServer = function (app) {
  // const port = process.env.PORT; // uncomment before push
  const port = 3000; // uncomment for local use

  const server = require('http').createServer(app);
  const io = require('socket.io').listen(server);
  let players = {};
  let gameState = {}; //??
  let clues = {};

  io.on('connection', (socket) => { // socket.io detects a connection, output to console.
    console.log('User connected: ID', socket.id);
    socket.join('lobby');
    socket.username = 'Anonymous' + socket.id;

    socket.on('change_username', (data) => {
      socket.username = data.username;
    });

    // create new player
    players[socket.id] = {
      width: 40,
      height: 40,
      // places new player at random location
      x: Math.floor((Math.random() * 1245) + 56),
      y: Math.floor((Math.random() * 1820) + 816),
      id: socket.id,
      // generate random colour, taken from [here]{@link https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/1152508#comment971373_1152508}
      colour: ('0x' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6)),
      room: 'lobby'
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
    });

    socket.on('colourUpdated', (data, colour) => {
      players[data].colour = colour;
    });

    socket.on('gameStarted', () => {
      generateClues(gameState);
     
      io.emit('drawObjects', gameState.objects);
      console.log('clues sent');
    });

    // New chat message event
    socket.on('newMessage', (msg) => {
      io.emit('newMessage', (socket.username + ': ' + msg));
    });

    // Fires when clue is collected
    socket.on('clueCollected', (clue) => {
      delete clues[clue];
      io.emit('updateClues', clue);
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

  /** To be implemented after MVP demo, not 100% necessary for now. */
  function createRoomCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  //TODO check if code already exists in rooms list, recursively generate another code
  return code;
  }

}

function generateClues (gameState) {
  // hardcoded for MVP demo, eventually randomly generated
  gameState.objects['clue_bone'] = {
    width: 32,
    height: 32,
    x: 900,
    y: 1500,
    image: 'clue_bone'
  };

  gameState.objects['clue_knife'] = {
    width: 32,
    height: 32,
    x: 800,
    y: 1400,
    image: 'clue_knife'
  };

  gameState.objects['clue_book'] = {
    width: 32,
    height: 32,
    x: 600,
    y: 1200,
    image: 'clue_book'
  };

  gameState.objects['clue_poison'] = {
    width: 32,
    height: 32,
    x: 600,
    y: 1400,
    image: 'clue_poison'
  };
}
