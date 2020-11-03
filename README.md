# Team5
A social deduction game.

## Branch - felix-temp

This is a comparison of the same Socket.io program in LibGDX (Java) and in Phaser (JavaScript).

### For both projects (+ for Socket.io in general):
- install node from https://nodejs.org/en/
- in your terminal/cmd type node --version and make sure it returns something
- install socket.io by running `npm install -g socket.io` (I forgot to include it :/)

#### To run the LibGDX project:
- import the project using Gradle (the same way you imported the starter project from the hack branch)
- in your terminal, navigate to the `libgdx\server` folder, and run `node index.js`.
- run the Gradle `run` task a couple of times (Tasks -> application -> run is the path for me in IntelliJ)
  - two windows should pop up, using the arrow keys to move on either window should show the changes in the other window.

#### To run the Phaser project:
- in your terminal, navigate to the `phaser` folder, and run `node server.js`.
- in your browser, open up http://localhost:3000/ in a couple of different tabs.
- any movement should be reflected in the other tabs.

_The chat box does nothing right now but it might be nice to add later._
