module.exports.initialiseServer = function (app) {
  const server = require('http').createServer(app);
  const io = require('socket.io').listen(server);
  const players = {};
  const gameState = {}; // ??
  const clues = {};
  const keyLocations = [];
  const lockLocations = [];
  let votes = {};
  let voteResult;
  let gameStarted = false;

  io.on('connection', (socket) => { // socket.io detects a connection, output to console.
    console.log('User connected: ID', socket.id);
    socket.join('lobby');
    socket.username = 'Anonymous' + socket.id;

    // Create new player object on new connection
    players[socket.id] = {
      width: 40,
      height: 40,
      // Places new player at random location in the living room
      x: Math.floor((Math.random() * 768) + 48),
      y: Math.floor((Math.random() * 336) + 1452),
      id: socket.id,
      // Generate random colour to tint sprite
      // Taken from https://stackoverflow.com/questions/1152024/best-way-to-generate-a-random-color-in-javascript/1152508#comment971373_1152508
      colour: ('0x' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1, 6)),
      room: 'lobby',
      username: socket.username,
      impostor: false
    };

    /**
     * Creates portal objects
     */
    gameState.objects = {};

    gameState.objects.button_a = {
      width: 36,
      height: 36,
      x: 141,
      y: 345,
      image: 'button_a',
      linkedTo: 'button_b'
    };
    gameState.objects.button_b = {
      width: 36,
      height: 36,
      x: 2069,
      y: 1740,
      image: 'button_b',
      linkedTo: 'button_a'
    };

    /**
     * Draws object layer first.
     */
    socket.emit('drawObjects', gameState.objects);

    // Loads all current players
    socket.emit('currentPlayers', players);

    // Notify other sockets of a new connection
    socket.broadcast.emit('newPlayer', players[socket.id]);

    // Updates username server-side
    socket.on('change_username', (data) => {
      socket.username = data.username;
      players[socket.id].username = socket.username;
      io.emit('usernameChanged', data);
    });

    // Handles local movement, broadcasts it server-side
    socket.on('playerMovement', (data) => {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    });

    // Triggers clue generation when 'Start game' button is pressed
    socket.on('gameStarted', () => {
      if (!gameStarted) { // Avoids multiple triggers of game start
        generateClues(gameState);
        // io.emit('sceneChange', 'mansion');
        io.emit('drawObjects', gameState.objects);
        gameStarted = true;
      }
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
      let existingImpostor = false;
      for (const i in players) {
        if (players[i].impostor === true) {
          existingImpostor = true;
        }
      }
      if (existingImpostor === false) {
        players[picked].impostor = true;
        io.emit('rolesUpdate', picked);
      }
    });

    // Emits cursor movement - used for minigames //TODO
    socket.on('cursorMovement', (location) => {
      io.emit('cursorMoved', [players[socket.id], location]);
    });

    // Ensures all players view the same scene
    socket.on('sceneChanged', (scene) => {
      io.emit('sceneChange', scene);
    });

    // Generates locations for locks & keys in drag & drop minigame
    socket.on('dragLoaded', () => {
      if (keyLocations.length === 0) { // Avoids objects being generated multiple times
        for (let i = 0; i < 5; i++) {
          keyLocations[i] = [(Math.random() * 800), (Math.random() * 600)];
          lockLocations[i] = [(Math.random() * 800), (Math.random() * 600)];
        }
        io.emit('dragMinigameLocations', keyLocations, lockLocations);
      }
    });

    // Update key locations in drag & drop minigame
    socket.on('keyMoved', (gameObject, originalCoordinates) => {
      io.emit('keyMovement', gameObject, originalCoordinates);
    });

    // Triggers removal of key/lock objects when matched by a player
    socket.on('keyLockMatched', (key, lock) => {
      io.emit('keyLockMatch', key, lock);
      for (const i in lockLocations) {
        if (lockLocations[i][0] === lock.x && lockLocations[i][1] === lock.y) {
          keyLocations.splice(i, 1);
          lockLocations.splice(i, 1);
        }
      }
    });

    // Voting started
    socket.on('votingStart', () => {
      // TODO some kind of check to only emit data once
      io.emit('votingData', (players));
    });

    socket.on('sendVote', (vote, socketID) => {
      votes[socketID] = vote; // ensures only one vote per player
    });

    socket.on('votingFinished', () => {
      let scene = 'lose';
      const voteArray = [];
      for (const i in votes) {
        voteArray.push(votes[i]);
      }
      voteResult = voteArray.sort((a, b) =>
        voteArray.filter(v => v === a).length -
            voteArray.filter(v => v === b).length
      ).pop();
      for (const i in players) {
        if (players[i].id === voteResult) {
          if (players[i].impostor === true) {
            scene = 'win';
          }
          voteResult = players[i];
        }
      }
      io.emit('sceneChange', scene);
      votes = {};
      gameStarted = false;
    });

    socket.on('resultSceneLoaded', () => {
      io.emit('voteResult', voteResult);
    });

    // Player disconnected
    socket.on('disconnect', () => {
      console.log('User disconnected: ID', socket.id);
      delete players[socket.id]; // remove player
      io.emit('disconnect', socket.id); // notify other players
    });
  });

  /**
   * Sends the state of portal objects to players
   */
  setInterval(() => {
    io.sockets.emit('sendState', gameState.objects);
  }, 1000 / 30); // emit game state 30 times per second

  server.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on *: ${process.env.PORT || 3000}`);
  });

  // /** Generates room code to invite other players */
  // function createRoomCode() {
  //   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  //   let code = '';
  //   for (let i = 0; i < 5; i++) {
  //     code += characters.charAt(Math.floor(Math.random() * characters.length));
  //   }
  //   //TODO check if code already exists in rooms list, recursively generate another code
  //   return code;
  // }
};

function generateClues (gameState) {
  // TODO fix, currently generated out of bounds
  // lounge
  gameState.objects.clue_bone1 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1180) + 20),
    y: Math.floor((Math.random() * 445) + 1200),
    image: 'clue_bone'
  };

  // kitchen
  gameState.objects.clue_bone2 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1149) + 1915),
    y: Math.floor((Math.random() * 374) + 1271),
    image: 'clue_bone'
  };

  gameState.objects.clue_knife1 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1180) + 20),
    y: Math.floor((Math.random() * 445) + 1200),
    image: 'clue_knife'
  };

  gameState.objects.clue_knife2 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1149) + 1915),
    y: Math.floor((Math.random() * 374) + 1271),
    image: 'clue_knife'
  };

  gameState.objects.clue_book1 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1180) + 20),
    y: Math.floor((Math.random() * 445) + 1200),
    image: 'clue_book'
  };

  // bedroom
  gameState.objects.clue_book2 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1168) + 1915),
    y: Math.floor((Math.random() * 461) + 336),
    image: 'clue_book'
  };

  gameState.objects.clue_poison1 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1168) + 1915),
    y: Math.floor((Math.random() * 461) + 336),
    image: 'clue_poison'
  };

  // bathroom
  gameState.objects.clue_poison1 = {
    width: 32,
    height: 32,
    x: Math.floor((Math.random() * 1197) + 65),
    y: Math.floor((Math.random() * 485) + 424),
    image: 'clue_poison'
  };
}
