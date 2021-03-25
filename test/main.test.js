// const Phaser = require("phaser");
import Phaser from 'phaser';
import path from 'path';
import Mansion from '../src/client/mansion.js';
import Discussion from '../src/client/discussion.js';
import Voting from '../src/client/voting.js';
import Drag from '../src/client/minigames/drag.js';
import Collect from '../src/client/minigames/collect.js';
import GameOver from '../src/client/minigames/gameOver.js';
import WS from "jest-websocket-mock";
import "regenerator-runtime/runtime.js";
// let server;
let game;
const host = 'http://localhost:8080/';
async function connect() {
    const server = new WS("ws://localhost:3000");
    const client = new WebSocket("ws://localhost:3000");
    await server.connected;
}

const config = {
    type: Phaser.HEADLESS,
    width: 1024,
    height: 640,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 980
            },
            debug: true
        }
    },
    // disable audio
    audio: {
        noAudio: true
    },
    scene: {
        preload: () => {
            console.log('server preload')
        },
        create: () => {
            console.log('server create')
        },
        update: () => {
            // console.log('server update')
        }
    },
    title: 'Phaser server app',
    backgroundColor: '#06C6F8',
    transparent: true,
    disableContextMenu: true
}
describe("Mansion", () => {

    // // Start every tests with a clean state
    // let sparkle;
    beforeAll((done) => {
        connect();
        return initialiseServer(done);

    });

    afterAll((done) => {
        WS.clean();
        return closeServer(done);
    });
    // // Some test
    test("instantiate", () => {
        // Simple assertion
        // expect(sparkle instanceof Unicorn).toBe(true);
        // console.log(game.scene);
        expect(true).toBe(true);

    });

    // // More test
    // test("shine", => {
    //     // String assertion
    //     expect(sparkle.shine()).toMatch(/🦄/);
    //     expect(sparkle.shine()).not.toMatch(/💩/);
    // });

    // ...
});


async function initialiseServer(done) {
    // class Game {
    //     static initialize() {
    //         console.log('initializing server game')
    //             ; (() => new Phaser.Game(config))()
    //     }
    // }

    // Game.initialize();
    game = new Phaser.Game(config);
    async function create() {
        this.scene.start('mansion');
        // this.renderer.addPipeline('Custom', new CustomPipeline(this)).setFloat1('alpha', 1.0);
    }
    // const express = require('express');
    // var app = express();
    // // path = require('path');
    // app.use("/public", express.static(path.join(__dirname, '/public')));
    // app.use("/src/client", express.static(path.join(__dirname, '/src/client')));
    // const init = require('../src/server/server.js');
    // init.initialiseServer(app, () => done());
    // // jest.spyOn(console, 'log');

    // try {
    //     expect(console.log.mock.calls[0][0]).toBe("Listening on *: 3000");
    // } catch (error){
    //     console.log(error);
    // } finally {
    // done();
    // }
    // app.use('/', require('../routes/hello'));
    // const port = 3000;
    // server = app.listen(8080,() => done());

    const init = require('../src/server/server.js');

    const express = require('express');
    const app = express();

    const path = require('path');
    app.use("/public", express.static(path.join(__dirname, '/public')));
    app.use("/src/client", express.static(path.join(__dirname, '/src/client')));
    app.use('/favicon.ico', express.static(path.join(__dirname, '/public/assets/favicon.ico')));
    app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public', 'index.html')); //path.join looks one level up in the directory
    });
    init.initialiseServer(app);
    // jest.spyOn(console, 'log');
    global.console.log = jest.fn()

    try {
        expect(console.log).toHaveBeenLastCalledWith("Listening on *: 3000");
    } catch (error){
        console.log(error);
    } finally {
        done();
    }
    
}

function closeServer(done) {
    process.on('SIGTERM', () => {
        debug('SIGTERM signal received: closing server')
        server.close(() => {
            debug('Server closed')
        })
    })
    server.listening ? server.close(() => done()) : done();
}