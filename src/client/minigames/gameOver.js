class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'gameOver' });

  }

  create() {

    this.gameOverLabel = this.add.text(50, 50, "Game Over");

  }

  update() {


  }
} export default GameOver;
