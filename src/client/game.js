/* global Phaser */

const config = {
  // WebGL if available, Canvas otherwise
  type: Phaser.AUTO,
  parent: 'game', // renders in a <canvas> element with id game //TODO rename if we have a name
  width: 800, // TODO change to relative size?
  height: 600,

  physics: { // physics framework from Phaser
    default: 'arcade',
    arcade: {
      debug: false,
      // velocity: 1,
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

var game = new Phaser.Game(config); // eslint-disable-line


let nameChanged = false;
let data = {};
let allPlayers = {};


function setName (newName) {
  data.username = newName;
  nameChanged = true;
}

function preload () {
  this.load.image('circle', 'public/assets/circle.png');
  this.load.image('button_a', 'public/assets/button_a.png');
  this.load.image('button_b', 'public/assets/button_b.png');
}

function create () {
  const me = this; // avoids confusion with 'this' object when scope changes
  this.socket = io(); // eslint-disable-line
  this.otherPlayers = this.physics.add.group();
  this.localState = {}; // local representation of the server game state. intermittently (30/ps) updated.

  this.socket.on('drawObjects', (objects) => {
    Object.keys(objects).forEach(o => {
      me.add.image(objects[o].x, objects[o].y, objects[o].image).setDisplaySize(objects[o].width, objects[o].height).setOrigin(0, 0);
    });
  });

  // load currently connected players
  this.socket.on('currentPlayers', (players) => {
    allPlayers = players;
    Object.keys(players).forEach((index) => {
      if (players[index].id === me.socket.id) {
        addPlayer(me, players[index]);
      } else {
        addOtherPlayer(me, players[index]);
      }
    });
  });

  // add new player to client on connection event
  this.socket.on('newPlayer', (playerInfo) => {
    addOtherPlayer(me, playerInfo);
    console.log(playerInfo);
    console.log(allPlayers);
    allPlayers[playerInfo.id] = playerInfo;
  });

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
  this.socket.on('playerMoved', (data) => {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data.id === otherPlayer.id) {
        otherPlayer.setPosition(data.x, data.y);
      }
    });
  });

  // update sprite colour - for impostor demo + useful for customisation in future
  this.socket.on('colourUpdate', (data, colour) => {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data === otherPlayer.id) {
        otherPlayer.setTint(colour);
        this.socket.emit('colourUpdated', data, colour);
      }
    });

    if (data.id === me.player.id) {
      me.player.setTint(colour);
      this.socket.emit('colourUpdated', data, colour);
    }
  });

  // TODO move this to chat.js
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
    window.scrollTo(0, document.body.scrollHeight); // TODO make older messages move off the screen
  });
  /* eslint-enable */
  // end todo section

  // TODO move this server side
  // jquery to handle impostor generation
  /* eslint-disable */
  $('#generateImpostor').click(function(e) { 
    e.preventDefault();
    var key = Object.keys(allPlayers);
    let picked = allPlayers[key[ key.length * Math.random() << 0]];
    socket.emit('impostorGenerated', picked.id);
    console.log('picked' + picked.id);
  });
  /* eslint-enable */
  // end todo section

  // remove player sprite when they disconnect
  this.socket.on('disconnect', (id) => {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (id === otherPlayer.id) {
        otherPlayer.destroy();
      }
    });
  });

  /**
   * Different implementation of playerMoved that also 
   * updates the current player perspective.
   * 
   * Useful if some transformation (i.e. portal jump)
   * happens on the server side.
   * 
   * Temporary hack. 
   */
  this.socket.on('movement', function(other) {
    if (me.player.id == other.id) {
      me.player.setPosition(other.x, other.y);
    }
    else {
      me.otherPlayers.getChildren().forEach((otherPlayer) => {
        if (other.id === otherPlayer.id) {
          otherPlayer.setPosition(other.x, other.y);
        }
      });
    }
  });

  /**
   * Updates the local state.
   */
  this.socket.on('sendState', function(state) {
    me.localState = state;
  });

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
}

function addOtherPlayer (me, playerInfo) {
  const otherPlayer = me.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  otherPlayer.setTint(playerInfo.colour);
  otherPlayer.id = playerInfo.id;
  me.otherPlayers.add(otherPlayer);
}

/**
 * 
 * @param {} me 
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

function configureSocketEvents(){
  //TODO move all the socket config into here + refer to other functions to tidy up
}