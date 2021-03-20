class Drag extends Phaser.Scene {
    constructor () {

        super({ key: 'drag' });
        
      }
    preload () {
        this.load.image('key', 'public/assets/key.png');
        this.load.image('lock', 'public/assets/lock.png');
    }
  
    create () {
        var keyX = Phaser.Math.Between(0, game.width);
        var keyY = Phaser.Math.Between(0, game.height);
        var key = this.add.image(keyX, keyY, "key");
        key.setInteractive();
        this.input.on('pointerdown', startDrag(), this);
      
        var lockX = Phaser.Math.Between(0, game.width);
        var lockY = Phaser.Math.Between(0, game.height);
        var lock = this.add.image(keyX, keyY, "lock");
      
    }
  }
  export default Drag;

  
function startDrag(pointer, targets){
    // game.input.off('pointerdown', this.startDrag, this);
    game.dragObj = targets[0];
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