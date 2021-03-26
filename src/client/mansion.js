let player;
let cursors;
let nameChanged = false;
let data = {};
let objects = {};
let allPlayers = {};
let time = 0;
let cluesCollected = 0;
let timerText;
let bgm;
let clue_collect;

function setName(newName) {
  data.username = newName;
  nameChanged = true;
}
class Mansion extends Phaser.Scene {
  constructor() {

    super({ key: 'mansion' });

  }

  preload() {
    this.load.image('button_a', 'public/assets/button_a.png');
    this.load.image('button_b', 'public/assets/button_b.png');
    this.load.image('clue_bone', 'public/assets/clues/bone01a.png');
    this.load.image('clue_book', 'public/assets/clues/book_01g.png');
    this.load.image('clue_knife', 'public/assets/clues/sword_03c.png');
    this.load.image('clue_poison', 'public/assets/clues/potion_01a.png');

    this.load.image("generic", "public/assets/tilesets/1_Generic_48x48.png");
    this.load.image("living_room", "public/assets/tilesets/2_LivingRoom_48x48.png");
    this.load.image("bathroom", "public/assets/tilesets/3_Bathroom_48x48.png");
    this.load.image("bedroom", "public/assets/tilesets/4_Bedroom_48x48.png");
    this.load.image("library", "public/assets/tilesets/5_Classroom_and_library_48x48.png");
    this.load.image("kitchen", "public/assets/tilesets/12_Kitchen_48x48.png");
    this.load.image("stairs_railings", "public/assets/tilesets/17_Visibile_Upstairs_System_48x48.png");
    this.load.image("walls_floors", "public/assets/tilesets/Tilesets_48x48.png");

    this.load.tilemapTiledJSON("map", "public/assets/tilesets/map.json");
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('clue_collect', 'public/assets/sound/Fruit collect 1.wav');
    this.load.audio('bgm', 'public/assets/sound/Ludum Dare 38 - Track 6.wav');

  }

