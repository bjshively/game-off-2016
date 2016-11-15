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
    game.load.spritesheet('enemy1', 'assets/enemies/enemy1.png', 15, 31);
    game.load.spritesheet('enemy2', 'assets/enemies/enemy2.png', 15, 31);
    game.load.spritesheet('enemy3', 'assets/enemies/enemy3.png', 15, 31);
    game.load.spritesheet('enemy4', 'assets/enemies/enemy4.png', 15, 31);
    game.load.spritesheet('enemy5', 'assets/enemies/enemy5.png', 15, 31);
    game.load.image('background', 'assets/background.png');
    game.load.image('reticle', 'assets/player/reticle.png');
    game.load.image('arm', 'assets/player/arm.png');
    game.load.image('gun', 'assets/player/weapon/gun.png');
    game.load.image('staple', 'assets/player/weapon/staple.png');
    game.load.image('cdfront', 'assets/player/weapon/cdfront.png');
    game.load.image('cdback', 'assets/player/weapon/cdback.png');
    game.load.spritesheet('desk', 'assets/workstation.png', 42, 39, 16);
    game.load.spritesheet('stapler', 'assets/player/weapon/stapler.png', 16, 16, 10);

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
var items;

var platforms;
var wasd;
var reticle;

var scoreText;
var healthText;

var stapler;
var bullets;
var nextFire = 0;

var bgtile;


// Weapon stuff
var pistol = new Weapon(400, 5);
var machinegun = new Weapon(100, 2);

var mygun = pistol;

function init() {}

function create() {
    createControls();
    //  World Setup
    game.world.setBounds(0, 0, 400, 300);
    bgtile = game.add.tileSprite(0, 0, game.world.bounds.width, game.world.height, 'background');
    game.physics.startSystem(Phaser.Physics.ARCADE);

    desks = game.add.group();
    desks.enableBody = true;

    var desk = desks.create(Math.abs(Math.random() * game.world.width - 44), Math.abs(Math.random() * game.world.height - 39), 'desk');
    var flicker = desk.animations.add('flicker');
    desk.body.immovable = true;
    desk.animations.play('flicker', 30, true);
    desk = desks.create(Math.abs(Math.random() * game.world.width - 44), Math.abs(Math.random() * game.world.height - 39), 'desk');
    flicker = desk.animations.add('flicker');
    desk.body.immovable = true;
    desk.animations.play('flicker', 30, true);


    // Create an items group
    // Each item should have a collect function that defines what happens when it is collected
    items = game.add.group();
    items.enableBody = true;
    var stapler = items.create(Math.abs(Math.random() * game.world.width - 44), Math.abs(Math.random() * game.world.height - 39), 'stapler');
    stapler.collect = function(){
        mygun = machinegun;
        this.kill();
    }


    createPlayer();
    createEnemies();

    // stapler = game.add.sprite(Math.abs(Math.random() * game.world.width - 44), Math.abs(Math.random() * game.world.height - 39), 'stapler');
    stapler.animations.add('bounce');
    stapler.animations.play('bounce', 30, true);

    game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    //game.camera.deadzone = new Phaser.Rectangle(
    //game.width * .35, game.height * .35, game.width * .3, game.height * .3);

    //  HUD
    scoreText = game.add.text(16, 16, 'Score: ' + player.score, {
        font: 'VT323',
        fontSize: '10px',
        fill: '#FFF'
    });
    scoreText.fixedToCamera = true;

    healthText = game.add.text(16, 32, 'Health: ' + player.health, {
        font: 'VT323',
        fontSize: '10px',
        fill: '#FFF'
    });
    healthText.fixedToCamera = true;

    // Bullets - TODO: Cleanup / roll into player or gun code
    // TODO - Destroy bullets when they exit camera pane, i.e. cannot shoot enemies off screen
    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'staple');
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
        updateEnemies();

        // Weapon select
        if (wasd.pistolKey.isDown) {
            mygun = pistol;
        }
        if (wasd.machinegunKey.isDown) {
            mygun = machinegun;
        }
    }
    game.physics.arcade.collide(player, desks);
    game.physics.arcade.overlap(player, items, collectItem, null, this);
        // console.log('derp');
        // stapler.kill();
        // mygun = machinegun;
        // }, null, this);
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
    item.collect();
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
        bullet.rotation = game.physics.arcade.angleToPointer(bullet);
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

function render() {
    if (run_debug) {
        game.debug.text(player.invincible, 5, 15);
        game.debug.cameraInfo(game.camera, 5, 15);
        game.debug.spriteCoords(player, 5, 90);
        game.debug.text('Elapsed seconds: ' + game.time.totalElapsedSeconds(), 5, 140);
        game.debug.text('Mouse angle: ' + game.math.radToDeg(game.physics.arcade.angleToPointer(player)), 5, 160)

    }
}