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
    game.load.image('star', 'assets/star.png');
    game.load.spritesheet('dude', 'assets/player/player.png', 15, 30);
    game.load.image('checker', 'assets/checker.png');
    game.load.image('reticle', 'assets/player/reticle.png');
    game.load.image('head', 'assets/player/head.png');
    game.load.image('torso', 'assets/player/torso.png');
    game.load.image('arm', 'assets/player/arm.png');
    game.load.image('leg', 'assets/player/leg.png');
    game.load.image('foot', 'assets/player/foot.png');
    game.load.image('gun', 'assets/player/gun.png');
    game.load.image('bullet', 'assets/player/weapon/bullet.png');

    this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
    this.game.scale.setUserScale(3, 3);
    this.game.renderer.renderSession.roundPixels = true;
    Phaser.Canvas.setImageRenderingCrisp(this.game.canvas);
}

//Toggle debug information
var run_debug = false;

var player;
var platforms;
var wasd;

var stars;
var score = 0;
var scoreText;

var gravity = 1500;

var sprite;
var bullets;
var fireWait = 400;
var nextFire = 0;

var bgtile;

function init() {
}

function create() {
    //Make the map large
    game.world.setBounds(0, 0, 800, 600);

    //  We're going to be using physics, so enable the Arcade Physics system
    game.physics.startSystem(Phaser.Physics.ARCADE);

    game.input.mouse.capture = true;

    //  A simple background for our game
    //bgtile = game.add.tileSprite(0, 0, game.stage.bounds.width, 'checker');
    bgtile = game.add.tileSprite(0, 0, game.world.bounds.width, game.world.height, 'checker');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    // Setup the ground
    var ground = platforms.create(0, game.world.height - 5, 'ground');
    //    ground.scale.setTo(1, 60);
    ground.body.immovable = true;

    //  Now let's create two ledges
    //    var ledge = platforms.create(400, 400, 'ground');
    //    ledge.scale.setTo(.5, 2);
    //    ledge.body.immovable = true;
    //    ledge = platforms.create(-150, 250, 'ground');
    //    ledge.body.immovable = true;

    // player stuff went here
    createPlayer();

    game.camera.follow(player, Phaser.Camera.FOLLOW_LOCKON, 0.1, 0.1);
    //game.camera.deadzone = new Phaser.Rectangle(
    //    game.width * .35, game.height * .35, game.width * .3, game.height * .3);

    //  Finally some stars to collect
    stars = game.add.group();
    stars.enableBody = true;

    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 12; i++) {
        var star = stars.create(i * 70, 0, 'star');
        star.body.gravity.y = gravity;
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

    //  The score
    scoreText = game.add.text(16, 16, 'score: 0', {
        fontSize: '32px',
        fill: '#000'
    });

    //DEBUG - Mouse pointer angle
    mouseAngle = game.add.text(300, 300, game.physics.arcade.angleToPointer(player));

    //Controls mapping
    wasd = {
        up: game.input.keyboard.addKey(Phaser.Keyboard.W),
        down: game.input.keyboard.addKey(Phaser.Keyboard.S),
        left: game.input.keyboard.addKey(Phaser.Keyboard.A),
        right: game.input.keyboard.addKey(Phaser.Keyboard.D),
        space: game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR),
        pointer: game.input.activePointer
    };
    //  Stop the following keys from propagating up to the browser
    game.input.keyboard.addKeyCapture(
        [Phaser.Keyboard.W,
            Phaser.Keyboard.A,
            Phaser.Keyboard.S,
            Phaser.Keyboard.D,
            Phaser.Keyboard.SPACEBAR
        ]);

    bullets = game.add.group();
    bullets.enableBody = true;
    bullets.physicsBodyType = Phaser.Physics.ARCADE;

    bullets.createMultiple(50, 'bullet');
    bullets.setAll('checkWorldBounds', true);
    bullets.setAll('outOfBoundsKill', true);


    //game.physics.enable(sprite, Phaser.Physics.ARCADE);

    //    var wasd = game.input.keyboard.addKeys({ 'up': Phaser.Keyboard.W, 'down': Phaser.Keyboard.S, 'left': Phaser.Keyboard.A, 'right': Phaser.Keyboard.D } );
}

function update() {

    updatePlayer();

    //DEBUG - Mouse angle
    mouseAngle.text = game.math.radToDeg(game.physics.arcade.angleToPointer(player));

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(stars, platforms);

    //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
    game.physics.arcade.overlap(player, stars, collectStar, null, this);
    game.physics.arcade.overlap(platforms, bullets, killBullet, null, this);
}

//*********************************
//Helper Functions
//*********************************

function collectStar(player, star) {

    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score += 10;
    scoreText.text = 'Score: ' + score;

}

function killBullet(platform, bullet) {
    bullet.kill();
}

function fireBullet() {
    if (game.time.now > nextFire && bullets.countDead() > 0) {
        nextFire = game.time.now + fireWait;

        var bullet = bullets.getFirstDead();

        bullet.reset(player.x, player.y);
        //        bullet.scale.setTo(3, 3);
        bullet.smoothed = false;

        game.physics.arcade.moveToPointer(bullet, 300);
    }
}

function render() {
    if(run_debug){
    game.debug.cameraInfo(game.camera, 32, 32);
    game.debug.spriteCoords(player, 32, 500);
}

}