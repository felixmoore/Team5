/* eslint-disable no-undef, no-unused-vars */
let player;
let cursors;
let nameChanged = false;
const data = {};
const objects = {};
let allPlayers = {};
const time = 0;
let cluesCollected = 0;
let timerText;
let bgm;
let clueCollect;
let socket;
let soundToggle;

// function setName (newName, self) {
//   data.username = newName;

//   nameChanged = true;
// }
class Mansion extends Phaser.Scene {
  constructor () {
    super({
      key: 'mansion'
    });
  }

  preload () {

  }

  create () {
    const self = this; // avoids confusion with 'this' object when scope changes
    socket = io(); // Socket.io connection
    this.otherPlayers = this.physics.add.group();
    this.localState = {};
    const map = this.make.tilemap({
      key: 'map'
    });

    const genericTileset = map.addTilesetImage('generic', 'generic');
    const livingRoomTileset = map.addTilesetImage('living_room', 'living_room');
    const bathroomTileset = map.addTilesetImage('bathroom', 'bathroom');
    const bedroomTileset = map.addTilesetImage('bedroom', 'bedroom');
    const libraryTileset = map.addTilesetImage('library', 'library');
    const kitchenTileset = map.addTilesetImage('kitchen', 'kitchen');
    const stairsRailingsTileset = map.addTilesetImage('stairs_railings', 'stairs_railings');
    const wallsFloorsTileset = map.addTilesetImage('walls_floors', 'walls_floors');

    const allTilesets = [genericTileset, livingRoomTileset, bathroomTileset, bedroomTileset, libraryTileset,
      kitchenTileset, stairsRailingsTileset, wallsFloorsTileset
    ];

    const belowLayer = map.createLayer('Below Player', allTilesets, 0, 0).setCollisionByProperty({
      collides: true
    });
    const stairsLayer = map.createLayer('Stairs & Rugs', allTilesets, 0, 0).setCollisionByProperty({
      collides: true
    });
    const worldLayer = map.createLayer('World', allTilesets, 0, 0).setCollisionByProperty({
      collides: true
    });
    const decorationLowerLayer = map.createLayer('Decoration Lower', allTilesets, 0, 0).setCollisionByProperty({
      collides: true
    });
    const decorationUpperLayer = map.createLayer('Decoration Upper', allTilesets, 0, 0).setCollisionByProperty({
      collides: true
    });
    const aboveLayer = map.createLayer('Above Player', allTilesets, 0, 0);

    aboveLayer.setDepth(10);

    this.physics.world.bounds.width = map.displayWidth;
    this.physics.world.bounds.height = map.displayHeight;

    this.cameras.main.setBounds(0, 0, map.displayWidth, map.displayHeight);

    game.keys = this.input.keyboard.addKeys({
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right'
    });

    socket.on('currentPlayers', (players) => { // Loads all currently connected players.
      allPlayers = players;
      Object.keys(players).forEach((index) => {
        if (players[index].id === socket.id) {
          this.player = this.physics.add
            .sprite(players[index].x, players[index].y, 'cat')
            .setScale(1.5)
            .setOrigin(0, 0)
            .setOffset(0, 24)
            .setVelocity(0);
          this.player.setCollideWorldBounds(true);
          // Adds collisions with each layer of the tile map
          this.physics.add.collider(this.player, stairsLayer);
          this.physics.add.collider(this.player, belowLayer);
          this.physics.add.collider(this.player, worldLayer, null, null, this);
          this.physics.add.collider(this.player, decorationLowerLayer);
          this.physics.add.collider(this.player, decorationUpperLayer);
          this.physics.add.collider(this.player, aboveLayer);

          this.player.setTint(players[index].colour);

          createAnims(self, 'cat');
          this.player.anims.play('stopDown', true);
          this.cameras.main.startFollow(this.player);
        } else {
          addOtherPlayer(this, players[index]);
        }
      });
    });

    configureSocketEvents(this, socket);

    // HUD for clue/role information
    const infoBg = this.add.rectangle(0, 0, map.widthInPixels, 40, 0x008000).setScrollFactor(0);

    // Audio initialisation
    clueCollect = this.sound.add('clueCollect');
    clueCollect.play();
    bgm = this.sound.add('bgm', {
      volume: 0.5
    });
    bgm.setLoop(true);
    bgm.play();

    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        toggleSound(this);
      });

    // jQuery to handle new messages & clear chat box
    $('#chat').submit(function (e) {
      e.preventDefault();
      if ($('#chatInput').val() !== '') {
        socket.emit('newMessage', $('#chatInput').val());
        $('#chatInput').val('');
        return true;
      }
    });

    // Adds message to chat window
    socket.on('newMessage', (msg) => {
      $('#messages').prepend($('<li>').text(msg));
      // TODO make older messages move off the screen
    });

    // jQuery to handle impostor generation for starting the game
    $('#startGame').click(function (e) {
      e.preventDefault();
      socket.emit('gameStarted');
      const key = Object.keys(allPlayers);
      const picked = allPlayers[key[key.length * Math.random() << 0]]; // Selecting a random player from those available
      socket.emit('impostorGenerated', picked.id);
    });

    // Lets user set their own username
    $('#setUsername').click(function (e) {
      const newName = $('#nameInput').val();
      data.username = newName;
      data.id = socket.id;
      nameChanged = true;
    });
  }

  update () {
    if (startGame) {
      // Debug way of accessing the minigames
      // TODO remove !!!
      const keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
      if (keyQ.isDown) {
        socket.emit('sceneChanged', 'discussion');
      }
      const keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      if (keyW.isDown) {
        socket.emit('sceneChanged', 'lose');
        // this.scene.start('collect');
      }

      // Triggers server-side update of username
      if (nameChanged) {
        socket.emit('change_username', data);
        nameChanged = false;
      }

      if (this.player && this.player.body) { // Ensuring player is loaded properly before trying to move
        if (game.keys.left.isDown) {
          this.player.setVelocityX(-160);
          this.player.anims.play('left', true);
        } else if (game.keys.right.isDown) {
          this.player.setVelocityX(160);
          this.player.anims.play('right', true);
        } else {
          if (this.player.body.velocity.x === -160) { // Checking which direction the player was moving in
            this.player.anims.play('stopLeft', true); // Play appropriate rest animation
          } else if (this.player.body.velocity.x === 160) {
            this.player.anims.play('stopRight', true);
          }
          this.player.setVelocityX(0); // Stop moving
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

        // Emit location update to other players
        const x = this.player.x;
        const y = this.player.y;

        if (this.player.previous && (x !== this.player.previous.x || y !== this.player.previous.y)) {
          socket.emit('playerMovement', {
            x: this.player.x,
            y: this.player.y
          });
        }

        this.player.previous = {
          x: this.player.x,
          y: this.player.y
        };
      }
    }
  }
}
export default Mansion;

