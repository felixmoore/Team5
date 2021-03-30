/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
class Lose extends Phaser.Scene {
  constructor () {
    super({ key: 'lose' });
  }

  preload () {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
  }

  create () {
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(this.cameras.main.width / 2 - 80, 50, 'You selected...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');

    socket.emit('resultSceneLoaded');

    socket.on('voteResult', (voteResult) => {
      const x = this.cameras.main.width / 2 - 80;
      const y = 100;

      const player = this.add.sprite(x, y, 'cat').setScale(3).setOrigin(0, 0).setTint(voteResult.colour).setInteractive();
      this.add.text(x, y + 100, voteResult.username).setColor('#ffffff', 0).setFontSize(15);
      this.add.text(this.cameras.main.width / 2 - 200, 250, 'Your deduction was wrong, \nthis player was not the impostor!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    });
  }
}
export default Lose;
