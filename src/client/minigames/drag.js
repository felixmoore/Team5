/* eslint-disable no-undef, no-unused-vars */
import { socket } from '../mansion.js';
let allPlayers;
let keys;
let locks;
let score = 0;
let soundToggle;
// let socket;
class Drag extends Phaser.Scene {
  constructor () {
    super({
      key: 'drag'
    });
  }

  init (data) {
    allPlayers = data.allPlayers;
  }

  preload () {

  }

  create () {
    const colours = ['0x8E44AD', '0xffff00', '0x0CFF00', '0x0013FF', '0xFF0061', '0x00FBFF'];
    this.add.image(400, 300, 'background').setScale(2);
    this.cameras.resetAll();
    this.cameras.main.setBounds(0, 0, game.width, game.height);

    this.input.on('pointermove', function (pointer) {
      socket.emit('cursorMovement', [pointer.x, pointer.y]);
    });
    const playerCursors = this.physics.add.group();
    Object.keys(allPlayers).forEach((index) => {
      if (allPlayers[index].id !== socket.id) {
        const otherPlayer = this.add.sprite(400, 300, 'cursor').setScale(0.1).setTint(0xffffff);
        otherPlayer.usernameLabel = this.add.text(400, 335, allPlayers[index].username, playerCursors);
        otherPlayer.id = allPlayers[index].id;
        playerCursors.add(otherPlayer);
      }
    });

    socket.on('cursorMoved', ([player, location]) => {
      try {
        playerCursors.getChildren().forEach((otherPlayer) => {
          if (player.id === otherPlayer.id) {
            otherPlayer.setPosition(location[0], location[1]);
            otherPlayer.usernameLabel.setPosition(location[0], location[1] + 35);
          }
        });
      } catch {
        console.log('Error: no other players.');
      }
    });

    socket.on('disconnect', (id) => {
      handleDisconnect(this, id);
    });

    const scoreText = this.add.text(20, 0, 'Score:  ').setScrollFactor(0).setFontFamily('Arial').setFontSize(30);
    socket.once('dragMinigameLocations', (keyLocations, lockLocations) => {
      if (keys === undefined) {
        keys = this.physics.add.group({
          key: 'key',
          repeat: 5

        });

        keys.children.iterate(function (child) {
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

        locks = this.physics.add.group({
          key: 'lock',
          repeat: 5

        });

        // len = 0;
        locks.children.iterate(function (child) {
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
      }
    });
    socket.emit('dragLoaded');

    socket.on('sceneChange', (newScene) => {
      this.scene.switch(newScene); // Triggers Phaser scene change
    });

    socket.on('keyLockMatch', (key, lock, dragScore) => {
      if (keys.children !== undefined) {
        keys.children.iterate(function (childKey) {
          if (childKey.x === key.x || childKey.y === key.y) {
            childKey.disableBody(true, true);
            // childKey.destroy();
            locks.children.iterate(function (childLock) {
              if (childLock.x === lock.x && childLock.y === lock.y) {
                childLock.disableBody(true, true);
                // childLock.destroy();

                // score = dragScore;
                try {
                  scoreText.setText('Score: ' + score++);
                } catch (err) {
                  console.log('Error updating score.');
                }

                if (locks.getChildren().filter(e => e.active === true).length === 0) {
                  socket.emit('sceneChanged', 'collect');
                }
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
      keys.children.iterate(function (childKey) {
        if (childKey.x === originalCoordinates[0] || childKey.y === originalCoordinates[1]) {
          childKey.x = gameObject.x;
          childKey.y = gameObject.y;
        }
      });
    });

    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        toggleSound(this);
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
function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}
