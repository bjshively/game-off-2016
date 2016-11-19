// TODO: Add leveling (keep same logic for now)
// TODO: more pick ups
// TODO: show current player.weapon lower right


var game = new Phaser.Game(320, 240, Phaser.AUTO, 'game', {
    preload: preload,
    init: init,
    create: create,
    update: update,
    render: render
});

WebFontConfig = {

    //  'active' means all requested fonts have finished loading
    //  We set a 1 second delay before calling 'createText'.
    //  For some reason if we don't the browser cannot render the text the first time it's created.

// TODO: not sure what the fuck this line is for
//    active: function() { game.time.events.add(Phaser.Timer.SECOND, null, this); },

    //  The Google Fonts we want to load (specify as many as you like in the array)
    google: {
      families: ['VT323']
    }

};

function preload() {
    // load the rest of the JS
    // TODO: make this shit work instead of having all the script tags in the html
    /*
    game.load.script('player', 'js/player.js');
    game.load.script('enemies', 'js/enemies.js');
    game.load.script('controls', 'js/controls.js');
    game.load.script('items', 'js/items.js');
    */

    game.load.spritesheet('player', 'assets/player/player.png', 15, 31);
    game.load.spritesheet('enemy1', 'assets/enemies/enemy1.png', 15, 31);
    game.load.spritesheet('enemy2', 'assets/enemies/enemy2.png', 15, 31);
    game.load.spritesheet('enemy3', 'assets/enemies/enemy3.png', 15, 31);
    game.load.spritesheet('enemy4', 'assets/enemies/enemy4.png', 15, 31);
    game.load.spritesheet('enemy5', 'assets/enemies/enemy5.png', 15, 31);
    game.load.image('background', 'assets/background.png');
    game.load.image('reticle', 'assets/player/reticle.png');
    game.load.image('arm', 'assets/player/arm.png');
    game.load.image('gun', 'assets/player/weapon/gun.png');
    game.load.spritesheet('desk', 'assets/workstation.png', 42, 39, 16);
    game.load.spritesheet('stapler', 'assets/player/weapon/staplerPickup.png', 16, 16, 10);
    game.load.image('staple', 'assets/player/weapon/staplerAmmo.png');
    game.load.spritesheet('cd', 'assets/player/weapon/cd.png', 11, 11, 16);

    

    game.load.script('webfont', '//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js');

    // Enable pixel-perfect game sscaling
    this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    this.game.scale.setUserScale(3, 3);
    this.game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

//Toggle debug information
var run_debug = false;
var timeCounter = 0;
var currentTime = 0;

var player;
var enemies;
var items;

var platforms;
var wasd;
var reticle;

var scoreText;
var healthText;
var waveText;
var wave = 0;

var pickupStapler;
var pickupCD;

var bgtile;

// Weapon stuff
var weaponcd;
var weaponStapler;

function init() {}

function create() {
    //  World Setup
    game.world.setBounds(0, 0, 400, 300);
    bgtile = game.add.tileSprite(0, 0, game.world.bounds.width, game.world.height, 'background');
    game.physics.startSystem(Phaser.Physics.ARCADE);

    // create all the things
    createControls();
    createItems();
    createPlayer();
    createEnemies();

    // create some immovable desks and play animations
    desks = game.add.group();
    desks.enableBody = true;

    var desk = desks.create(
        Math.abs(Math.random() * game.world.width - 44),
        Math.abs(Math.random() * game.world.height - 39),
        'desk');
    desk = desks.create(
        Math.abs(Math.random() * game.world.width - 44),
        Math.abs(Math.random() * game.world.height - 39),
        'desk');
    
    desks.setAll('body.mass', -100);
    desks.callAll('animations.add', 'animations', 'flicker');
    desks.callAll('animations.play', 'animations', 'flicker', 30, true);

    ////////////////////////
    //  HUD
    game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);

    healthText = game.add.text(5, 5, 'Health: ' + player.health, {
        font: 'VT323',
        fontSize: '14px',
        fill: '#FFF'
    });
    healthText.fixedToCamera = true;

    scoreText = game.add.text(0, 0, 'Score: ' + player.score, {
        font: 'VT323',
        fontSize: '14px',
        fill: '#FFF'
    });
    scoreText.position.setTo((game.camera.width / 2) - (scoreText.width / 2), 5);
    scoreText.fixedToCamera = true;

    waveText = game.add.text(0, 0, 'Wave: ' + player.score, {
        font: 'VT323',
        fontSize: '14px',
        fill: '#FFF'
    });
    waveText.position.setTo(game.camera.width - waveText.width - 5, 5);
    waveText.fixedToCamera = true;
}

function update() {
    updateControls();

    // Only perform player actions if the player is alive
    if (player.alive) {
        updatePlayer();
        updateEnemies();

        // Weapon select
        if (wasd.weaponcdKey.isDown) {
            player.weapon = weaponcd;
        }
        if (wasd.weaponstaplerKey.isDown) {
            player.weapon = weaponstapler;
        }
    }

    game.physics.arcade.collide(player, desks);
    game.physics.arcade.overlap(player, items, collectItem);
    //game.physics.arcade.overlap(bullets, enemies, damageEnemy, null, this);
    game.physics.arcade.overlap(player.weapon.bullets, enemies, damageEnemy);
    game.physics.arcade.collide(player, enemies, takeDamage);
    // TODO: enemies still go through desks
    game.physics.arcade.collide(enemies, desks);
    game.physics.arcade.overlap(player.weapon.bullets, desks, killBullet);
    
    scoreText.text = 'Score: ' + player.score;
    healthText.text = 'Health: ' + player.health;
}

//*********************************
//Helper Functions
//*********************************
function killBullet(bullet) {
    bullet.kill();
}


function collectItem(player, item) {
    item.collect();
    //Implement item interaction logic
}

// Display gameover message
function gameOver(message) {
    var gameover = game.add.text(0, 0, message, {
            font: 'VT323',
            fontSize: '30px',
            fill: '#FFF',
            align: 'center'
        });
    gameover.position.setTo(
        (game.camera.x + (game.camera.width / 2)) - (gameover.width / 2),
        (game.camera.y + (game.camera.height / 2)) - (gameover.height / 2)
        );
//    game.camera.follow(gameover);
}

function render() {
    if (run_debug) {
       game.debug.text(player.invincible, 5, 15);
       game.debug.cameraInfo(game.camera, 5, 15);
       game.debug.spriteCoords(player, 5, 90);
       game.debug.text('Seconds: ' + Math.round(game.time.totalElapsedSeconds() * 100) / 100, 5, 140);
       game.debug.text('Mouse angle: ' + game.math.radToDeg(game.physics.arcade.angleToPointer(player)), 5, 160)
    }
}