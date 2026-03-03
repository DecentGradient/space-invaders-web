const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const statusMessage = document.getElementById('status-message');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Game Constants
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ALIEN_SPEED_START = 1;
const ALIEN_DROP_DISTANCE = 30;

// Game State
let gameState = 'START'; // START, PLAYING, GAME_OVER
let score = 0;
let lastTime = 0;
let alienDirection = 1; // 1 = right, -1 = left
let alienSpeed = ALIEN_SPEED_START;

// Entities
const player = {
    x: CANVAS_WIDTH / 2 - 25,
    y: CANVAS_HEIGHT - 50,
    width: 50,
    height: 30,
    color: '#0f0',
    bullets: []
};

let aliens = [];
let alienBullets = [];
let bunkers = [];

// Procedural Graphics Helpers
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawPlayer() {
    // Tank body
    drawRect(player.x, player.y + 10, 50, 20, player.color);
    // Tank turret
    drawRect(player.x + 20, player.y, 10, 10, player.color);
    // Tank details
    drawRect(player.x + 5, player.y + 15, 5, 10, '#000');
    drawRect(player.x + 40, player.y + 15, 5, 10, '#000');
}

function createAliens() {
    aliens = [];
    const rows = 5;
    const cols = 11;
    const padding = 10;
    const width = 40;
    const height = 30;
    const startX = 50;
    const startY = 50;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            aliens.push({
                x: startX + c * (width + padding),
                y: startY + r * (height + padding),
                width: width,
                height: height,
                type: r, // 0-4 defines distinct alien types if needed
                alive: true
            });
        }
    }
}

function drawAlien(alien) {
    if (!alien.alive) return;
    
    // Procedural alien drawing based on type (row)
    ctx.fillStyle = '#fff';
    const x = alien.x;
    const y = alien.y;
    const w = alien.width;
    const h = alien.height;

    // Simple pixel-art style representation
    if (alien.type === 0) { // Top row - Squid like
        drawRect(x + 15, y, 10, 5, '#fff');
        drawRect(x + 5, y + 5, 30, 15, '#fff');
        drawRect(x + 5, y + 20, 5, 10, '#fff');
        drawRect(x + 30, y + 20, 5, 10, '#fff');
        // Eyes
        drawRect(x + 12, y + 10, 5, 5, '#000');
        drawRect(x + 23, y + 10, 5, 5, '#000');
    } else if (alien.type >= 1 && alien.type <= 2) { // Middle rows - Crab like
        drawRect(x + 10, y, 20, 5, '#fff');
        drawRect(x, y + 5, 40, 15, '#fff');
        drawRect(x, y + 20, 5, 10, '#fff');
        drawRect(x + 35, y + 20, 5, 10, '#fff');
        drawRect(x + 10, y + 20, 20, 5, '#fff');
        // Eyes
        drawRect(x + 10, y + 10, 5, 5, '#000');
        drawRect(x + 25, y + 10, 5, 5, '#000');
    } else { // Bottom rows - Octopus like
        drawRect(x + 15, y, 10, 5, '#fff');
        drawRect(x + 5, y + 5, 30, 20, '#fff');
        drawRect(x + 5, y + 25, 5, 5, '#fff');
        drawRect(x + 30, y + 25, 5, 5, '#fff');
        // Eyes
        drawRect(x + 12, y + 10, 5, 5, '#000');
        drawRect(x + 23, y + 10, 5, 5, '#000');
    }
}

function createBunkers() {
    bunkers = [];
    const bunkerCount = 4;
    const spacing = CANVAS_WIDTH / bunkerCount;
    
    for (let i = 0; i < bunkerCount; i++) {
        bunkers.push({
            x: spacing * i + spacing / 2 - 40,
            y: CANVAS_HEIGHT - 120,
            width: 80,
            height: 50,
            health: 10
        });
    }
}

function drawBunkers() {
    bunkers.forEach(bunker => {
        if (bunker.health > 0) {
            // Degrade color based on health
            const alpha = bunker.health / 10;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
            // Main shape
            ctx.fillRect(bunker.x, bunker.y, bunker.width, bunker.height);
            // Arch cutout
            ctx.clearRect(bunker.x + 20, bunker.y + 30, 40, 20);
        }
    });
}

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space') {
        if (gameState === 'START' || gameState === 'GAME_OVER') {
            startGame();
        } else if (gameState === 'PLAYING') {
            shootBullet();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

function shootBullet() {
    // Limit player bullets
    if (player.bullets.length < 3) {
        player.bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 4,
            height: 10,
            speed: BULLET_SPEED
        });
    }
}

function startGame() {
    gameState = 'PLAYING';
    score = 0;
    scoreDisplay.innerText = score;
    statusMessage.style.display = 'none';
    createAliens();
    createBunkers();
    alienSpeed = ALIEN_SPEED_START;
    player.x = CANVAS_WIDTH / 2 - 25;
    player.bullets = [];
    alienBullets = [];
}

