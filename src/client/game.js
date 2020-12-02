/* global Phaser */

const config = {
  // WebGL if available, Canvas otherwise
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game', // renders in a <canvas> element with id game
    width: 800,
    height: 700
  },
  physics: { // physics framework from Phaser
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: {
        y: 0
      }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

const game = new Phaser.Game(config); // eslint-disable-line

let nameChanged = false;
let data = {};
let allPlayers = {};

// window.addEventListener('resize', () => {
//   game.scale.resize(window.innerWidth / 2, window.innerHeight / 2);
// }, false
// );

function setName (newName) {
  data.username = newName;
  nameChanged = true;
}

function preload () {
  this.load.image('circle', 'public/assets/circle.png');
  this.load.image('button_a', 'public/assets/button_a.png');
  this.load.image('button_b', 'public/assets/button_b.png');
  this.load.image('DwnStrRoom1', 'public/assets/DwnStrRoom1.png');
}

function create () {
  const me = this; // avoids confusion with 'this' object when scope changes
  this.socket = io(); // eslint-disable-line
  this.otherPlayers = this.physics.add.group();
  this.localState = {}; // local representation of the server game state. intermittently (30/ps) updated.
  let bg = this.add.image(0, 0, 'DwnStrRoom1').setOrigin(0).setScale(0.7);
  let t = this.add.text(0, 0, 'Hello World').setScrollFactor(0); //just some text to demonstrate how to stop things moving with the camera, can be changed to show role
  this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);

  configureSocketEvents(me, this.socket);

  // TODO move this to chat.js?
  // jquery to handle new message & clear chat box
  /* eslint-disable */
  const socket = this.socket;
  $('#chat').submit(function(e) { 
    e.preventDefault();
    socket.emit('newMessage', $('#chatInput').val());
    $('#chatInput').val('');
    return true;
  });

  // adds message to chat
  this.socket.on('newMessage', (msg) => {
    $('#messages').prepend($('<li>').text(msg));
    window.scrollTo(0, document.body.scrollHeight); 
    // TODO make older messages move off the screen
  });
  /* eslint-enable */
  // end todo section

  // TODO make this save properly server side
  // jquery to handle impostor generation
  /* eslint-disable */
  $('#generateImpostor').click(function(e) { 
    e.preventDefault();
    var key = Object.keys(allPlayers);
    let picked = allPlayers[key[ key.length * Math.random() << 0]];
    socket.emit('impostorGenerated', picked.id);
  });
  /* eslint-enable */
  // end todo section

  // TODO: bind WASD instead
  // TODO: key to open chat?
  game.keys = this.input.keyboard.addKeys({
    up: 'up',
    down: 'down',
    left: 'left',
    right: 'right'
  });
}

function addPlayer (me, playerInfo) {
  me.player = me.physics.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  me.player.setTint(playerInfo.colour);
  me.player.room = playerInfo.room;
  me.cameras.main.startFollow(me.player);
}

function addOtherPlayer (me, playerInfo) {
  const otherPlayer = me.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  otherPlayer.setTint(playerInfo.colour);
  otherPlayer.id = playerInfo.id;
  otherPlayer.room = playerInfo.room;
  me.otherPlayers.add(otherPlayer);
}

/**
 * 
 * TODO
 * When a player moves between rooms, the bg variable should be updated with the new room's image.
 * The player's x & y should be updated to look as though they've just come through the door.
 * The game should only show players that are currently in the same room.
 * (This will need to be stored server-side and checked, the socket events will have to be edited a bit to only
 * send information of players in the same room - to avoid cheating by just grabbing every other player's location)
 *
 * @author
 */
function changeRoom () {

}


/**
 *
 * @param {} me
 * @author
 */
function checkCollision (me) {
  let locState = me.localState;

  for (let ob in locState) {
    // establish bounds of current object
    let current = locState[ob];
    let currentX = current.x;
    let currentXX = currentX + current.width; 
    let currentY = current.y;
    let currentYY = currentY + current.height;

    // if player is within the bounds of the current object
    if (me.player.x > currentX && me.player.x < currentXX && 
        me.player.y > currentY && me.player.y < currentYY) {
          me.player.x = locState[current.linkedTo].x; // only portals currently, so transform to linked portal
          me.player.y = locState[current.linkedTo].y; //
    }
  }
}

