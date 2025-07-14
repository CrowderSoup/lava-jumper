document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const scoreEl = document.getElementById('score');
    const gameOverEl = document.getElementById('game-over');
    const finalScoreEl = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const touchControls = document.getElementById('touch-controls');
    const leftButton = document.getElementById('left-button');
    const rightButton = document.getElementById('right-button');
    const jumpButton = document.getElementById('jump-button');

    let gameWidth, gameHeight;

    // Game variables
    let player, platforms, lava, score, cameraY, isGameOver;

    // Player properties
    const playerWidth = 40;
    const playerHeight = 40;
    let playerX, playerY;
    let playerVelX = 0;
    let playerVelY = 0;
    const playerSpeed = 5;
    const jumpPower = -12;
    const gravity = 0.5;

    // Platform properties
    const platformWidth = 100;
    const platformHeight = 20;
    const platformMinYSpacing = 100;
    const platformMaxYSpacing = 150;

    // Lava properties
    const lavaHeight = 50;
    let lavaY;
    const lavaSpeed = 0.25; // Increased lava speed
    let lavaBubbles = [];

    // Player animation
    let playerState = 'idle'; // 'idle', 'running', 'jumping'
    let playerDirection = 'right';
    let animationFrame = 0;

    // Controls
    const keys = {
        left: false,
        right: false,
    };

    function resizeCanvas() {
        // The canvas element's size is now controlled by CSS.
        // We need to set the canvas's internal resolution to match its displayed size.
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        gameWidth = canvas.width;
        gameHeight = canvas.height;

        if (isTouchDevice()) {
            touchControls.classList.remove('hidden');
        }

        if (!isGameOver) {
            init();
        }
    }

    function isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    function init() {
        playerX = gameWidth / 2 - playerWidth / 2;
        playerY = gameHeight - playerHeight - 100;
        playerVelY = 0;
        cameraY = 0;
        score = 0;
        isGameOver = false;

        platforms = [];
        // Create initial platforms
        for (let i = 0; i < 10; i++) {
            platforms.push({
                x: Math.random() * (gameWidth - platformWidth),
                y: gameHeight - 100 - (i * (platformMinYSpacing + 20)),
                width: platformWidth,
                height: platformHeight,
                visited: false
            });
        }
        // Ensure there's a platform for the player to start on
        platforms[0].x = playerX - platformWidth / 2 + playerWidth / 2;
        platforms[0].y = gameHeight - 100;


        lavaY = gameHeight + lavaHeight;
        lavaBubbles = [];

        gameOverEl.classList.add('hidden');
        scoreEl.textContent = `Score: 0`;

        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        gameLoop();
    }

    function update() {
        if (isGameOver) return;

        animationFrame++;

        // Player movement
        if (keys.left) {
            playerVelX = -playerSpeed;
            playerDirection = 'left';
        } else if (keys.right) {
            playerVelX = playerSpeed;
            playerDirection = 'right';
        } else {
            playerVelX = 0;
        }
        playerX += playerVelX;

        // Wall collision
        if (playerX < 0) {
            playerX = 0;
        }
        if (playerX + playerWidth > gameWidth) {
            playerX = gameWidth - playerWidth;
        }

        // Player gravity
        playerVelY += gravity;
        playerY += playerVelY;

        // Platform collision
        let onPlatform = false;
        platforms.forEach(platform => {
            if (
                playerY + playerHeight > platform.y &&
                playerY + playerHeight < platform.y + platform.height + 1 &&
                playerX + playerWidth > platform.x &&
                playerX < platform.x + platform.width &&
                playerVelY >= 0
            ) {
                playerVelY = 0;
                playerY = platform.y - playerHeight;
                onPlatform = true;

                if (!platform.visited) {
                    score++;
                    platform.visited = true;
                }
            }
        });

        // Update player state
        if (onPlatform) {
            if (playerVelX !== 0) {
                playerState = 'running';
            } else {
                playerState = 'idle';
            }
        } else {
            playerState = 'jumping';
        }

        // Camera follow
        if (playerY < gameHeight / 2 - cameraY) {
            cameraY = gameHeight / 2 - playerY;
        }

        // Generate new platforms
        const topPlatformY = platforms[platforms.length - 1].y;
        if (topPlatformY > playerY - gameHeight) {
            platforms.push({
                x: Math.random() * (gameWidth - platformWidth),
                y: topPlatformY - (platformMinYSpacing + Math.random() * (platformMaxYSpacing - platformMinYSpacing)),
                width: platformWidth,
                height: platformHeight,
                visited: false
            });
        }

        // Remove old platforms
        platforms = platforms.filter(p => p.y < playerY + gameHeight + 200);

        // Lava movement
        lavaY -= lavaSpeed;
        // Ensure lava is always at or above the bottom of the screen
        lavaY = Math.min(lavaY, gameHeight - cameraY);

        // Update lava bubbles
        if (Math.random() < 0.2) {
            lavaBubbles.push({
                x: Math.random() * gameWidth,
                y: lavaY + Math.random() * gameHeight,
                radius: Math.random() * 10 + 5,
                life: 100,
            });
        }
        lavaBubbles = lavaBubbles.filter(bubble => {
            bubble.y -= 1;
            bubble.life--;
            return bubble.life > 0;
        });


        // Game over condition
        if (playerY + playerHeight > lavaY) {
            isGameOver = true;
            finalScoreEl.textContent = score;
            gameOverEl.classList.remove('hidden');
        }
    }

    function drawPlayer() {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        // Shorten all dimensions slightly to account for line width
        const headRadius = 7; // diameter = 14
        const bodyHeight = 18;
        const legLength = 14;
        const armLength = 12;

        // Total height of drawn character = 14 + 18 + 14 = 46
        // This leaves 4px of buffer within the 50px playerHeight, 2px on top, 2px on bottom
        const bufferY = (playerHeight - (headRadius * 2 + bodyHeight + legLength)) / 2;

        const centerX = playerX + playerWidth / 2;
        const topY = playerY + bufferY;

        // Head
        const headY = topY + headRadius;
        ctx.beginPath();
        ctx.arc(centerX, headY, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Body
        const bodyStartY = topY + headRadius * 2;
        const bodyEndY = bodyStartY + bodyHeight;
        ctx.beginPath();
        ctx.moveTo(centerX, bodyStartY);
        ctx.lineTo(centerX, bodyEndY);
        ctx.stroke();

        // Arms
        const armY = bodyStartY + 4;
        const armXOffset = (playerDirection === 'left' ? -1 : 1) * (playerState === 'running' ? Math.sin(animationFrame * 0.3) * 5 : 0);
        ctx.beginPath();
        ctx.moveTo(centerX, armY);
        ctx.lineTo(centerX - armLength + armXOffset, armY + armLength - 4);
        ctx.moveTo(centerX, armY);
        ctx.lineTo(centerX + armLength - armXOffset, armY + armLength - 4);
        ctx.stroke();

        // Legs
        const legY = bodyEndY;
        if (playerState === 'jumping') {
            ctx.beginPath();
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX - legLength / 2, legY + legLength);
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX + legLength / 2, legY + legLength);
            ctx.stroke();
        } else if (playerState === 'running') {
            const legAngle = Math.sin(animationFrame * 0.3) * (Math.PI / 4);
            ctx.beginPath();
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX - Math.cos(legAngle) * legLength, legY + Math.sin(legAngle) * legLength);
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX + Math.cos(legAngle) * legLength, legY - Math.sin(legAngle) * legLength);
            ctx.stroke();
        } else { // idle
            ctx.beginPath();
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX - 5, legY + legLength);
            ctx.moveTo(centerX, legY);
            ctx.lineTo(centerX + 5, legY + legLength);
            ctx.stroke();
        }
        ctx.restore();
    }

    function draw() {
        ctx.clearRect(0, 0, gameWidth, gameHeight);
        ctx.save();
        ctx.translate(0, cameraY);

        // Draw player
        drawPlayer();

        // Draw platforms
        platforms.forEach(platform => {
            const grassHeight = 8;
            // Dirt
            ctx.fillStyle = '#8B4513'; // SaddleBrown
            ctx.fillRect(platform.x, platform.y + grassHeight, platform.width, platform.height - grassHeight);
            // Grass
            ctx.fillStyle = '#228B22'; // ForestGreen
            ctx.fillRect(platform.x, platform.y, platform.width, grassHeight);
        });

        // Draw lava
        const lavaGradient = ctx.createLinearGradient(0, lavaY, 0, lavaY + 200);
        lavaGradient.addColorStop(0, '#ff4500');
        lavaGradient.addColorStop(1, '#ff8c00');
        ctx.fillStyle = lavaGradient;
        ctx.fillRect(0, lavaY, gameWidth, gameHeight + 200);

        // Draw lava bubbles
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        lavaBubbles.forEach(bubble => {
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
            ctx.fill();
        });


        ctx.restore();

        // Draw UI
        scoreEl.textContent = `Score: ${score}`;
    }

    let gameLoopId;
    function gameLoop() {
        update();
        draw();
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function jump() {
        // Allow jumping only if on a platform
        let canJump = false;
        platforms.forEach(platform => {
            if (
                playerY + playerHeight >= platform.y &&
                playerY + playerHeight <= platform.y + platform.height + 5 && // A little tolerance
                playerX + playerWidth > platform.x &&
                playerX < platform.x + platform.width
            ) {
                canJump = true;
            }
        });
        if (canJump) {
            playerVelY = jumpPower;
        }
    }

    // Event Listeners
    window.addEventListener('resize', resizeCanvas);
    
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
        if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') jump();
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    });

    restartButton.addEventListener('click', () => {
        gameOverEl.classList.add('hidden');
        init();
    });

    // Touch Controls
    leftButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
    leftButton.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
    rightButton.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
    rightButton.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });
    jumpButton.addEventListener('touchstart', (e) => { e.preventDefault(); jump(); });

    // Initial setup
    resizeCanvas();
});
