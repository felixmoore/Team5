class Drag extends Phaser.Scene {
    constructor() {

        super({ key: 'drag' });

    }
    preload() {
        this.load.image('key', 'public/assets/key.png'); //TODO needs source in readme.md
        this.load.image('lock', 'public/assets/lock.png'); //TODO needs source in readme.md
        this.load.image('background', 'public/assets/background2.jpg'); //TODO needs source in readme.md
    }

    create() {
        this.add.image(400, 300, 'background').setScale(2);
       // this.cameras.main.setBounds(0, 0, map.displayWidth, map.displayHeight).setZoom(1);
        var keyX = Phaser.Math.Between(0, 400);
        var keyY = Phaser.Math.Between(0, 300);
        var key = this.add.image(keyX, keyY, "key").setScale(0.3);
        key.setInteractive();
        // this.input.on('pointerdown', this.startDrag, this);

        this.input.setDraggable(key); //https://phaser.io/examples/v3/view/game-objects/container/draggable-container

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

            gameObject.x = dragX;
            gameObject.y = dragY;
    
        });

        //TODO add check to make sure key + lock don't spawn in the same spot
        var lockX = Phaser.Math.Between(0, game.width);
        var lockY = Phaser.Math.Between(0, game.height);
        var lock = this.add.image(keyX, keyY, "lock").setScale(0.1);


    }

    update() {

    }
}
export default Drag;


function startDrag(pointer, targets) {
    this.input.off('pointerdown', this.startDrag, this);
    this.dragObj = targets[0];
    this.input.on('pointermove', this.doDrag, this);
    this.input.on('pointerup', this.stopDrag, this);
}

function doDrag(pointer) {
    if (typeof this.dragObj !== "undefined") {
        this.dragObj.x = pointer.x;
        this.dragObj.y = pointer.y;
    }
}
function stopDrag() {
    this.input.on('pointerdown', this.startDrag, this);
    this.input.off('pointermove', this.doDrag, this);
    this.input.off('pointerup', this.stopDrag, this);
}