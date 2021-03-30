/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
let soundToggle;

class Discussion extends Phaser.Scene {
  constructor () {
    super({ key: 'discussion' });
  }

  preload () {
    this.load.spritesheet('clock', 'public/assets/clock.png', { frameWidth: 350, frameHeight: 350 });
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
  }

  create () {
    this.anims.create({
      key: 'tick',
      frameRate: 5,
      frames: this.anims.generateFrameNumbers('clock', { start: 2, end: 144 }),
      repeat: -1
    });
    const clock = this.add.sprite(400, 300, 'clock');
    clock.play('tick');
    const mansion = this.scene.get('mansion');
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(20, 20, 'Time to vote!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    this.add.text(20, 50, 'Decide on who you think the impostor is...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    this.add.text(600, 80, 'Discuss -->').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    createTimer(this);
    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        toggleSound(this);
      });
  }
}
export default Discussion;

function createTimer (self) {
  /* Taken from https://phaser.discourse.group/t/countdown-timer/2471/4 */
  const timerBg = self.add.rectangle(700, 680, 200, 50, 0x008000).setScrollFactor(0);
  self.initialTime = 30; // in seconds
  self.timerText = self.add.text(630, 670, 'Countdown: ' + formatTime(self.initialTime)).setScrollFactor(0).setFontFamily('Arial');
  // Each 1000 ms call onEvent
  const timedEvent = self.time.addEvent({ delay: 1000, callback: onEvent, args: [self], callbackScope: self, loop: true });
}

function formatTime (seconds) {
  // Minutes
  const minutes = Math.floor(seconds / 60);
  // Seconds
  let partInSeconds = seconds % 60;
  // Adds left zeros to seconds
  partInSeconds = partInSeconds.toString().padStart(2, '0');
  // Returns formated time
  return `${minutes}:${partInSeconds}`;
}

function onEvent (self) {
  self.initialTime -= 1; // One second
  self.timerText.setText('Countdown: ' + formatTime(self.initialTime));

  if (self.initialTime === 0) {
    socket.emit('sceneChanged', 'voting');
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
