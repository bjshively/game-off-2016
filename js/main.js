var game = new Phaser.Game(320, 240, Phaser.AUTO, 'game', {
    preload: preload,
    init: init,
    create: create,
    update: update,
    render: render
});

function preload() {
    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.spritesheet('player', 'assets/player/player.png', 15, 31);
    game.load.spritesheet('enemy', 'assets/enemies/enemy.png', 15, 31);
    game.load.image('checker', 'assets/checker.png');
    game.load.image('reticle', 'assets/player/reticle.png');
    game.load.image('arm', 'assets/player/arm.png');
    game.load.image('gun', 'assets/player/weapon/gun.png');
    game.load.image('bullet', 'assets/player/weapon/bullet.png');
    game.load.spritesheet('desk', 'assets/workstation.png', 42, 39, 16);

    // Enable pixel-perfect game scaling
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
var platforms;
var wasd;
var reticle;

var scoreText;
var healthText;

var sprite;
var bullets;
var nextFire = 0;

var bgtile;


// Weapon stuff
var pistol = new Weapon(400, 5);
var machinegun = new Weapon(100, 2);

var mygun = pistol;

function init() {}

function create() {
    // INPUT SETTINGS
    wasd = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D),
        space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        pointer: game.input.activePointer,
        pistolKey: game.input.keyboard.addKey(49),
        machinegunKey: game.input.keyboard.addKey(50),
    };

    //  Stop the following keys from propagating up to the browser
    game.input.keyboard.addKeyCapture(
        [Phaser.Keyboard.W,
            Phaser.Keyboard.A,
            Phaser.Keyboard.S,
            Phaser.Keyboard.D,
            Phaser.Keyboard.SPACEBAR
        ]);

    game.input.mouse.capture = true;

    //  World Setup
    game.world.setBounds(0, 0, 640, 480);
    bgtile = game.add.tileSprite(0, 0, game.world.bounds.width, game.world.height, 'checker');
    game.physics.startSystem(Phaser.Physics.ARCADE);

    

    desks = game.add.group();
    desks.enableBody = true;

    

    //var ground = platforms.create(0, game.world.height - 5, 'ground');
    //    ground.scale.setTo(1, 60);
    //ground.body.immovable = true;

    var desk = desks.create(Math.random() * game.world.width - 44, Math.random() * game.world.height - 39, 'desk');
    var flicker = desk.animations.add('flicker');
    desk.body.immovable = true;
    desk.animations.play('flicker', 30, true);
    desk = desks.create(Math.random() * game.world.width - 44, Math.random() * game.world.height - 39, 'desk');
    flicker = desk.animations.add('flicker');
    desk.body.immovable = true;
    desk.animations.play('flicker', 30, true);

    createPlayer();
    createEnemies();

    game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    //game.camera.deadzone = new Phaser.Rectangle(
    //game.width * .35, game.height * .35, game.width * .3, game.height * .3);

    game.time.events.loop(Phaser.Timer.SECOND, updateTime, this);

    //  HUD
    scoreText = game.add.text(16, 16, 'Score: ' + player.score, {
        fontSize: '10px',
        fill: '#000'
    });
    scoreText.fixedToCamera = true;

    healthText = game.add.text(16, 32, 'Health: ' + player.health, {
        fontSize: '10px',
        fill: '#000'
    });
    healthText.fixedToCamera = true;

    // Bullets - TODO: Cleanup / roll into player or gun code
    // TODO - Destroy bullets when they exit camera pane, i.e. cannot shoot enemies off screen
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);

    reticle = game.add.sprite(game.input.activePointer.worldX, game.input.activePointer.worldY, 'reticle');

    //game.physics.enable(sprite, Phaser.Physics.ARCADE);
}

function update() {
    // Check to see if all enemies are dead
    if (enemies.countLiving() == 0) {
        // Do something when the player wins
    }

    if (game.time.now > player.invincibleTime && player.alive) {
        player.invincible = false;
        player.visible = true;
    }
    if (player.invincible) {
        player.visible = !player.visible;
    }

    // Replace cursor with reticle
    reticle.x = game.input.activePointer.worldX - reticle.width / 2;
    reticle.y = game.input.activePointer.worldY - reticle.height / 2;

    // Only perform player actions if the player is alive
    if (player.alive) {
        updatePlayer();

        // Weapon select
        if (wasd.pistolKey.isDown) {
            mygun = pistol;
        }
        if (wasd.machinegunKey.isDown) {
            mygun = machinegun;
        }
    }
    game.physics.arcade.collide(player, desks);
    game.physics.arcade.overlap(platforms, bullets, killBullet, null, this);
    game.physics.arcade.overlap(bullets, enemies, killEnemy, null, this);
    game.physics.arcade.overlap(player, enemies, takeDamage, null, this);

    scoreText.text = 'Score: ' + player.score;
    healthText.text = 'Health: ' + player.health;
}

//*********************************
//Helper Functions
//*********************************

function collectItem(player, item) {

    //Implement item interaction logic
}

function killEnemy(bullet, enemy) {
    bullet.kill();
    enemy.kill();

    player.score += 1;
}

function killBullet(platform, bullet) {
    bullet.kill();
}

function fireBullet() {
    if (game.time.now > nextFire && bullets.countDead() > 0) {
        nextFire = game.time.now + mygun.cooldown;

        var bullet = bullets.getFirstDead();

        bullet.reset(player.x, player.y - 5);

        game.physics.arcade.moveToPointer(bullet, 300);
    }
}


// Display gameover message
// TODO: Make this suck less
function gameOver() {
    var gameover = game.add.text(game.camera.x/2 , game.camera.y / 2, 'GAME OVER');
     gameover.x = (game.world.width / 2) - (gameover.width / 2);
     game.camera.follow(gameover);
    //game.debug.text('gamerver', game.world.width / 2, game.world.height / 2);
}

function updateTime() {
    timeCounter++;
}

function render() {
    if (run_debug) {
        game.debug.text(player.invincible, 5, 15);
        game.debug.cameraInfo(game.camera, 5, 15);
        game.debug.spriteCoords(player, 5, 90);
        game.debug.text('Elapsed seconds: ' + game.time.totalElapsedSeconds(), 5, 140);
        game.debug.text('Mouse angle: ' + game.math.radToDeg(game.physics.arcade.angleToPointer(player)), 5, 160)

    }
}