function createAnims (self, anim) {
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers(anim, {
      start: 0,
      end: 2
    }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopDown',
    frames: [{
      key: anim,
      frame: 1
    }],
    frameRate: 20
  });

  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers(anim, {
      start: 3,
      end: 5
    }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopLeft',
    frames: [{
      key: anim,
      frame: 4
    }],
    frameRate: 20
  });

  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers(anim, {
      start: 6,
      end: 8
    }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopRight',
    frames: [{
      key: anim,
      frame: 7
    }],
    frameRate: 20
  });

  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers(anim, {
      start: 9,
      end: 11
    }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopUp',
    frames: [{
      key: anim,
      frame: 10
    }],
    frameRate: 20
  });
}

// Called to load existing players, or when a new player connects
function addOtherPlayer (self, playerInfo) {
  if (self.scene.isActive()) {
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'cat')
      .setScale(1.5)
      .setOrigin(0, 0);
    createAnims(self, 'cat');
    otherPlayer.anims.play('stopDown', true);
    otherPlayer.setTint(playerInfo.colour);
    otherPlayer.id = playerInfo.id;
    otherPlayer.usernameLabel = self.add.text(playerInfo.x, playerInfo.y + 45, playerInfo.username, self.otherPlayers);
    otherPlayer.room = playerInfo.room;
    self.otherPlayers.add(otherPlayer);
  }
}

// Used for portal teleportation
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
        self.player.x = locState[current.linkedTo].x;
        self.player.y = locState[current.linkedTo].y;
      }
    }
  }
}

