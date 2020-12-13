/** Wordsearch minigame, still need to implement game.state.add event in main game and multiplayer aspect
 * Taken from https://www.joshmorony.com/part-2-building-a-word-search-game-in-html5-with-phaser/
 */

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game',
        width: 800,
        height: 700,
    },
    physics: {
        default: 'arcade' ,
        arcade: {
            gravity: {y:300},
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);  //instantises game with config properties

var Preload = function(game){};




    function preload(){
        this.game.load.text('dictionary', 'public/assets/minigame_assets/wordlist.txt'); //grabs wordlist from assets

    }

    
    function create(){
        // this.game.state.start("Main"); //loads game into mainstate without going into title

        var me = this;

        me.game.stage.backgroundColor = '34495f'; //sets bg color of the grid
        me.tileLetters = [ //declares what assets we will use as tiles
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
            'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
            'w', 'x', 'y', 'z'
        ];

        me.tileColors = [ //sets colour of tiles
            "#ffffff"
        ];

        me.tileWidth = 150; //sets width of tiles
        me.tileHeight = 150; //sets height of tiles
        me.selectBuffer = me.tileWidth/8; // buffer for what section of the tile can be selected

        me.tiles = me.game.add.group(); //hold all of the tile objects

        me.tileGrid = [ //creates a grid of arrays that will hold the letters
            [null,null,null,null,null,null],
            [null,null,null,null,null,null],
            [null,null,null,null,null,null],
            [null,null,null,null,null,null],
            [null,null,null,null,null,null],
            [null,null,null,null,null,null],
        ];
        //keeps a reference of board height and width
        me.boardWidth = me.tileGrid[0].length * me.tileWidth;
        me.boardHeight = me.tileGrid.length * me.tileHeight;

        //keeps a buffer of the left and top so grid can be centred
        me.leftBuffer = (me.game.width - me.boardWidth)/2;
        me.topBuffer = (me.game.height - me.boardHeight)/2;

        //creates a random generator to use later
        var seed = Date.now();
        me.random = new Phaser.RandomDataGenerator([seed]);

        me.initTiles(); //initialises tiles

        me.guessing = false; //detects when user is guessing, off by default
            me.currentWord = []; //stores current word info
            me.correctWords = []; //stores correct words info

        //listeners to detect when user clicks a tile
        me.game.input.onDown.add(function(){me.guessing= true;}, me);
        me.game.input.onUp.add(function(){me.guessing= false;}, me);

        //keep track of the users score
        me.score = 0;
        me.scoreBuffer = 0;
        me.createScore();

        //keeps track of time
        me.remainingTime = 6000;
        me.fullTime = 6000;

        //runs a loop every 100ms calling createTimer method to decrement remainingTime
        me.createTimer();
        me.gameTimer = game.time.events.loop(100, function(){
            me.updateTimer();

        })

        //code for multiplayer functionality
    }





    function update(){

        var me = this;

        if(me.guessing){

            //gets current location of pointer
            var hoverX = me.game.input.x;
            var hoverY = me.game.input.y;

            //checks pointer location in relation to the grid
            var hoverPosX = Math.floor((hoverX - me.leftBuffer)/me.tileWidth);
            var hoverPosY = Math.floor((hoverY - me.topBuffer)/me.tileHeight);

            //Checks that the pointer is within game bounds
            if(hoverPosX >= 0 && hoverPosX < me.tileGrid[0].length && hoverPosY >= 0 && hoverPosY < me.tileGrid[0].length){

                var hoverTile = me.tileGrid[hoverPosX][hoverPosY]; //grabs the tile being hovered

                //defines the pointer hover bounds of the tile
                var tileLeftPosition = me.leftBuffer + (hoverPosX * me.tileWidth);
                var tileRightPosition = me.leftBuffer + (hoverPosX * me.tileWidth) + me.tileWidth;
                var tileTopPosition = me.topBuffer + (hoverPosY * me.tileHeight);
                var tileBottomPosition = me.topBuffer + (hoverPosY * me.tileHeight) + me.tileHeight;

                //sets the current hovered tile to active
                if(!hoverTile.isActive && hoverX > tileLeftPosition + me.selectBuffer && hoverX < tileRightPosition - me.selectBuffer
                    && hoverY > tileTopPosition + me.selectBuffer && hoverY < tileBottomPosition - me.selectBuffer){
 
                        hoverTile.isActive = true; //sets current hovered tile to active
                        
                        console.log(hoverTile.tileletter); //logs the value of which letter is hovered

                        me.currentWord.push(hoverTile); //pushes the letter of hovered tile into current word array

                    }

            }
        }
        else{
            if(me.currentWord.length > 0){

                var guessedWord = '';

                //builds a string out of all currently stored active tiles
                for(var i = 0; i < me.currentWord.length; i++){
                    guessedWord += me.currentWord[i].tileLetter;
                    me.currentWord[i].isActive = false;
                }

                //checks to see if word is in dictionary
                if(me.game.cache.getText('dictionary').indexOf('' + guessedWord + '') > -1 && guessedWord.length >1){

                    if(me.correctWords.indexOf(guessedWord) == -1){ //check for if word has already been guessed
                        console.log("correct!")
                        me.scoreBuffer += 10 * guessedWord.length; //increments scorebuffer value

                        me.correctWords.push(guessedWord); //adds word to alredy guessed words
                    }
                }
                else{
                    console.log("incorrect!")
                }

                me.currentWord = []; //resets stored value of current word

            }
        }

        if(me.scoreBuffer > 0){
            me.incrementScore();
            me.scoreBuffer--; //decreases score buffer by one and increases score when called
        }

        //when timer ends, loads the main game back up, TODO implement end of minigame screen and voting
        if(me.remainingTime < 1){
            me.game.state.load('game', 'src/client/game.js' );
        }
    }



    function initTiles(){ //initialise tile function for initialising the tileGrid

        var me = this;

        for(var i = 0; i < me.tileGrid.length; i++){ //Loops each column of the grid

            for(var j= 0; j< me.tileGrid.length; j++){ //loops each position in a column

            var tile = me.addTile(i, j); //adds the tile to the game at given position

            me.tileGrid[i][j] = tile; //keeps track of tile position in the grid

            }
        }
    }

    function addTile(x,y){

        var me = this;

        //chooses a random tile and color to add
        var tileLetter = me.tileLetters[me.random.integerInRange(0, me.tileLetters.length - 1)];
        var tileColor = me.tileColors[me.random.integerInRange(0, me.tileColors.length - 1)];

        var tileToAdd = me.createTile(tileLetter,tileColor); //stores the properties of a tile to be added

        //adds tile to given X position
        var tile = me.tiles.create(me.leftBuffer + (x* me.tileWidth) + me.tileWidth/2, 0, tileToAdd);

        //changes Y position of tile and animates tile into position
        me.game.add.tween(tile).to({y:me.topBuffer +(y*me.tileHeight+(me.tileHeight/2))}, 500, Phaser.Easing.Linear.In, true)

        //Sets the tile anchor point to the center
        tile.anchor.setTo(0.5, 0.5);

        //keeps track of the tile added and its properties
        tile.tileLetter = tileLetter;

        return tile;
    }

    function createTile(letter, color){

        var me = this;

        //genereates a sprite with the given height and width
        var tile = me.game.add.bitmapData(me.tileWidth, me.tileHeight);

        //creates shape, colour, font and fill properties
        tile.ctx.rect(5,5, me.tileWidth - 5, me.tileHeight - 5);
        tile.ctx.fillStyle = color;
        tile.ctx.fill();

        tile.ctx.font = '30px Arial';
        tile.ctx.textAlign = 'center';
        tile.textBaseline = 'middle';
        tile.ctx.fillstyle = '#fff';
    
        if(color == '#ffffff'){
            tile.ctx.fillStyle = '#000000';
        }
        tile.ctx.fillText(letter, me.tileWidth/2, me.tileHeight/2);

        return tile;
    }

    function incrementScore(){

        var me = this;
        me.score += 10; //increments score by 10 when a word is guessed
        me.scoreLabel.text = me.score; //creates a label for displaying the score
    }

    function createScore(){

        var me = this;
        var scoreFont = "100px Arial"; //creates font variable for displaying score

        //adds in game text for displaying the score
        me.scoreLabel = me.game.add.text(me.game.world.centerX, me.topBuffer + 10 + me.tileGrid.length * me.tileHeight,
        "0", {font: scoreFont, fill: "#ffffff", stroke:"#535353", strokeThickness: 15});
    }

    function createTimer(){

        var me = this;

        me.timeBar = me.game.add.bitmapData(me.game.width, 50); //basic graphical timing bar
        
        //renders bg color and style
        me.timeBar.ctx.rect(0, 0, me.game.width, 50);
        me.timeBar.ctx.fillStyle = '#ffffff';
        me.timeBar.ctx.fill();
        me.timeBar = me.game.add.sprite(0, 0, me.timeBar);
        me.timeBar.cropEnabled = true;
    }

    function updateTimer(){

        var me = this;
        me.remainingTime -= 10; //decrements remaining time by 10 when called

        //updates timing bar graphic
        var cropRect = new Phaser.Rectangle(0,0, (me.remainingTime/ me.fullTime)* me.game.width, me.timeBar.height);
        me.timeBar.crop(cropRect);

    }