  create() {
    const self = this; // avoids confusion with 'this' object when scope changes
    this.socket = io();
    this.otherPlayers = this.physics.add.group();
    this.localState = {};
    const map = this.make.tilemap({ key: "map" });

    const generic_tileset = map.addTilesetImage("generic", "generic");
    const living_room_tileset = map.addTilesetImage("living_room", "living_room");
    const bathroom_tileset = map.addTilesetImage("bathroom", "bathroom");
    const bedroom_tileset = map.addTilesetImage("bedroom", "bedroom");
    const library_tileset = map.addTilesetImage("library", "library");
    const kitchen_tileset = map.addTilesetImage("kitchen", "kitchen");
    const stairs_railings_tileset = map.addTilesetImage("stairs_railings", "stairs_railings");
    const walls_floors_tileset = map.addTilesetImage("walls_floors", "walls_floors");

    const allTilesets = [generic_tileset, living_room_tileset, bathroom_tileset, bedroom_tileset, library_tileset,
      kitchen_tileset, stairs_railings_tileset, walls_floors_tileset];

    const belowLayer = map.createLayer("Below Player", allTilesets, 0, 0).setCollisionByProperty({ collides: true });
    const stairsLayer = map.createLayer("Stairs & Rugs", allTilesets, 0, 0).setCollisionByProperty({ collides: true });
    const worldLayer = map.createLayer("World", allTilesets, 0, 0).setCollisionByProperty({ collides: true });
    const decorationLowerLayer = map.createLayer("Decoration Lower", allTilesets, 0, 0).setCollisionByProperty({ collides: true });
    const decorationUpperLayer = map.createLayer("Decoration Upper", allTilesets, 0, 0).setCollisionByProperty({ collides: true });
    const aboveLayer = map.createLayer("Above Player", allTilesets, 0, 0);


    aboveLayer.setDepth(10);

    // //shows tiles that should have collisions on world layer (e.g. walls)
    // const debugGraphics = this.add.graphics().setAlpha(0.75);
    // worldLayer.renderDebug(debugGraphics, {
    // tileColor: null, // Color of non-colliding tiles
    // collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    // faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });

    this.physics.world.bounds.width = map.displayWidth;
    this.physics.world.bounds.height = map.displayHeight;

    this.cameras.main.setBounds(0, 0, map.displayWidth, map.displayHeight).setZoom(1); //TODO looks better at 1.5, but breaks the info/timer bar?

    // glow effect
    // customPipeline = game.renderer.addPipeline('Custom', new CustomPipeline(game));
    // customPipeline.setFloat1('alpha', 1.0);

    game.keys = this.input.keyboard.addKeys({
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right'
    });


    this.socket.on('currentPlayers', (players) => { //Loads all currently connected players.

      allPlayers = players;
      Object.keys(players).forEach((index) => {
        if (players[index].id === this.socket.id) {
          this.player = this.physics.add
            .sprite(players[index].x, players[index].y, 'cat')
            .setScale(1.5)
            .setOrigin(0, 0)
            .setOffset(0, 24)
            .setVelocity(0);
          this.player.setCollideWorldBounds(true);

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

    configureSocketEvents(this, this.socket);

    const infoBg = this.add.rectangle(0, 0, map.widthInPixels, 40, 0x008000).setScrollFactor(0);

    clue_collect = this.sound.add('clue_collect');
    clue_collect.play();
    bgm = this.sound.add('bgm', { volume: 0.5 });
    bgm.setLoop(true);
    // bgm.play(); //commented out for now to stop it being annoying while debugging

    // TODO move jquery to chat.js?
    // jquery to handle new message & clear chat box

    const socket = this.socket;
    $('#chat').submit(function (e) {
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


    // TODO make this save properly server side
    // jquery to handle impostor generation

    $('#startGame').click(function (e) {
      e.preventDefault();
      socket.emit('gameStarted');
      var key = Object.keys(allPlayers);
      let picked = allPlayers[key[key.length * Math.random() << 0]];
      socket.emit('impostorGenerated', picked.id);
      createTimer(self);
    });

    $('#setUsername').click(function (e) {
      let newName = $('#nameInput').val();
      data.username = newName;
      console.log('Username changed: '+newName);
      nameChanged = true;
    });


  }

  update() {
    if (startGame) {
      const testRect = this.add.rectangle(1988, 816, 500, 300, 0x008000).setScrollFactor(0);

      //debug way of accessing the minigames
      //TODO remove
      let keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);;
      if (keyQ.isDown){
        this.socket.emit('sceneChanged', 'drag');
      }
      let keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);;
      if (keyW.isDown){
        this.scene.start('collect');
      }

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
  }



}
export default Mansion;


function createAnims(self, anim) {
  self.anims.create({
    key: 'down',
    frames: self.anims.generateFrameNumbers(anim, { start: 0, end: 2 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopDown',
    frames: [{ key: anim, frame: 1 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'left',
    frames: self.anims.generateFrameNumbers(anim, { start: 3, end: 5 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopLeft',
    frames: [{ key: anim, frame: 4 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'right',
    frames: self.anims.generateFrameNumbers(anim, { start: 6, end: 8 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopRight',
    frames: [{ key: anim, frame: 7 }],
    frameRate: 20
  });

  self.anims.create({
    key: 'up',
    frames: self.anims.generateFrameNumbers(anim, { start: 9, end: 11 }),
    frameRate: 5,
    repeat: -1
  });

  self.anims.create({
    key: 'stopUp',
    frames: [{ key: anim, frame: 10 }],
    frameRate: 20
  });


}

function addOtherPlayer(self, playerInfo) {
  if (self.scene.isActive()){
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'cat')
    .setScale(1.5)
    .setOrigin(0, 0);
  // .setOffset(0, 24);
  createAnims(self, 'cat');
  otherPlayer.anims.play('stopDown', true);
  otherPlayer.setTint(playerInfo.colour);
  otherPlayer.id = playerInfo.id;
  otherPlayer.room = playerInfo.room;
  self.otherPlayers.add(otherPlayer);
  }
}

/**
 *
 * @param {} self
 * @author
 */
function checkCollision(self) {
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
        self.player.y = locState[current.linkedTo].y; 
      } else {
        if (current.clues != null) { // clue collision 
          self.collectClue();
          clue_collect.play();
          // self.game.state.load('wordsearch', 'src/client/minigames/wordsearch.js') //test line
        }
      }
    }
  }
}

function configureSocketEvents(self, socket) {
  socket.on('drawObjects', (objects) => { drawObjects(self, objects); });
  socket.on('newPlayer', (playerInfo) => { addNewPlayer(self, playerInfo); });
  socket.on('playerMoved', (data) => { handlePlayerMovement(self, data); });
  socket.on('colourUpdate', (data, colour) => { updateSpriteColour(self, data, colour); });
  socket.on('disconnect', (id) => { handleDisconnect(self, id); });
  socket.on('movement', (other) => { handlePlayerMovementAlternate(self, other); });
  socket.on('sceneChange', (newScene) => {
    self.scene.start(newScene, {allPlayers}); 
    self.scene.pause();
  });
  /**
   * Updates the local state.
   */
  socket.on('sendState', function (state) {
    self.localState = state;
  });
}

function drawObjects(self, objects) {
  const clueText = self.add.text(650, 0, 'Clues collected:  ').setScrollFactor(0).setFontFamily('Arial');
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


// Add new player to client on connection event.
function addNewPlayer(self, playerInfo) {
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
function handlePlayerMovement(self, data) {
  self.otherPlayers.getChildren().forEach((otherPlayer) => {
    if (data.id === otherPlayer.id) {
      otherPlayer.setPosition(data.x, data.y);
    }
  });
}

/* Updates tint on player sprite.
Used for impostor demo, will need to be adapted in future
TODO - move setText lines out */
function updateSpriteColour(self, data, colour) {
  let roleText = self.add.text(0, 0, 'Player role: ').setScrollFactor(0).setFontFamily('Arial');
  if (data === self.socket.id) {
    //self.player.setTint(colour);
    self.socket.emit('colourUpdated', data, colour);
    roleText.setText('Player role: Impostor - avoid clues!');
  } else {
    roleText.setText('Player role: Innocent - collect clues!');
    self.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (data === otherPlayer.id) {
        //otherPlayer.setTint(colour);
        self.socket.emit('colourUpdated', data, colour);
      }
    });
  }
}

// Remove player sprite when they disconnect
function handleDisconnect(self, id) {
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
   */
function handlePlayerMovementAlternate(self, other) {
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
function collectClue() {
  const self = this;
  clue.disableBody(true, true); //removes clue from map if overlap with player is detected
  self.cluesCollected += 1; // increments clue collected value by 1
  self.clueLabel.text = self.cluesCollected //passes cluesCollected value to on screen score label TODO: clueLabel method
  game.clue_collect.play();
  // //opens wordsearch minigame
  // self.game.state.load('wordsearch', 'src/client/minigames/wordsearch.js')
}

function createTimer(self) {
  /* Taken from https://phaser.discourse.group/t/countdown-timer/2471/4 */
  const timerBg = self.add.rectangle(700, 680, 200, 50, 0x008000).setScrollFactor(0);
  self.initialTime = 90; // in seconds
  self.timerText = self.add.text(630, 670, 'Countdown: ' + formatTime(self.initialTime)).setScrollFactor(0).setFontFamily('Arial');
  // Each 1000 ms call onEvent
  let timedEvent = self.time.addEvent({ delay: 1000, callback: onEvent, args: [self], callbackScope: self, loop: true });
}

function formatTime(seconds) {
  // Minutes
  let minutes = Math.floor(seconds / 60);
  // Seconds
  let partInSeconds = seconds % 60;
  // Adds left zeros to seconds
  partInSeconds = partInSeconds.toString().padStart(2, '0');
  // Returns formatted time
  return `${minutes}:${partInSeconds}`;
}

function onEvent(self) {
  self.initialTime -= 1; // One second
  self.timerText.setText('Countdown: ' + formatTime(self.initialTime));

  if (self.initialTime === 0) {
    if (self.scene.isActive('discussion')) {
      // self.scene.start('voting');
      // self.initialTime = 60;
      console.log('tmep');
    } else {
      // self.scene.start('discussion');
      // self.initialTime = 60;
      // self.scene.start('drag', {allPlayers});
      self.socket.emit('sceneChanged', 'drag');
        // self.scene.pause();
    }
  }
}
