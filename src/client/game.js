/* global Phaser */

/**
 * Clue glow effect code from https://stackoverflow.com/a/52939167
 */

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
let objects = {};
let allPlayers = {};
let time = 0;
let cluesCollected = 0;
function setName (newName) {
  data.username = newName;
  nameChanged = true;
}

function preload () {
  this.load.image('circle', 'public/assets/circle.png');
  this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 }); //just to test anims, from https://pipoya.itch.io/pipoya-free-rpg-character-sprites-nekonin
  this.load.image('button_a', 'public/assets/button_a.png');
  this.load.image('button_b', 'public/assets/button_b.png');
  this.load.image('FullMap', 'public/assets/FullMap.png');
  this.load.image('clue_bone', 'public/assets/clues/bone01a.png');
  this.load.image('clue_book', 'public/assets/clues/book_01g.png');
  this.load.image('clue_knife', 'public/assets/clues/sword_03c.png');
  this.load.image('clue_poison', 'public/assets/clues/potion_01a.png');
  this.load.image('timebar', 'public/assets/timebar.png');
  this.load.image('timecontainer', 'public/assets/timecontainer.png');

  //loads minigame js files for when events are called
  //game.state.add('wordsearch', 'src/client/minigames/wordsearch.js');
}

function create () {
  const self = this; // avoids confusion with 'this' object when scope changes
  this.socket = io(); // eslint-disable-line
  this.otherPlayers = this.physics.add.group();
  this.localState = {}; // local representation of the server game state. intermittently (30/ps) updated.
  const bg = this.add.image(0, 0, 'FullMap').setOrigin(0).setScale(0.7);
  const infoBg = this.add.rectangle(0, 0, bg.displayWidth, 40, 0x6666ff).setScrollFactor(0);
  let t = this.add.text(0, 0, 'Player role: ').setScrollFactor(0); // just some text to demonstrate how to stop things moving with the camera, can be changed to show role
  this.cameras.main.setBounds(0, 0, bg.displayWidth, bg.displayHeight);
  // glow effect
  customPipeline = game.renderer.addPipeline('Custom', new CustomPipeline(game));
  customPipeline.setFloat1('alpha', 1.0);

  configureSocketEvents(self, this.socket);
  //
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
  $('#startGame').click(function(e) { 
    e.preventDefault();
    socket.emit('gameStarted');
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

  clues = this.physics.add.group(); // group for all clue objects
  clues.create(400,568, 'clue_bone'); //creates an instance of the bone clue and places it at location

  //self.initialTime = 6000;
  //self.remainingTime = initialTime; 

  //this.add.image(0,50, 'timeContainer');
  //this.add.image(self.timeContainer.x +46, self.timeContainer.y, 'timeBar');

  //self.createTimer();
  //self.gameTimer = game.time.events.loop(100, function(){self.updateTimer();})
}

function createAnims(self, key) {
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers('cat', { start: 0, end: 2 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopDown',
    frames: [{ key: 'cat', frame: 1 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers('cat', { start: 3, end: 5 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopLeft',
    frames: [{ key: 'cat', frame: 4 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers('cat', { start: 6, end: 8 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopRight',
    frames: [{ key: 'cat', frame: 7 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers('cat', { start: 9, end: 11 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopUp',
    frames: [{ key: 'cat', frame: 10 }],
    frameRate: 20
  });

 
}

function addPlayer (self, playerInfo) {
  //self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'cat').setScale(3).setOrigin(0, 0);
  createAnims(self, 'cat');
  self.player.anims.play('stopDown', true);
  self.player.setTint(playerInfo.colour);
  self.player.room = playerInfo.room;
  self.cameras.main.startFollow(self.player);
}

function addOtherPlayer (self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  otherPlayer.setTint(playerInfo.colour);
  otherPlayer.id = playerInfo.id;
  otherPlayer.room = playerInfo.room;
  self.otherPlayers.add(otherPlayer);
}

/**
 * TODO
 * When a player moves between rooms, the bg variable should be updated with the new room's image.
 * The player's x & y should be updated to look as though they've just come through the door.
 * The game should only show players that are currently in the same room.
 * (This will need to be stored server-side and checked, the socket events will have to be edited a bit to only
 * send information of players in the same room - to avoid cheating by just grabbing every other player's location)
 *
 * @author
 */
// function changeRoom () {

// }

/**
 *
 * @param {} self
 * @author
 */
function checkCollision (self) {
  const locState = self.localState;

  for (const ob in locState) {
    // establish bounds of current object
    const current = locState[ob];
    const currentX = current.x;
    const currentXX = currentX + current.width;
    const currentY = current.y;
    const currentYY = currentY + current.height;

    // if player is within the bounds of the current object
    if (self.player.x > currentX && self.player.x < currentXX &&
        self.player.y > currentY && self.player.y < currentYY) {
      if (current.linkedTo != null) { // teleport if object is a portal
        self.player.x = locState[current.linkedTo].x; // only portals currently, so transform to linked portal
        self.player.y = locState[current.linkedTo].y; //
      }
      else{
        if (current.clues != null){ //test to see if clue collision logic works
          self.collectClue();
          //me.game.state.load('wordsearch', 'src/client/minigames/wordsearch.js') //test line
        }
      }
    }

    
  }
}

function update () {
  customPipeline.setFloat1('time', time);
  time += 0.03;
  if (nameChanged) {
    this.socket.emit('change_username', data);
    !nameChanged;
  }

  if (this.player) {
    if (game.keys.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.anims.play('left', true);
    } else if (game.keys.right.isDown) {
      this.player.setVelocityX(160);
      this.player.anims.play('right', true);
    } else {
      // this won't handle diagonals, idk if we want it to
      if (this.player.body.velocity.x === -160) {
        this.player.anims.play('stopLeft', true);
      } else if (this.player.body.velocity.x === 160) {
        this.player.anims.play('stopRight', true);
      }
      this.player.setVelocityX(0); // stop moving
    }
    if (game.keys.up.isDown) {
      this.player.setVelocityY(-160);
      this.player.anims.play('up', true);
    } else if (game.keys.down.isDown) {
      this.player.setVelocityY(160);
      this.player.anims.play('down', true);
    } else {
      if (this.player.body.velocity.y === -160) {
        this.player.anims.play('stopUp', true);
      } else if (this.player.body.velocity.y === 160) {
        this.player.anims.play('stopDown', true);
      }
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

function configureSocketEvents (self, socket) {
  // TODO move all the socket config into here + refer to other functions to tidy up
  socket.on('drawObjects', (objects) => { drawObjects(self, objects); });
  socket.on('currentPlayers', (players) => { loadPlayers(self, players); });
  socket.on('newPlayer', (playerInfo) => { addNewPlayer(self, playerInfo); });
  socket.on('playerMoved', (data) => { handlePlayerMovement(self, data); });
  socket.on('colourUpdate', (data, colour) => { updateSpriteColour(self, data, colour); });
  socket.on('disconnect', (id) => { handleDisconnect(self, id); });
  socket.on('movement', (other) => { handlePlayerMovementAlternate(self, other); });
  /**
   * Updates the local state.
   */
  socket.on('sendState', function (state) {
    self.localState = state;
  });
}

function drawObjects (self, objects) {
  const clueText = self.add.text(615, 0, 'Clues collected:  ').setScrollFactor(0);
  Object.keys(objects).forEach(o => {
    const obj = self.physics.add.image(objects[o].x, objects[o].y, objects[o].image).setDisplaySize(objects[o].width, objects[o].height).setOrigin(0, 0).setPipeline('Custom');
    if (objects[o].linkedTo === undefined) {
      self.physics.add.overlap(self.player, obj, () => {
        self.socket.emit('clueCollected');
        obj.destroy();
        cluesCollected++;
        clueText.setText('Clues collected: ' + cluesCollected);
      }, null, self);
      self.physics.add.overlap(self.otherPlayers, obj, () => {
        self.socket.emit('clueCollected');
        obj.destroy();
        cluesCollected++;
        clueText.setText('Clues collected: ' + cluesCollected);
      }, null, self);
    }
  });
}

/* Loads all currently connected players.
TODO - only load players in current room */
function loadPlayers (self, players) {
  allPlayers = players;
  Object.keys(players).forEach((index) => {
    if (players[index].id === self.socket.id) {
      addPlayer(self, players[index]);
    } else {
      addOtherPlayer(self, players[index]);
    }
  });
}

/* Add new player to client on connection event.
TODO - only add when new player is in the same room */
function addNewPlayer (self, playerInfo) {
  addOtherPlayer(self, playerInfo);
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
function handlePlayerMovement (self, data) {
  self.otherPlayers.getChildren().forEach((otherPlayer) => {
    if (data.id === otherPlayer.id) {
      otherPlayer.setPosition(data.x, data.y);
    }
  });
}

/* Updates tint on player sprite.
Used for impostor demo, will probably be unnecessary in future */
function updateSpriteColour (self, data, colour) {
  if (data === self.socket.id) {
    self.player.setTint(colour);
    self.socket.emit('colourUpdated', data, colour);
  } else {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data === otherPlayer.id) {
        otherPlayer.setTint(colour);
        self.socket.emit('colourUpdated', data, colour);
      }
    });
  }
}

/* Remove player sprite when they disconnect
TODO only remove from current room (to avoid nullpointers) */
function handleDisconnect (self, id) {
  self.otherPlayers.getChildren().forEach((otherPlayer) => {
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
function handlePlayerMovementAlternate (self, other) {
  if (self.player.id === other.id) {
    self.player.setPosition(other.x, other.y);
  } else {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (other.id === otherPlayer.id) {
        otherPlayer.setPosition(other.x, other.y);
      }
    });
  }
}

//method for when player overlaps with clue
function collectClue(){
  const self = this;
  clue.disableBody(true, true); //removes clue from map if overlap with player is detected
  self.cluesCollected += 1; // increments clue collected value by 1
  self.clueLabel.text = self.cluesCollected //passes cluesCollected value to on screen score label TODO: clueLabel method
  //opens wordsearch minigame
  self.game.state.load('wordsearch', 'src/client/minigames/wordsearch.js')
}

/* function createTimer(){
  const self = this;

  

  self.timeBar = self.game.add.sprite(self.timeBar.x, self.timeBar.y, 'timeBar');
  self.timeBar.cropEnabled = true;

}

function updateTimer(){
  const self = this;

  self.remainingTime -=10;

  var cropTimeBar = new Phaser.timeBar(self.timeBar.x, self.timeBar.y,(self.remainingTime/self.initialTime)* self.timeBar.width, self.timeBar.height);
  self.timeBar.crop(cropTimeBar);
} */

// Custom texture pipeline used to make the clue sprites flash, needs to be moved to another file after MVP
const CustomPipeline = new Phaser.Class({
  Extends: Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,
  initialize:
  function CustomPipeline (game) {
    Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
      game: game,
      renderer: game.renderer,
      fragShader: [
        'precision lowp float;',
        'varying vec2 outTexCoord;',
        'varying vec4 outTint;',
        'uniform sampler2D uMainSampler;',
        'uniform float alpha;',
        'uniform float time;',
        'void main() {',
        'vec4 sum = vec4(0);',
        'vec2 texcoord = outTexCoord;',
        'for(int xx = -4; xx <= 4; xx++) {',
        'for(int yy = -4; yy <= 4; yy++) {',
        'float dist = sqrt(float(xx*xx) + float(yy*yy));',
        'float factor = 0.0;',
        'if (dist == 0.0) {',
        'factor = 2.0;',
        '} else {',
        'factor = 2.0/abs(float(dist));',
        '}',
        'sum += texture2D(uMainSampler, texcoord + vec2(xx, yy) * 0.002) * (abs(sin(time))+0.06);',
        '}',
        '}',
        'gl_FragColor = sum * 0.025 + texture2D(uMainSampler, texcoord)*alpha;',
        '}'
      ].join('\n')
    });
  }
});
