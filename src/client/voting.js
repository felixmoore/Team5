class Voting extends Phaser.Scene {
  constructor() { super({key : 'voting'}); }
  preload() {
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png',
                          {frameWidth : 32, frameHeight : 32});
  }

  create() {
    this.cameras.main.backgroundColor.setTo(0);
    this.add.text(20, 20, 'Time to vote!')
        .setColor("#ff0000", 0)
        .setFontSize(30)
        .setFontFamily('Arial');
    this.add.text(20, 50, 'Decide on who you think the impostor is...')
        .setColor("#ff0000", 0)
        .setFontSize(30)
        .setFontFamily('Arial');
    this.socket = io();
    this.socket.emit('votingStart');
    this.socket.on('votingData', (data) => {
      console.log(data);
      // draw all sprites + usernames
      let x = 100;
      let y = 70;

      Object.keys(data).forEach((index) => {
        this.add.sprite(x, y, 'cat')
            .setScale(3)
            .setOrigin(0, 0)
            .setTint(data[index].colour);
        // TODO add a click event & some way of storing a vote
        this.add.text(x - 50, y + 100, data[index].username)
            .setColor("#ff0000", 0)
            .setFontSize(15);
        x += 300;
        if (x >= 450) {
          x = 100;
          y += 150;
        }
      });
    });

    // createTimer(this);
    this.input.once('pointerdown', function() {
      // this.scene.add('mansionScene', MansionScene, true);
    }, this);
  }
}
export default Voting;
