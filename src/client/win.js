/* eslint-disable no-undef, no-unused-vars */
import { socket } from './mansion.js';
class Win extends Phaser.Scene {
  constructor () {
    super({ key: 'win' });
  }

  preload () {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
  }

  create () {
    this.cameras.main.backgroundColor.setTo('#282828');
    this.add.text(this.cameras.main.width / 2 - 80, 50, 'You selected...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');

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
