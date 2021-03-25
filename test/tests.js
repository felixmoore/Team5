const expect = require("chai").expect;
const Phaser = require("phaser");
// import Mansion from './mansion.js';
const mansion = require("../src/client/mansion");
// import Mansion from '../src/client/mansion.js';
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
let browserEnv = require('browser-env');
browserEnv(['navigator']);
const host = 'http://localhost:3000/';
// const isNode = require('detect-node');

//       export async function analyticsLogEvents(event, params) {
//         if (!isNode) {
//           const firebase = await import('firebase/app')
//           await import('firebase/analytics')
//           firebase.default.analytics().logEvent(event, params)
//         }
//       }
before(async () => {
  await setup()
})
async function setup() {
  var jsdom = require('jsdom').jsdom;

  global.document = jsdom('');
  global.window = document.defaultView;
  Object.keys(document.defaultView).forEach((property) => {
    if (typeof global[property] === 'undefined') {
      global[property] = document.defaultView[property];
    }
  });

  global.navigator = {
    userAgent: 'node.js'
  };
}
describe('Launch server', function () {
  var server;

  before(function (done) { //launch server


    class Game {
      static initialize() {
        console.log('initializing server game')
          ; (() => new Phaser.Game(config))()
      }
    }

    Game.initialize()
    // const express = require('express');
    // var app = express();
    // path = require('path');
    // app.use("/public", express.static(path.join(__dirname, '/public')));
    // app.use("/src/client", express.static(path.join(__dirname, '/src/client')));
    // const init = require('./src/server/server.js');
    // init.initialiseServer(app);

    // app.use('/',require('../routes/hello'));
    // const port = 3000;
    // server = app.listen(port,function(){done();});


  });

  after(function () { //shutdown server after testing
    server.close();
  });

});


describe("Mansion scene", function () {

  describe("Load player", function () {
    it("creates a player object", function () { });
    it("creates a player object", function () { });
  });

  it('should return true if game user id matches server user id', function () {

    // let isValid = (gameid === serverid)

    // expect(isValid).to.be.true;
  });

});