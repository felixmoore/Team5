/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
let soundToggle;

class Lose extends Phaser.Scene {
  constructor () {
    super({ key: 'lose' });
  }

  preload () {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
  }

  create () {
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(this.cameras.main.width / 2 - 200, 50, 'You selected...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');

    socket.emit('resultSceneLoaded');

    socket.on('voteResult', (voteResult) => {
      if (voteResult !== null && voteResult !== undefined) {
        const x = this.cameras.main.width / 2 - 80;
        const y = 100;

        const player = this.add.sprite(x, y, 'cat').setScale(3).setOrigin(0, 0).setTint(voteResult.colour).setInteractive();
        this.add.text(x, y + 100, voteResult.username).setColor('#ffffff', 0).setFontSize(15);
        this.add.text(this.cameras.main.width / 2 - 200, 250, 'Your deduction was wrong, \nthis player was not the impostor!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
      } else {
        this.add.text(this.cameras.main.width / 2 - 200, 100, 'Nobody! You lose.').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
      }
    });
    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        toggleSound(this);
      });
  }
}
export default Lose;
function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}