// Socket.io server events
function configureSocketEvents (self, socket) {
  socket.on('drawObjects', (objects) => {
    drawObjects(self, objects);
  });
  socket.on('newPlayer', (playerInfo) => {
    addNewPlayer(self, playerInfo);
  });
  socket.on('playerMoved', (data) => {
    handlePlayerMovement(self, data);
  });
  socket.on('rolesUpdate', (data) => {
    updateRoles(self, data);
  });
  socket.on('disconnect', (id) => {
    handleDisconnect(self, id);
  });
  socket.on('sceneChange', (newScene) => {
    self.scene.switch(newScene, { allPlayers }); // Triggers Phaser scene change, passes player information to new scene
    // self.scene.pause();
  });
  /**
   * Updates the local state.
   */
  socket.on('sendState', function (state) {
    self.localState = state;
  });

  // Updates username labels underneath sprites of other players
  socket.on('usernameChanged', function (data) {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data.id === otherPlayer.id) {
        otherPlayer.username = data.username;
        otherPlayer.usernameLabel.setText(data.username);
      }
    });
  });
}

// Drawing clues & portals
function drawObjects (self, objects) {
  const clueText = self.add.text(650, 0, 'Clues collected:  ').setScrollFactor(0).setFontFamily('Arial');
  Object.keys(objects).forEach(o => {
    const obj = self.physics.add.image(objects[o].x, objects[o].y, objects[o].image).setDisplaySize(objects[o].width, objects[o].height).setOrigin(0, 0);
    if (objects[o].linkedTo === undefined) {
      self.physics.add.overlap(self.player, obj, () => {
        socket.emit('clueCollected');
        obj.destroy();
        clueCollect.play();
        cluesCollected++;
        clueText.setText('Clues collected: ' + cluesCollected);
      }, null, self);
      self.physics.add.overlap(self.otherPlayers, obj, () => {
        socket.emit('clueCollected');
        obj.destroy();
        cluesCollected++;
        clueText.setText('Clues collected: ' + cluesCollected);
      }, null, self);
    }
  });
}

// Add new player to client on connection event.
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
      if (otherPlayer.x > data.x) {
        otherPlayer.anims.play('left', true);
      } else if (otherPlayer.x < data.x) {
        otherPlayer.anims.play('right', true);
      }
      if (otherPlayer.y > data.y) {
        otherPlayer.anims.play('up', true);
      } else if (otherPlayer.y < data.y) {
        otherPlayer.anims.play('down', true);
      }
      otherPlayer.setPosition(data.x, data.y);
      otherPlayer.usernameLabel.setPosition(data.x, data.y + 45);
    }
  });
}

/* Updates player role on HUD - Impostor or Innocent */
function updateRoles (self, data) {
  const roleText = self.add.text(0, 0, 'Player role: ').setScrollFactor(0).setFontFamily('Arial');
  if (data === socket.id) {
    roleText.setText('Player role: Impostor - avoid clues!');
  } else {
    roleText.setText('Player role: Innocent - collect clues!');
  }
  createTimer(self);
}

// Remove player from client on disconnection
function handleDisconnect (self, id) {
  try {
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (id === otherPlayer.id) {
        otherPlayer.usernameLabel.destroy();
        otherPlayer.destroy();
      }
    });
  } catch {
    console.log('Player not found!');
  }
}

function createTimer (self) {
  /* Taken from https://phaser.discourse.group/t/countdown-timer/2471/4 */
  self.add.rectangle(700, 680, 200, 50, 0x008000).setScrollFactor(0);
  self.initialTime = 90; // in seconds
  self.timerText = self.add.text(630, 670, 'Countdown: ' + formatTime(self.initialTime)).setScrollFactor(0).setFontFamily('Arial');
  // Each 1000 ms call onEvent
  self.time.addEvent({
    delay: 1000,
    callback: onEvent,
    args: [self],
    callbackScope: self,
    loop: true
  });
}

function formatTime (seconds) {
  // Minutes
  const minutes = Math.floor(seconds / 60);
  // Seconds
  let partInSeconds = seconds % 60;
  // Adds left zeros to seconds
  partInSeconds = partInSeconds.toString().padStart(2, '0');
  // Returns formatted time
  return `${minutes}:${partInSeconds}`;
}

function onEvent (self) {
  self.initialTime -= 1; // One second
  self.timerText.setText('Countdown: ' + formatTime(self.initialTime));

  if (self.initialTime === 0) {
    if (self.scene.isActive('discussion')) {
      socket.emit('sceneChanged', 'voting');
      self.initialTime = 60;
    } else {
      self.initialTime = 60;
      // self.scene.start('drag', {allPlayers}); //used for testing
      socket.emit('sceneChanged', 'discussion');
    }
  }
}

function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}

export { socket };
