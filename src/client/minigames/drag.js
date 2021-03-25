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
        let colours = ['0x8E44AD', '0xffff00', '0x0CFF00', '0x0013FF', '0xFF0061', '0x00FBFF'];
        this.add.image(400, 300, 'background').setScale(2);
        this.cameras.main.setBounds(0, 0, game.width, game.height);
        
        let keys = this.physics.add.group({
            key: 'key',
            repeat: 5,

        });

        let len = 0;
        keys.children.iterate(function (child) {
            child.x = Phaser.Math.RND.between(0, 800);
            child.y = Phaser.Math.RND.between(30, 600);
            child.setInteractive({ draggable: true });
            child.setScale(0.15);
            len++;

        });
 
        for (let i = 0; i < len; i++) {  
            keys.children.entries[i].setTint(colours[i]); 
        }

        this.input.on('drag', function (pointer, gameObject, dragX, dragY) {

            gameObject.x = dragX;
            gameObject.y = dragY;
    
        });


        //TODO add check to make sure key + lock don't spawn in the same spot

        let locks = this.physics.add.group({
            key: 'lock',
            repeat: 5,

        });

        len = 0;
        locks.children.iterate(function (child) {
            child.x = Phaser.Math.RND.between(0, 800);
            child.y = Phaser.Math.RND.between(0, 600);
            child.setScale(0.08);
            len++;
        });
 
        for (let i = 0; i < len; i++) {  
            locks.children.entries[i].setTint(colours[i]); 
        }

        this.physics.add.overlap(keys, locks, tryLock, null, this);
    }

    update() {

    }
}
export default Drag;

function tryLock(key,lock){
    if (key.tintTopLeft === lock.tintTopLeft){
        key.disableBody(true,true);
        lock.disableBody(true,true);
    }
}
