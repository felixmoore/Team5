/* eslint-disable no-undef, no-unused-vars */
const timeLimit = 120; // timeLimit for countdown in seconds
const timeOver = false; // set to false at start
let timeText;
let soundToggle;

class Collect extends Phaser.Scene {
  constructor () {
    super({ key: 'collect' });
  }

  preload () {
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
    this.load.image('background', 'public/assets/Victorian Room V2.jpg');
    this.load.spritesheet('clue', 'public/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 16

    });
    /*

    this.load.spritesheet('clue1','public/assets/ship.png',{
      frameWidth: 16,
      frameHeight: 16

    });
    */

    this.load.spritesheet('explosion', 'public/assets/explosion.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    this.load.audio('audio_chime', 'public/assets/chime.mp3');
  }

  create () {
    this.room = this.add.image(0, 0, 'background');
    // this.room = this.add.tileSprite(0,0,config.width,config.height,'background');
    this.room.setOrigin(0, 0);
    this.clue = this.add.sprite(10, 10, 'clue');
    this.clue.setOrigin(0, 0);
    /*
    this.clue1 = this.add.sprite(90,20,"clue1");
    this.clue1.setOrigin(0,0);
    */

    this.chimeSound = this.sound.add('audio_chime');

    this.score = 0;
    this.scoreLabel = this.add.text(15, 15, 'Score ');
    // this.cursors = this.input.keyboard.createCursorKeys();
    // game.physics.startSystem(Phaser.Physics.P2JS);
    this.anims.create({
      key: 'clue_anim',
      frames: this.anims.generateFrameNumbers('clue'),
      frameRate: 20,
      repeat: -1
    });
    /*
        this.anims.create({
          key: "clue1_anim",
          frames: this.anims.generateFrameNumbers("clue1"),
          frameRate: 20,
          repeat: -1,
        });
        */

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion'),
      frameRate: 20,
      repeat: 0,
      hideOnComplete: true
    });

    this.clue.play('clue_anim');
    // this.clue1.play("clue1_anim");
    // let clues = [this.clue,this.clue1];
    const clues = [this.clue];
    clues.forEach((clue) => {
      clue.defaultSprite = clue.texture.key;
      clue.defaultAnimation = clue.anims.currentAnim.key;
    });

    clues.forEach((clue) => {
      clue.on('animationcomplete', function (anim, frame) {
        this.emit('animationcomplete_' + anim.key, anim, frame, clue);
      }, clue);

      clue.on('animationcomplete_explosion', (anim, frame, clue) => {
        this.reviveClue(clue);
      }, this);

      this.clue.setInteractive();
      // this.clue1.setInteractive();
    });
    // this.clue.setInteractive();

    this.input.on('gameobjectdown', this.destroyClue, this);
    //  this.input.on('gameobjectdown2', score = 30, this.scene.start("playGame"));
  }

  update () {
    this.moveClue(this.clue, 1);
    // this.moveClue(this.clue1,1);
    this.gameOver();

    if (this.timeOver === false) displayTimeRemaining();
    else {
      // add code for when timer runs out
      // player.kill();

    }
    //  text.setText('Event.progress: ' + timedEvent.getProgress().toString().substr(0, 4));
    /*
        if (!this.timerEvent || this.duration <= 0)
        {
          return
        }

        const elapsed = this.timerEvent.getElapsed()
        const remaining = this.duration - elapsed
        const seconds = remaining / 1000

        this.label.text = seconds.toFixed(2)
    */
  }
  /*
  displayTimeRemaining() {
      var time = Math.floor(this.time.totalElapsedSeconds());
      var timeLeft = timeLimit - time;

      // detect when countdown is over
      if (timeLeft <= 0) {
          timeLeft = 0;
          timeOver = true;
      }

      var min = Math.floor(timeLeft / 60);
      var sec = timeLeft % 60;

      if (min < 10) {
          min = '0' + min;
      }
      if (sec < 10) {
          sec = '0' + sec;
      }
      timeText.text = 'Time Left ' + min + ':' + sec;
  }
  */

  moveClue (clue, speed) {
    clue.y += speed;
    // 259 = config.Height
    if (clue.y > 259) {
      this.resetCluePos(clue);
    }
  }

  resetCluePos (clue) {
    // this.score +=10;
    clue.y = 0;
    // 431 = config.Width
    const randomX = Phaser.Math.Between(0, 431);
    clue.x = randomX;
    // clue.x = 10;
    // this.chimeSound.play();
    // this.score +=10;
    this.scoreLabel.text = 'Score: ' + this.score;
  }

  destroyClue (pointer, gameObject) {
    gameObject.setTexture('explosion');
    gameObject.play('explode');
    // this.resetCluePos(this.clue);

    this.score += 10;
    this.scoreLabel.text = 'Score: ' + this.score;
    this.chimeSound.play();
    // this.resetCluePos(this.clue);
    this.reviveClue(this.clue);
    // this.reviveClue(this.clue1);
  }

  reviveClue (clue) {
    // show explosion animation but doesn't revives clue
    // clue.setTexture(clue.texture.key);
    // clue.play(clue.anims.currentAnim.key);
    // doesn't show explosion animation but revives clue
    clue.setTexture(clue.defaultSprite);
    clue.play(clue.defaultAnimation);
    this.resetCluePos(clue);
  }

  gameOver () {
    if (this.score >= 100) {
      this.scene.start('gameOver');
      this.gameOverLabel = this.add.text(50, 50, 'Game Over');
    }
  }
} export default Collect;
function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}
