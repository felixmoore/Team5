import Discussion from './discussion.js';
import Mansion from './mansion.js';
import Drag from './minigames/drag.js';
import Voting from './voting.js';

// import CustomPipeline from './pipeline.js';

const config = {
  type : Phaser.AUTO,
  audio : {disableWebAudio : true, noAudio : false},
  scale : {
    mode : Phaser.Scale.FIT,
    parent : 'game', // renders in a <canvas> element with id game
    width : 800,
    height : 700
  },
  physics : {
    // physics framework from Phaser
    default : 'arcade',
    arcade : {debug : false, gravity : {y : 0}}
  },
  scene : [ {preload, create}, Mansion, Discussion, Voting, Drag ]
  // ,callbacks: {
  //   postBoot: game => {
  //     game.renderer.addPipeline('Custom', new
  //     CustomPipeline(game)).setFloat1('alpha', 1.0);
  //   }
  // }
};

const game = new Phaser.Game(config);
function setName(newName) {
  data.username = newName;
  nameChanged = true;
}

function preload() {
  // TODO add loading screen
  // game.renderer.addPipeline('Custom', new
  // CustomPipeline(game)).setFloat1('alpha', 1.0);
}

async function create() {
  this.scene.start('mansion');
  // this.renderer.addPipeline('Custom', new
  // CustomPipeline(this)).setFloat1('alpha', 1.0);
}

// Custom texture pipeline used to make the clue sprites flash, needs to be
// moved to another file after MVP
const CustomPipeline = new Phaser.Class({
  Extends : Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline,
  initialize : function CustomPipeline(game) {
    Phaser.Renderer.WebGL.Pipelines.TextureTintPipeline.call(this, {
      game : game,
      renderer : game.renderer,
      fragShader : [
        'precision lowp float;',
        'varying vec2 outTexCoord;',
        'varying vec4 outTint;',
        'uniform sampler2D uMainSampler;',
        'uniform float alpha;',
        'uniform float time;',
        'void main() {',
        'vec4 sum = vec4(0);',
        'vec2 texcoord = outTexCoord;',
        'for(int xx = -4; xx <= 4; xx++) {',
        'for(int yy = -4; yy <= 4; yy++) {',
        'float dist = sqrt(float(xx*xx) + float(yy*yy));',
        'float factor = 0.0;',
        'if (dist == 0.0) {',
        'factor = 2.0;',
        '} else {',
        'factor = 2.0/abs(float(dist));',
        '}',
        'sum += texture2D(uMainSampler, texcoord + vec2(xx, yy) * 0.002) * (abs(sin(time))+0.06);',
        '}',
        '}',
        'gl_FragColor = sum * 0.025 + texture2D(uMainSampler, texcoord)*alpha;',
        '}'
      ].join('\n')
    });
  }
});