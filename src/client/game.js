/* eslint-disable no-undef, no-unused-vars */
import Mansion from './mansion.js';
import Discussion from './discussion.js';
import Voting from './voting.js';
import Drag from './minigames/drag.js';
import Collect from './minigames/collect.js';
import GameOver from './minigames/gameOver.js';
import Win from './win.js';
import Lose from './lose.js';

const config = {
  type: Phaser.AUTO,
  audio: {
    disableWebAudio: true,
    noAudio: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game', // renders in a <canvas> element with id game
    width: 800,
    height: 700
  },
  physics: { // physics framework from Phaser
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: {
        y: 0
      }
    }
  },
  scene: [{ preload, create }, Mansion, Discussion, Voting, Drag, Collect, GameOver, Win, Lose]
};

const game = new Phaser.Game(config);

function preload () {
}

async function create () {
  this.scene.start('mansion');
}