function update () {
  if (nameChanged) {
    this.socket.emit('change_username', data);
    !nameChanged;
  }

  if (this.player) {
    if (game.keys.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (game.keys.right.isDown) {
      this.player.setVelocityX(160);
    } else {
      this.player.setVelocityX(0); // stop moving
    }
    if (game.keys.up.isDown) {
      this.player.setVelocityY(-160);
    } else if (game.keys.down.isDown) {
      this.player.setVelocityY(160);
    } else {
      this.player.setVelocityY(0);
    }

    checkCollision(this);

    // emit update
    const x = this.player.x;
    const y = this.player.y;

    if (this.player.previous && (x !== this.player.previous.x || y !== this.player.previous.y)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y });
    }

    this.player.previous = {
      x: this.player.x,
      y: this.player.y
    };
  }
}

function configureSocketEvents (me, socket) {
  // TODO move all the socket config into here + refer to other functions to tidy up
  socket.on('drawObjects', (objects) => { drawObjects(me, objects); });
  socket.on('currentPlayers', (players) => { loadPlayers(me, players); });
  socket.on('newPlayer', (playerInfo) => { addNewPlayer(me, playerInfo); });
  socket.on('playerMoved', (data) => { handlePlayerMovement(me, data); });
  socket.on('colourUpdate', (data, colour) => { updateSpriteColour(me, data, colour); });
  socket.on('disconnect', (id) => { handleDisconnect(me, id); });
  socket.on('movement', function(other) { handlePlayerMovementAlternate(me, other); });

  /**
   * Updates the local state.
   */
  socket.on('sendState', function (state) {
    me.localState = state;
  });
}

function drawObjects (me, objects) {
  Object.keys(objects).forEach(o => {
    me.add.image(objects[o].x, objects[o].y, objects[o].image).setDisplaySize(objects[o].width, objects[o].height).setOrigin(0, 0);
  });
}

/* Loads all currently connected players.
TODO - only load players in current room */
function loadPlayers (me, players) {
  allPlayers = players;
  Object.keys(players).forEach((index) => {
    if (players[index].id === me.socket.id) {
      addPlayer(me, players[index]);
    } else {
      addOtherPlayer(me, players[index]);
    }
  });
}

/* Add new player to client on connection event.
TODO - only add when new player is in the same room */
function addNewPlayer (me, playerInfo) {
  addOtherPlayer(me, playerInfo);
  allPlayers[playerInfo.id] = playerInfo;
}

/**
   * Iterates otherPlayers (all players exclusive of 'this' player).
   *
   * If the player that moved = this.player, no action taken since
   *  this.player not contained within otherPlayers.
   *
   * If the player that moved is in otherPlayers (i.e. the moving player
   *  is another), update the location of the player respective of the
   *  current player
   *
   */
function handlePlayerMovement (me, data) {
  me.otherPlayers.getChildren().forEach((otherPlayer) => {
    if (data.id === otherPlayer.id) {
      otherPlayer.setPosition(data.x, data.y);
    }
  });
}

/* Updates tint on player sprite.
Used for impostor demo, will probably be unnecessary in future */
function updateSpriteColour (me, data, colour) {
  if (data === me.socket.id) {
    me.player.setTint(colour);
    me.socket.emit('colourUpdated', data, colour);
  } else {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data === otherPlayer.id) {
        otherPlayer.setTint(colour);
        me.socket.emit('colourUpdated', data, colour);
      }
    });
  }
}

/* Remove player sprite when they disconnect
TODO only remove from current room (to avoid nullpointers) */
function handleDisconnect (me, id) {
  me.otherPlayers.getChildren().forEach((otherPlayer) => {
    if (id === otherPlayer.id) {
      otherPlayer.destroy();
    }
  });
}

/**
   * Different implementation of playerMoved that also
   * updates the current player perspective.
   *
   * Useful if some transformation (i.e. portal jump)
   * happens on the server side.
   *
   * Temporary hack.
   */
function handlePlayerMovementAlternate (me, other) {
  if (me.player.id === other.id) {
    me.player.setPosition(other.x, other.y);
  }
  else {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (other.id === otherPlayer.id) {
        otherPlayer.setPosition(other.x, other.y);
      }
    });
  }
}
