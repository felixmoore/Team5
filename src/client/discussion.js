
class Discussion extends Phaser.Scene {
    constructor () {

        super({ key: 'discussion' });
        
      }
    preload () {
      
    }
  
    create () {
      let mansion = this.scene.get('mansion');
      this.cameras.main.backgroundColor.setTo(0);
      this.add.text(20, 20, 'Time to vote!').setColor("#ff0000", 0).setFontSize(30).setFontFamily('Arial');
      this.add.text(20, 50, 'Decide on who you think the impostor is...').setColor("#ff0000", 0).setFontSize(30).setFontFamily('Arial');
      this.add.text(600, 80, 'Discuss -->').setColor("#ff0000", 0).setFontSize(30).setFontFamily('Arial');
      createTimer(this);
      this.input.once('pointerdown', function () {
        Object.keys(mansion.getOtherPlayers()).forEach(o => {
        });
      }, this);
    }
  }
  export default Discussion;

  
//TODO can be cleaned up and adapted for just this scene (i.e. get rid of the check to see if discussion is visible)
  function createTimer (self) {
    /* Taken from https://phaser.discourse.group/t/countdown-timer/2471/4 */
    const timerBg = self.add.rectangle(700, 680, 200, 50, 0x008000).setScrollFactor(0);
    self.initialTime = 30; // in seconds
    self.timerText = self.add.text(630, 670, 'Countdown: ' + formatTime(self.initialTime)).setScrollFactor(0).setFontFamily('Arial');
    // Each 1000 ms call onEvent
    let timedEvent = self.time.addEvent({ delay: 1000, callback: onEvent, args: [self], callbackScope: self, loop: true });
  }
  
  function formatTime (seconds) {
    // Minutes
    let minutes = Math.floor(seconds / 60);
    // Seconds
    let partInSeconds = seconds % 60;
    // Adds left zeros to seconds
    partInSeconds = partInSeconds.toString().padStart(2, '0');
    // Returns formated time
    return `${minutes}:${partInSeconds}`;
  }
  
  function onEvent (self) {
    self.initialTime -= 1; // One second
    self.timerText.setText('Countdown: ' + formatTime(self.initialTime));
  
    if (self.initialTime === 0) {
      if (self.scene.isActive('discussion')) {
        // self.scene.add('voting', Voting, true); //TODO not linked yet
        self.scene.start('voting');
        self.initialTime = 60;
      } else {
        // self.scene.add('discussionScene', Discussion, true);
        self.scene.start('discussion');
        self.initialTime = 60;
      }
    }
  }
  