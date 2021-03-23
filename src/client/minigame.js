// import Phaser from 'phaser';


var config = {
  width: 800,
  height: 600,
  type: Phaser.AUTO,
  audio: {
    disableWebAudio: true
  },
  physics: {
    default: 'arcade',
    arcade: {
      fps: 60,
      gravity: {y : 0},
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

 var game = new Phaser.Game(config);

function preload ()
{
  this.load.image('key', 'public/assets/key.png');
  this.load.image('lock', 'public/assets/lock.png');
}

function create ()
{
  var keyX = Phaser.Math.Between(0, game.config.width);
  var keyY = Phaser.Math.Between(0, game.config.height);
  var key = this.add.image(keyX, keyY, "key");
  key.setInteractive();
  this.input.on('pointerdown', startDrag(), this);

  var lockX = Phaser.Math.Between(0, game.config.width);
  var lockY = Phaser.Math.Between(0, game.config.height);
  var lock = this.add.image(keyX, keyY, "lock");


}

function startDrag(pointer, targets){
  // game.input.off('pointerdown', this.startDrag, this);
  game.dragObj= targets[0];
  game.input.on('pointermove', doDrag(),this);
  game.input.on('pointerup', stopDrag(), this);

}

function doDrag(pointer){
  if (typeof this.dragObj !== "undefined"){
   this.dragObj.x = pointer.x;
   this.dragObj.y = pointer.y;
  }
}
function stopDrag(){
  this.input.on('pointerdown', this.startDrag, this);
  this.input.off('pointermove', this.doDrag,this);
  this.input.off('pointerup', this.stopDrag, this);
}

function update ()
{
}


