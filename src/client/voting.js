/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
let players;
let selectedPlayer;
let soundToggle;

class Voting extends Phaser.Scene {
  constructor () {
    super({
      key: 'voting'
    });
  }

  preload () {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
  }

  create () {
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(20, 20, 'Time to vote!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    this.add.text(20, 50, 'Decide on who you think the impostor is...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    socket.emit('votingStart');
    players = this.physics.add.group();
    const voted = false;
    // Draw all sprites & usernames
    socket.on('votingData', (data) => {
      let x = 140;
      let y = 70;

      Object.keys(data).forEach((index) => {
        const player = this.add.sprite(x, y, 'cat').setScale(3).setOrigin(0, 0).setTint(data[index].colour).setInteractive();
        player.label = this.add.text(x - 50, y + 100, data[index].username).setColor('#ffffff', 0).setFontSize(15);
        player.id = index;
        player.on('pointerdown', function (pointer) {
          selectPlayer(player);
        });
        players.add(player);
        x += 370;
        if (x >= 600) {
          x = 140;
          y += 120;
        }
      });
    });

    createTimer(this);
  }
}
export default Voting;

function selectPlayer (player) {
  // Dim all other sprites
  players.getChildren().forEach((childPlayer) => {
    childPlayer.alpha = 0.7;
    childPlayer.label.setColor('#ffffff', 0);
  });
  // Highlight selected player
  player.alpha = 1;
  player.label.setColor('#ff0000', 0);
  selectedPlayer = player.id;
}

function createTimer (self) {
  /* Taken from https://phaser.discourse.group/t/countdown-timer/2471/4 */
  const timerBg = self.add.rectangle(700, 680, 200, 50, 0x008000).setScrollFactor(0);
  self.initialTime = 30; // in seconds
  self.timerText = self.add.text(630, 670, 'Countdown: ' + formatTime(self.initialTime)).setScrollFactor(0).setFontFamily('Arial');
  // Each 1000 ms call onEvent
  const timedEvent = self.time.addEvent({
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
    socket.emit('sendVote', selectedPlayer, socket.id);
    socket.on('sceneChange', (newScene) => {
      this.scene.start(newScene); // Triggers Phaser scene change, passes player information to new scene
      this.scene.pause();
    });
    socket.emit('votingFinished');
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
