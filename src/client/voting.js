/* eslint-disable no-undef, no-unused-vars */
let players;

class Voting extends Phaser.Scene {
  constructor () {
    super({ key: 'voting' });
  }

  preload () {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
  }

  create () {
    this.cameras.main.backgroundColor.setTo(0);
    this.add.text(20, 20, 'Time to vote!').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    this.add.text(20, 50, 'Decide on who you think the impostor is...').setColor('#ff0000', 0).setFontSize(30).setFontFamily('Arial');
    this.socket = io();
    this.socket.emit('votingStart');
    players = this.physics.add.group();
    const voted = false;
    this.socket.on('votingData', (data) => {
      console.log(data);
      // draw all sprites + usernames
      let x = 140;
      let y = 70;

      Object.keys(data).forEach((index) => {
        const player = this.add.sprite(x, y, 'cat').setScale(3).setOrigin(0, 0).setTint(data[index].colour).setInteractive();
        // TODO add a click event & some way of storing a vote
        player.label = this.add.text(x - 50, y + 100, data[index].username).setColor('#ffffff', 0).setFontSize(15);
        player.on('pointerdown', function (pointer) {
          selectPlayer(player, this);
        });
        players.add(player);
        x += 370;
        if (x >= 600) {
          x = 140;
          y += 120;
        }
      });
    });

    // createTimer(this);
  }
}
export default Voting;

function selectPlayer (player, self) {
  // Dim all other sprites
  players.getChildren().forEach((childPlayer) => {
    childPlayer.alpha = 0.7;
    childPlayer.label.setColor('#ffffff', 0);
  });
  // Highlight selected player
  player.alpha = 1;
  player.label.setColor('#ff0000', 0);
}
