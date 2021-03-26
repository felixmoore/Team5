/* eslint-disable no-undef, no-unused-vars */
import Mansion from '../mansion.js';
let allPlayers;
let keys;
let locks;
let score = 0;
class Drag extends Phaser.Scene {
  constructor () {
    super({
      key: 'drag'
    });
  }

  init (data) {
    console.log('init', data);

    allPlayers = data.allPlayers;
    console.log(allPlayers);
    // this.imageID = data.id;
    // this.imageFile = data.image;
  }

  preload () {
    this.load.image('key', 'public/assets/key.png'); // TODO needs source in readme.md
    this.load.image('lock', 'public/assets/lock.png'); // TODO needs source in readme.md
    this.load.image('background', 'public/assets/background2.jpg'); // TODO needs source in readme.md
    this.load.image('cursor', 'public/assets/cursor.png'); // TODO credit in readme.md https://www.iconfinder.com/icons/7225814/arrow_cursor_icon
  }

  create () {
    const socket = io();

    this.input.on('pointermove', function (pointer) {
      // darkSmoke.setPosition(pointer.x, pointer.y);
      // fire.setPosition(pointer.x, pointer.y);
      socket.emit('cursorMovement', [pointer.x, pointer.y]);
    });
    const playerCursors = this.physics.add.group();
    Object.keys(allPlayers).forEach((index) => {
      if (allPlayers[index].id !== socket.id) {
        const otherPlayer = this.add.sprite(400, 300, 'cursor').setTint();
        otherPlayer.id = allPlayers[index].id;
        playerCursors.add(otherPlayer);
      }
    });

    socket.on('cursorMoved', ([player, location]) => {
      playerCursors.getChildren().forEach((otherPlayer) => {
        if (player.id === otherPlayer.id) {
          //   otherPlayer.setPosition(location[0], location[1]);
          console.log(location);
        }
      });
    });

    socket.on('disconnect', (id) => {
      handleDisconnect(this, id);
    });

    const colours = ['0x8E44AD', '0xffff00', '0x0CFF00', '0x0013FF', '0xFF0061', '0x00FBFF'];
    this.add.image(400, 300, 'background').setScale(2);
    this.cameras.main.setBounds(0, 0, game.width, game.height);
    const scoreText = this.add.text(20, 0, 'Score:  ').setScrollFactor(0).setFontFamily('Arial').setFontSize(30);
    socket.on('dragMinigameLocations', (keyLocations, lockLocations) => {
      console.log('key =' + keyLocations);
      keys = this.physics.add.group({
        key: 'key',
        repeat: 5

      });

      // let len = 0;
      keys.children.iterate(function (child) {
        // child.x = Phaser.Math.RND.between(0, 800);
        // child.y = Phaser.Math.RND.between(30, 600);
        child.setInteractive({
          draggable: true
        });
        child.setScale(0.15);
        // len++;
      });

      for (let i = 0; i < 5; i++) {
        keys.children.entries[i].setTint(colours[i]);
        keys.children.entries[i].x = keyLocations[i][0];
        keys.children.entries[i].y = keyLocations[i][1];
      }

      // TODO add check to make sure key + lock don't spawn in the same spot

      locks = this.physics.add.group({
        key: 'lock',
        repeat: 5

      });

      // len = 0;
      locks.children.iterate(function (child) {
        // child.x = Phaser.Math.RND.between(0, 800);
        // child.y = Phaser.Math.RND.between(0, 600);
        child.setScale(0.08);
        // len++;
      });

      for (let i = 0; i < 5; i++) {
        locks.children.entries[i].setTint(colours[i]);
        locks.children.entries[i].x = lockLocations[i][0];
        locks.children.entries[i].y = lockLocations[i][1];
      }

      this.physics.add.overlap(keys, locks, function (key, lock) {
        tryLock(key, lock, socket);
      }, null, this);
    });
    socket.emit('dragLoaded');

    socket.on('keyLockMatch', (key, lock) => {
      if (keys.children !== undefined) {
        keys.children.iterate(function (childKey) {
          if (childKey.x === key.x || childKey.y === key.y) {
            childKey.disableBody(true, true);

            locks.children.iterate(function (childLock) {
              if (childLock.x === lock.x && childLock.y === lock.y) {
                childLock.disableBody(true, true);
                score++;
                scoreText.setText('Score: ' + score);
              }
            });
          }
        });
      }
    });

    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
      const originalCoordinates = [gameObject.x, gameObject.y];
      gameObject.x = dragX;
      gameObject.y = dragY;
      socket.emit('keyMoved', gameObject, originalCoordinates);
    });

    socket.on('keyMovement', (gameObject, originalCoordinates) => {
      console.log('triggered');
      keys.children.iterate(function (childKey) {
        if (childKey.x === originalCoordinates[0] || childKey.y === originalCoordinates[1]) {
          childKey.x = gameObject.x;
          childKey.y = gameObject.y;
        }
      });
    });
  }

  update () {

  }
}
export default Drag;

function tryLock (key, lock, socket) {
  if (key.tintTopLeft === lock.tintTopLeft) {
    socket.emit('keyLockMatched', key, lock);
  }
}

function handleDisconnect (self, id) {
  self.otherPlayers.getChildren().forEach((otherPlayer) => {
    if (id === otherPlayer.id) {
      otherPlayer.destroy();
    }
  });
}
