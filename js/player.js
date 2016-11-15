function createPlayer() {
    player = game.add.sprite(0, 0, 'player');
    player.position.setTo(game.world.centerX - player.width / 2, game.world.centerY - player.height / 2);

    player.alive = true;
    player.health = 3;
    player.score = 0;
    player.maxSpeed = 100;
    player.invincible = false;
    player.invincibleTime;
    player.lookAngle;
    player.lookDirection;

    game.physics.arcade.enable(player);
    game.camera.follow(player);

    player.body.collideWorldBounds = true;
    player.anchor.setTo(0.5, 0.5);

    //  Our two animations, walking left and right.
    player.animations.add('down', [1, 2, 3, 0], 5, true);
    player.animations.add('up', [5, 6, 7, 4], 5, true);
    player.animations.add('right', [9, 10, 11, 8], 5, true);
    player.animations.add('left', [13, 14, 15, 12], 5, true);

    // Define the standing frame for each direction the player can face
    player.standingFrames = {};
    player.standingFrames['down'] = 0;
    player.standingFrames['up'] = 4;
    player.standingFrames['right'] = 8;
    player.standingFrames['left'] = 12;

}

function updatePlayer() {
    // Player movement
    player.body.velocity.y = 0;
    player.body.velocity.x = 0;

    //Divide the look direction into 4 quadrants and determine which direction the mouse is
    player.lookAngle = game.math.radToDeg(game.physics.arcade.angleToPointer(player));
    if (player.lookAngle >= -135 && player.lookAngle < -45) {
        player.lookDirection = 'up';
    } else if (player.lookAngle >= -45 && player.lookAngle < 45) {
        player.lookDirection = 'right';
    } else if (player.lookAngle >= 45 && player.lookAngle < 135) {
        player.lookDirection = 'down';
    } else {
        player.lookDirection = 'left';
    }

    //Play the animation for the direction the player is looking
    if (wasd.up.isDown || wasd.down.isDown || wasd.left.isDown || wasd.right.isDown) {
        player.animations.play(player.lookDirection);
    }

    // Move the player
    if (wasd.up.isDown) {
        player.body.velocity.y = -(player.maxSpeed);
    }
    if (wasd.down.isDown) {
        player.body.velocity.y = player.maxSpeed;
    }
    if (wasd.left.isDown) {
        player.body.velocity.x = -(player.maxSpeed);
    }
    if (wasd.right.isDown) {
        player.body.velocity.x = player.maxSpeed;
    }

    // SHOOTEMUP
    if (wasd.pointer.isDown || wasd.space.isDown) {
        fireBullet();
    }

    //  Make player face the cursor when standing still
    if (!wasd.up.isDown && !wasd.down.isDown && !wasd.left.isDown && !wasd.right.isDown) {
        player.animations.stop();
        player.frame = player.standingFrames[player.lookDirection];
    }
}

function takeDamage() {
    if (!player.invincible) {
        player.health -= 1;

        // Check to see if this hit kills the player
        if (player.health <= 0) {
            player.alive = false;
            game.camera.unfollow();
            player.kill();
            gameOver();

        // If not, trigger temporary invincibility
        } else {
            player.invincible = true;
            player.invincibleTime = game.time.now + 3000;
        }
    }

}