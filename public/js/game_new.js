let config = {
  type: Phaser.AUTO, // WebGL if available, Canvas otherwise
  parent: "game", // renders in a <canvas> element with id game //TODO rename
  // if we have a name
  width: 800, // TODO change to relative size?
  height: 600,

  physics: {
    // physics framework from Phaser
    default: "arcade",
    arcade: {
      debug: false,
      //  velocity: 1,
      gravity: { y: 0 },
    },
  },
  scene: { preload: preload, create: create, update: update },
};

const game = new Phaser.Game(config);

function preload() {
  this.load.image("circle", "public/assets/circle.png");
  this.load.image("button_a", "public/assets/button_a.png");
  this.load.image("button_b", "public/assets/button_b.png");
  this.load.image(
    "structure_tiles",
    "public/assets/4 Walls, Floor & Doors.png"
  );
  this.load.image("furniture_tiles", "public/assets/Furniture 4.png");
  this.load.image("carpet_tiles", "public/assets/Carpets 4.png");
}

function create() {
  // Load a map from a 2D array of tile indices
  const level = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 2, 3, 0, 0, 0, 1, 2, 3, 0],
    [0, 5, 6, 7, 0, 0, 0, 5, 6, 7, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 14, 13, 14, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 14, 14, 14, 14, 14, 0, 0, 0, 15],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 15],
    [35, 36, 37, 0, 0, 0, 0, 0, 15, 15, 15],
    [39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39],
  ];

  // When loading from an array, make sure to specify the tileWidth and
  // tileHeight
  const map = this.make.tilemap({ data: level, tileWidth: 16, tileHeight: 16 });
  const tiles = map.addTilesetImage("structure_tiles");
  const layer = map.createStaticLayer(0, tiles, 0, 0);
}
