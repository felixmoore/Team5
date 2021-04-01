import { socket } from '../mansion.js';

/* eslint-disable no-undef, no-unused-vars */
let soundToggle;
class Collect extends Phaser.Scene {
  constructor () {
    super({
      key: 'collect'
    });

    let text;
    let timedEvent;
    const timeLimit = 120; // timeLimit for countdown in seconds
    const timeOver = false; // set to false at start
    let timeText;
  }

  preload () {
    this.load.image('background', 'public/assets/Victorian Room V2.jpg');
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
    this.load.spritesheet('clue', 'public/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 16

    });

    this.load.spritesheet('clue1', 'public/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 16

    });

    this.load.spritesheet('clue2', 'public/assets/ship.png', {
      frameWidth: 16,
      frameHeight: 16

    });

    this.load.spritesheet('bomb', 'public/assets/bomb.png', {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet('explosion', 'public/assets/explosion.png', {
      frameWidth: 16,
      frameHeight: 16
    });

    this.load.audio('audio_chime', 'public/assets/chime.mp3');
  }

  create () {
    this.room = this.add.image(0, 0, 'background').setScale(2.7);
    this.room.setOrigin(0, 0);

    this.clue = this.add.sprite(10, 10, 'clue').setScale(2);
    this.clue.setOrigin(0, 0);

    this.clue1 = this.add.sprite(60, 10, 'clue').setScale(2);
    this.clue1.setOrigin(0, 0);

    this.clue2 = this.add.sprite(180, 10, 'clue').setScale(2);
    this.clue2.setOrigin(0, 0);

    this.bomb = this.add.sprite(10, 10, 'bomb');
    this.bomb.setOrigin(0, 0);

    this.chimeSound = this.sound.add('audio_chime');

    this.score = 0;
    this.scoreLabel = this.add.text(15, 15, 'Score ');

    this.anims.create({
      key: 'clue_anim',
      frames: this.anims.generateFrameNumbers('clue'),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'clue1_anim',
      frames: this.anims.generateFrameNumbers('clue1'),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'clue2_anim',
      frames: this.anims.generateFrameNumbers('clue2'),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'bomb_anim',
      frames: this.anims.generateFrameNumbers('bomb'),
      frameRate: 20,
      repeat: -1
    });

    this.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion'),
      frameRate: 20,
      repeat: 0
    });

    this.clue.play('clue_anim');
    this.clue1.play('clue1_anim');
    this.clue2.play('clue2_anim');
    this.bomb.play('bomb_anim');

    const clues = [this.clue, this.clue1, this.clue2];
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

      this.clue.setInteractive().on('pointerup', () => {
        this.destroyClue(clue);
      }, this);
      this.clue1.setInteractive().on('pointerup', () => {
        this.destroyClue(clue);
      }, this);
      this.clue2.setInteractive().on('pointerup', () => {
        this.destroyClue(clue);
      }, this);
    });

    const bombs = [this.bomb];

    bombs.forEach((bomb) => {
      bomb.defaultSprite = bomb.texture.key;
      bomb.defaultAnimation = bomb.anims.currentAnim.key;
    });

    bombs.forEach((bomb) => {
      bomb.on('animationcomplete', function (anim, frame) {
        this.emit('animationcomplete_' + anim.key, anim, frame, bomb);
      }, bomb);

      bomb.on('animationcomplete_explosion', (anim, frame, bomb) => {
        this.reviveClue(bomb);
      }, this);

      this.bomb.setInteractive().on('pointerup', () => {
        this.destroyBomb(bomb);
      }, this);
    });

    // this.input.on('gameobjectdown', this.destroyClue, this);
    soundToggle = this.add.image(50, 650, 'sound').setScale(0.5);
    soundToggle
      .setScrollFactor(0)
      .setInteractive({
        useHandCursor: true
      })
      .on('pointerup', () => {
        toggleSound(this);
      });
  }

  update () {
    this.moveClue(this.clue, 1.5);
    this.moveClue(this.clue1, 2);
    this.moveClue(this.clue2, 2.5);
    this.moveBomb(this.bomb, 1);
    if (this.score >= 100 || this.score < 0) {
      // this.gameOver();
      this.physics.pause();
      if (this.score >= 100) {
        this.add.text(400, 300, 'You won! :)');
      }

      if (this.score < 0) {
        this.add.text(400, 300, 'You lost! :(');
      }

      setTimeout(() => {
        console.log('sent');
        socket.emit('sceneChanged', 'discussion');
        this.scene.switch('discussion');
        // this.scene.remove();
      }, 4000);
    }
  }

  moveClue (clue, speed) {
    clue.y += speed;
    if (clue.y > 600) {
      this.resetCluePos(clue);
    }
  }

  moveBomb (bomb, speed) {
    bomb.y += speed;

    if (bomb.y > 600) {
      this.resetBombPos(bomb);
    }
  }

  resetBombPos (bomb) {
    bomb.y = 0;

    const randomX = Phaser.Math.Between(0, 800);
    bomb.x = randomX;

    this.scoreLabel.text = 'Score: ' + this.score;
  }

  destroyBomb (gameObject) {
    gameObject.setTexture('explosion');
    gameObject.play('explode');

    this.score -= 20;
    this.scoreLabel.text = 'Score: ' + this.score;
  }

  reviveBomb (bomb) {
    // doesn't show explosion animation but revives clue
    bomb.setTexture(bomb.defaultSprite);
    bomb.play(bomb.defaultAnimation);
    this.resetBombPos(bomb);
  }

  resetCluePos (clue) {
    const randomX = Phaser.Math.Between(0, 800);
    const randomY = Phaser.Math.Between(-100, 150);
    clue.y = randomY;
    clue.x = randomX;

    this.scoreLabel.text = 'Score: ' + this.score;
  }

  destroyClue (gameObject) {
    gameObject.setTexture('explosion');
    gameObject.play('explode');

    this.score += 10;
    this.scoreLabel.text = 'Score: ' + this.score;
    this.chimeSound.play();

    this.reviveClue(this.clue);
    this.reviveClue(this.clue1);
    this.reviveClue(this.clue2);
  }

  reviveClue (clue) {
    // doesn't show explosion animation but revives clue
    clue.setTexture(clue.defaultSprite);
    clue.play(clue.defaultAnimation);
    this.resetCluePos(clue);
  }

  gameOver () {
    // this.time.delayedCall(4000, onEvent, null, this); // waits to allow players to read text
    this.physics.pause();
    if (this.score >= 100) {
      this.add.text(400, 300, 'You won! :)');
    }

    if (this.score < 0) {
      this.add.text(400, 300, 'You lost! :(');
    }

    // setTimeout(() => {
    //   console.log('sent');
    //   socket.emit('sceneChanged', 'discussion');
    // }, 4000);
  }
}
export default Collect;

function toggleSound (self) {
  if (!self.game.sound.mute) {
    self.game.sound.mute = true;
    soundToggle.setTexture('mute');
  } else {
    self.game.sound.mute = false;
    soundToggle.setTexture('sound');
  }
}

function onEvent () {
  console.log('sent');
  socket.emit('sceneChanged', 'discussion');
}