function update(deltaTime) {
    if (gameState !== 'PLAYING') return;

    // Player Movement
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= PLAYER_SPEED;
    }
    if (keys['ArrowRight'] && player.x < CANVAS_WIDTH - player.width) {
        player.x += PLAYER_SPEED;
    }

    // Player Bullets
    player.bullets.forEach((bullet, index) => {
        bullet.y -= bullet.speed;
        if (bullet.y < 0) {
            player.bullets.splice(index, 1);
        }
    });

    // Alien Movement
    let hitEdge = false;
    const livingAliens = aliens.filter(a => a.alive);
    
    if (livingAliens.length === 0) {
        // Level cleared - Respawn harder? For now, just reset aliens
        createAliens();
        alienSpeed += 0.5;
        return;
    }

    livingAliens.forEach(alien => {
        if ((alien.x + alien.width >= CANVAS_WIDTH && alienDirection === 1) ||
            (alien.x <= 0 && alienDirection === -1)) {
            hitEdge = true;
        }
    });

    if (hitEdge) {
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.y += ALIEN_DROP_DISTANCE;
            // Game Over if aliens reach player level
            if (alien.alive && alien.y + alien.height >= player.y) {
                gameOver();
            }
        });
    }

    aliens.forEach(alien => {
        if (alien.alive) {
            alien.x += alienSpeed * alienDirection;
        }
    });

    // Alien Shooting
    if (Math.random() < 0.02 && livingAliens.length > 0) {
        const shooter = livingAliens[Math.floor(Math.random() * livingAliens.length)];
        alienBullets.push({
            x: shooter.x + shooter.width / 2,
            y: shooter.y + shooter.height,
            width: 4,
            height: 10,
            speed: 3
        });
    }

    // Alien Bullets
    alienBullets.forEach((bullet, index) => {
        bullet.y += bullet.speed;
        if (bullet.y > CANVAS_HEIGHT) {
            alienBullets.splice(index, 1);
        }
    });

    checkCollisions();
}

function checkCollisions() {
    // Player Bullets hitting Aliens
    player.bullets.forEach((bullet, bIndex) => {
        aliens.forEach(alien => {
            if (alien.alive &&
                bullet.x < alien.x + alien.width &&
                bullet.x + bullet.width > alien.x &&
                bullet.y < alien.y + alien.height &&
                bullet.y + bullet.height > alien.y) {
                
                alien.alive = false;
                player.bullets.splice(bIndex, 1);
                score += 10 + (4 - alien.type) * 10; // More points for top rows
                scoreDisplay.innerText = score;
                
                // Speed up as aliens die
                const livingCount = aliens.filter(a => a.alive).length;
                alienSpeed = ALIEN_SPEED_START + (55 - livingCount) * 0.05;
            }
        });
        
        // Player Bullets hitting Bunkers
        bunkers.forEach(bunker => {
            if (bunker.health > 0 &&
                bullet.x < bunker.x + bunker.width &&
                bullet.x + bullet.width > bunker.x &&
                bullet.y < bunker.y + bunker.height &&
                bullet.y + bullet.height > bunker.y) {
                
                player.bullets.splice(bIndex, 1);
                bunker.health--;
            }
        });
    });

    // Alien Bullets hitting Player
    alienBullets.forEach((bullet, bIndex) => {
        if (bullet.x < player.x + player.width &&
            bullet.x + bullet.width > player.x &&
            bullet.y < player.y + player.height &&
            bullet.y + bullet.height > player.y) {
            
            gameOver();
        }

        // Alien Bullets hitting Bunkers
        bunkers.forEach(bunker => {
            if (bunker.health > 0 &&
                bullet.x < bunker.x + bunker.width &&
                bullet.x + bullet.width > bunker.x &&
                bullet.y < bunker.y + bunker.height &&
                bullet.y + bullet.height > bunker.y) {
                
                alienBullets.splice(bIndex, 1);
                bunker.health--;
            }
        });
    });
    
    // Aliens hitting Bunkers
    aliens.forEach(alien => {
        if (alien.alive) {
            bunkers.forEach(bunker => {
                if (bunker.health > 0 &&
                    alien.x < bunker.x + bunker.width &&
                    alien.x + alien.width > bunker.x &&
                    alien.y < bunker.y + bunker.height &&
                    alien.y + alien.height > bunker.y) {
                    
                    bunker.health = 0; // Alien destroys bunker instantly
                }
            });
        }
    });
}

function gameOver() {
    gameState = 'GAME_OVER';
    statusMessage.innerText = "GAME OVER - PRESS SPACE TO RESTART";
    statusMessage.style.display = 'block';
}

function draw() {
    // Clear Screen
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'START') {
        // Just keep the start message visible
        return;
    }

    drawPlayer();
    aliens.forEach(drawAlien);
    drawBunkers();

    // Draw Player Bullets
    ctx.fillStyle = '#fff';
    player.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    // Draw Alien Bullets
    ctx.fillStyle = '#ff0000';
    alienBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// Start Loop
requestAnimationFrame(gameLoop);