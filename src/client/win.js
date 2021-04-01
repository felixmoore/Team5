/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
let soundToggle;

class Win extends Phaser.Scene {
  constructor () {
    super({ key: 'win' });
  }

  preload () {
  }

  create () {
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(this.cameras.main.width / 2 - 80, 50, 'You selected...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        toggleSound(this);
      });
    socket.emit('resultSceneLoaded');
    socket.on('voteResult', (voteResult) => {
      // draw all sprites + usernames
      const x = this.cameras.main.width / 2 - 80;
      const y = 100;

      const player = this.add.sprite(x, y, 'cat').setScale(3).setOrigin(0, 0).setTint(voteResult.colour).setInteractive();
      player.label = this.add.text(x, y + 100, voteResult.username).setColor('#ffffff', 0).setFontSize(15);

      this.add.text(this.cameras.main.width / 2 - 200, 250, 'You solved the mystery, \nthis player was the impostor!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    });
  }
}
export default Win;
function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}
