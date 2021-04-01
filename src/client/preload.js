/* eslint-disable no-undef, no-unused-vars */
// Adapted from tutorial @ https://gamedevacademy.org/creating-a-preloading-screen-in-phaser-3/
let loadingDone = false;
class Preload extends Phaser.Scene {
  constructor () {
    super('preload');
  }

  preload () {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        fill: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    this.load.on('progress', function (value) {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', function () {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      loadingDone = true;
    });

    // Mansion assets
    this.load.image('button_a', 'public/assets/button_a.png');
    this.load.image('button_b', 'public/assets/button_b.png');
    this.load.image('clue_bone', 'public/assets/clues/bone01a.png');
    this.load.image('clue_book', 'public/assets/clues/book_01g.png');
    this.load.image('clue_knife', 'public/assets/clues/sword_03c.png');
    this.load.image('clue_poison', 'public/assets/clues/potion_01a.png');
    this.load.image('sound', 'public/assets/sound.png');
    this.load.image('mute', 'public/assets/mute.png');
    this.load.image('generic', 'public/assets/tilesets/1_Generic_48x48.png');
    this.load.image('living_room', 'public/assets/tilesets/2_LivingRoom_48x48.png');
    this.load.image('bathroom', 'public/assets/tilesets/3_Bathroom_48x48.png');
    this.load.image('bedroom', 'public/assets/tilesets/4_Bedroom_48x48.png');
    this.load.image('library', 'public/assets/tilesets/5_Classroom_and_library_48x48.png');
    this.load.image('kitchen', 'public/assets/tilesets/12_Kitchen_48x48.png');
    this.load.image('stairs_railings', 'public/assets/tilesets/17_Visibile_Upstairs_System_48x48.png');
    this.load.image('walls_floors', 'public/assets/tilesets/Tilesets_48x48.png');
    this.load.tilemapTiledJSON('map', 'public/assets/tilesets/map.json');
    this.load.spritesheet('cat', 'public/assets/pipo-nekonin001.png', { frameWidth: 32, frameHeight: 32 });
    this.load.audio('clueCollect', 'public/assets/sound/Fruit collect 1.wav');
    this.load.audio('bgm', 'public/assets/sound/Ludum Dare 38 - Track 6.wav');

    // Drag minigame assets
    this.load.image('key', 'public/assets/key.png'); // TODO needs source in readme.md
    this.load.image('lock', 'public/assets/lock.png'); // TODO needs source in readme.md
    this.load.image('background', 'public/assets/background2.jpg'); // TODO needs source in readme.md
    this.load.image('cursor', 'public/assets/cursor.png'); // TODO credit in readme.md https://www.iconfinder.com/icons/7225814/arrow_cursor_icon

    // Collect minigame assets
    this.load.image('background', 'public/assets/Victorian Room V2.jpg');
    this.load.spritesheet('clue', 'public/assets/ship.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('clue1', 'public/assets/ship.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('clue2', 'public/assets/ship.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('bomb', 'public/assets/bomb.png', { frameWidth: 48, frameHeight: 48 });
    this.load.spritesheet('explosion', 'public/assets/explosion.png', { frameWidth: 16, frameHeight: 16 });
    this.load.audio('audio_chime', 'public/assets/chime.mp3');

    // Discussion assets
    this.load.spritesheet('clock', 'public/assets/clock.png', { frameWidth: 350, frameHeight: 350 });
  }

  create () {
    if (loadingDone) {
      this.scene.start('mansion');
    }
  }
} export default Preload;
