let config = {
  type: Phaser.AUTO, //WebGL if available, Canvas otherwise
  parent: 'game', //renders in a <canvas> element with id game //TODO rename if we have a name
  width: 800, //TODO change to relative size?
  height: 600,

  physics: { //physics framework from Phaser
    default: 'arcade',
    arcade: {
      debug: false,
    //  velocity: 1,
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

const game = new Phaser.Game(config);

function preload() {
  this.load.image('circle', 'public/assets/circle.png');
  this.load.image('button_a', 'public/assets/button_a.png');
  this.load.image('button_b', 'public/assets/button_b.png');
}

function create() {
  let me = this; //avoids confusion with 'this' object when scope changes
  this.socket = io();
  this.otherPlayers = this.physics.add.group();

  this.socket.on('drawObjects', (objects) => {
    Object.keys(objects).forEach( o => {
      me.add.image(objects[o].x, objects[o].y, objects[o].image).setDisplaySize(objects[o].width, objects[o].height).setOrigin(0, 0);
    });
  });

  //load currently connected players
  this.socket.on('currentPlayers', (players) => {
    Object.keys(players).forEach((index) => {
      if (players[index].id === me.socket.id) {
        addPlayer(me, players[index]);
      } else {
        addOtherPlayer(me, players[index]);
      }
    });
  });

  //add new player to client on connection event
  this.socket.on('newPlayer', (playerInfo) => {
    addOtherPlayer(me, playerInfo);
  });

  //update sprite location on player movement
  this.socket.on('playerMoved', (data) => {
      me.otherPlayers.getChildren().forEach( (otherPlayer) => {
      if (data.id === otherPlayer.id) {
        otherPlayer.setPosition(data.x, data.y);
      }
    });
  });

//TODO move this to chat.js
  //jquery to handle new message & clear chat box
  let socket = this.socket;
  $('#chat').submit(function(e) {
    e.preventDefault();
    socket.emit('newMessage', $('#chatInput').val());
    $('#chatInput').val('');
    return true;
  });

  //adds message to chat
  this.socket.on('newMessage', (msg) => {
    $('#messages').prepend($('<li>').text(msg));
      window.scrollTo(0, document.body.scrollHeight); //TODO make older messages move off the screen
  });
  //end todo section

  //remove player sprite when they disconnect
  this.socket.on('disconnect', (id) => {
    me.otherPlayers.getChildren().forEach((otherPlayer) => {
      if (id === otherPlayer.id) {
        otherPlayer.destroy();
      }
    });
  });

  //TODO: bind WASD instead
  //TODO: key to open chat?
  this.keys = this.input.keyboard.createCursorKeys();
  // this.keys = this.input.keyboard.addKeys({
  //   up: Phaser.Input.Keyboard.KeyCodes.W,
  //   down: Phaser.Input.Keyboard.KeyCodes.S,
  //   left: Phaser.Input.Keyboard.KeyCodes.A,
  //   right: Phaser.Input.Keyboard.KeyCodes.D
  // });
}

function addPlayer(me, playerInfo) {
  //TODO change playerImage to something more descriptive
  me.player = me.physics.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);

  me.player.setTint(playerInfo.colour);

}

function addOtherPlayer(me, playerInfo) {
  const otherPlayer = me.add.sprite(playerInfo.x, playerInfo.y, 'circle').setDisplaySize(playerInfo.width, playerInfo.height).setOrigin(0, 0);
  otherPlayer.setTint(playerInfo.colour);
  otherPlayer.id = playerInfo.id;
  me.otherPlayers.add(otherPlayer);
}

function checkLocation(me) {
  if (me.player.x < 100 && me.player.y < 100) {
    me.player.x += 600;
    me.player.y += 400;
  }
}

function update() {

  //TODO add movement
  if (this.player) { //TODO add a check for chat window closed

    if (this.keys.left.isDown) {
      this.player.setVelocityX(-160);
    } else if (this.keys.right.isDown) {
      this.player.setVelocityX( 160);
    } else {
      this.player.setVelocityX(0); //stop moving
    }

    if (this.keys.up.isDown) {
      this.player.setVelocityY(-160);
    } else if (this.keys.down.isDown) {
      this.player.setVelocityY( 160);
    } else {
      this.player.setVelocityY(0);
    }

    checkLocation(this);

    //emit update
    var x = this.player.x;
    var y = this.player.y;
    if (this.player.previous && (x !== this.player.previous.x || y !== this.player.previous.y)){

      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y});
    }

    this.player.previous = {
      x: this.player.x,
      y: this.player.y
    };
  }
}
