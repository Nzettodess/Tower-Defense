const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global variables
const cellSize = 75;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 50;
let currentStage = null; // Initialize to null

const maxHealth = 5; // Maximum health
let playerHealth = maxHealth; // Current health
const healthBarWidth = 150; // Width of the health bar
const healthBarHeight = 20; // Height of the health bar
const healthBarX = 700; // X position of the health bar
const healthBarY = 40; // Y position of the health bar

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];

const fps = 360; // Set desired frames per second
const interval = 1000 / fps; // Calculate time between frames in milliseconds
let lastTime = 0;

// Game state controls
let gamePaused = false;
let gameStarted = false;

const TILE_TYPES = {
    GRASS: 0,
    PATH: 1,
    OBSTACLE: 2
};

const tileImages = {
    [TILE_TYPES.GRASS]: 'Sprites/Background/1 Tiles/FieldsTile_01.png',
    [TILE_TYPES.PATH]: 'Sprites/Background/1 Tiles/FieldsTile_40.png', // example path for path tile
    [TILE_TYPES.OBSTACLE]: 'Sprites/Background/1 Tiles/FieldsTile_01.png' // example path for obstacle tile
};

const loadedImages = {};
for (const type in tileImages) {
    const img = new Image();
    img.src = tileImages[type];
    loadedImages[type] = img;
}

const stageMaps = {
    1: [
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    2: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    3: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ]
};

const path = [
    { firstX: 100, firstY: 125, secondX: 100, secondY: 525, thirdX: 500, thirdY: 500, forthX: 500, forthY: 200, finalX: 825, finalY: 200 },
    { firstX: 100, firstY: 125, secondX: 100, secondY: 450, thirdX: 825, thirdY: 450, forthX: 825, forthY: 450, finalX: 825, finalY: 450 },
    { firstX: 100, firstY: 125, secondX: 100, secondY: 525, thirdX: 500, thirdY: 525, forthX: 500, forthY: 200, finalX: 825, finalY: 200 },
    { firstX: 100, firstY: 125, secondX: 100, secondY: 500, thirdX: 500, thirdY: 500, forthX: 500, forthY: 200, finalX: 825, finalY: 200 }
];

// Mouse tracking
const mouse = {
    x: 10,
    y: 10,
    width: 0.1,
    height: 0.1,
};
let canvasPosition = canvas.getBoundingClientRect();
canvas.addEventListener('mousemove', function (e) {
    // Update canvas position to ensure it tracks accurately
    canvasPosition = canvas.getBoundingClientRect();
    mouse.x = e.clientX - canvasPosition.left;
    mouse.y = e.clientY - canvasPosition.top;
});
canvas.addEventListener('mouseleave', function () {
    mouse.x = undefined;
    mouse.y = undefined;
});

// Game board
const controlsBar = {
    width: canvas.width,
    height: cellSize,
};

function drawHealthBar() {
    // Draw the border of the health bar
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Calculate width of filled portion
    const healthRatio = playerHealth / maxHealth;
    const filledWidth = healthBarWidth * healthRatio;

    // Draw the filled portion
    ctx.fillStyle = 'red';
    ctx.fillRect(healthBarX, healthBarY, filledWidth, healthBarHeight);
}

// Game cells
class Cell {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.type = type;
    }
    draw() {

        const img = loadedImages[this.type];
        if (img.complete) { // Check if the image is loaded
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }

        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

function createGrid() {
    gameGrid.length = 0;

    const layout = stageMaps[currentStage];
    if (!layout) return; // Exit if no layout is defined for the current stage

    for (let row = 0; row < layout.length; row++) {
        for (let col = 0; col < layout[row].length; col++) {
            const type = layout[row][col]; // Get tile type from array
            const x = col * cellSize;
            const y = row * cellSize;
            gameGrid.push(new Cell(x, y, type));
        }
    }
}

function handleGameGrid() {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw();
    }
}

// Projectiles
class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.width = 10;
        this.height = 10;
        this.power = 20;
        this.speed = 5;
        this.angle = angle;  // Angle towards the target enemy
        this.dx = Math.cos(angle) * this.speed;
        this.dy = Math.sin(angle) * this.speed;
    }

    update() {
        // Move the projectile towards the enemy based on angle
        this.x += this.dx;
        this.y += this.dy;
    }

    draw() {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, Math.PI * 2);
        ctx.fill();
    }
}

function handleProjectiles() {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();

        for (let j = 0; j < enemies.length; j++) {
            if (enemies[j] && projectiles[i] && collision(projectiles[i], enemies[j])) {
                enemies[j].health -= projectiles[i].power;
                projectiles.splice(i, 1);
                i--;
            }
        }

        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--;
        }
    }
}

// Defenders
class Defender {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.shooting = false;
        this.health = 100;
        this.timer = 0;
        this.range = 200;

        // Array to hold sprite images
        this.sprites = [
            'Sprites/Defender/Tower1_001.png',  // Level 1
            'Sprites/Defender/Tower1_002.png',  // Level 2
            'Sprites/Defender/Tower1_003.png'   // Level 3 (max level)
        ];

        this.currentSpriteIndex = 0; // Start with the first sprite
        this.spriteImage = new Image();
        this.spriteImage.src = this.sprites[this.currentSpriteIndex]; // Set initial sprite image
        this.scaleX = 1; // Define any scaling as needed
        this.scaleY = 1;
        this.upgradable = true;  // Track whether the defender can still be upgraded

        // Initial attack speed
        this.attackSpeed = 100;  // Base attack speed in ms (Level 1)
    }

    // Method to upgrade the sprite and attack speed (called when clicked)
    upgrade() {
        // Define the resource costs for upgrades
        let upgradeCost = 0;
        if (this.currentSpriteIndex === 0) {  // From Level 1 to Level 2
            upgradeCost = 200;
        } else if (this.currentSpriteIndex === 1) {  // From Level 2 to Level 3
            upgradeCost = 300;
        }

        // Check if the player has enough resources
        if (numberOfResources >= upgradeCost && this.upgradable) {
            // Deduct the resources
            numberOfResources -= upgradeCost;

            // Upgrade only if there are higher levels available
            if (this.currentSpriteIndex < this.sprites.length - 1) {
                this.currentSpriteIndex++; // Move to the next sprite
                this.spriteImage.src = this.sprites[this.currentSpriteIndex]; // Update the sprite image
            }

            // Once the defender reaches the last sprite, it can't be upgraded further
            if (this.currentSpriteIndex === this.sprites.length - 1) {
                this.upgradable = false; // No further upgrades
            }

            // Increase attack speed with each upgrade
            if (this.currentSpriteIndex === 1) {
                this.attackSpeed = 50;  // Attack speed at Level 2 (faster shooting)
            } else if (this.currentSpriteIndex === 2) {
                this.attackSpeed = 30;  // Attack speed at Level 3 (fastest shooting)
            }
        }
    }

    draw() {
        if (this.spriteImage.complete) {
            ctx.drawImage(this.spriteImage, this.x, this.y, this.width * this.scaleX, this.height * this.scaleY);
        }
        // Draw health text
        ctx.fillStyle = 'gold';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 10, this.y + 20);
    }

    update() {
        // Find the first enemy in range
        let targetEnemy = null;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.range) {
                targetEnemy = enemy;
                break;
            }
        }

        // Shoot at the enemy if in range
        if (targetEnemy) {
            this.shooting = true;
            this.timer++;

            // Shoot only at intervals based on the attack speed
            if (this.timer % this.attackSpeed === 0) {
                const angle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2, angle));
            }
        } else {
            this.shooting = false;
            this.timer = 0;
        }
    }
}

// Event listener for clicking on a defender to upgrade its sprite and attack speed
canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return;

    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY) {
            defenders[i].upgrade(); // Upgrade the defender on click
            return;
        }
    }

    let defenderCost = 100;
    if (numberOfResources >= defenderCost) {
        defenders.push(new Defender(gridPositionX, gridPositionY));
        numberOfResources -= defenderCost;
    }
});



function handleDefenders() {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();
        if (enemyPositions.indexOf(defenders[i].y) !== -1) {
            defenders[i].shooting = true;
        } else {
            defenders[i].shooting = false;
        }
        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && collision(defenders[i], enemies[j])) {
                enemies[j].movement = 0;
                defenders[i].health -= 1;
                if (defenders[i] && defenders[i].health <= 0) {
                    defenders.splice(i, 1);
                    i--;
                    enemies[j].movement = enemies[j].speed;
                }
            }
        }
    }
}

// Enemies
const enemyTypes = [
    { size: 75, speed: 0.3, animationSpeed: 3, health: 100, spritePath: 'Sprites/Enemies/Enemy1_', numFrames: 7, scaleX: 0.3, scaleY: 0.3 },
    { size: 100, speed: 0.4, animationSpeed: 2, health: 150, spritePath: 'Sprites/Enemies/Enemy2_', numFrames: 17, scaleX: 1.3, scaleY: 1 },
    { size: 100, speed: 0.2, animationSpeed: 1.5, health: 200, spritePath: 'Sprites/Enemies/Enemy3_', numFrames: 17, scaleX: 1.3, scaleY: 0.8 }
];

class Enemy {
    constructor(typeIndex) {
        const typeConfig = enemyTypes[typeIndex];

        this.x = 100;
        this.y = 50;
        this.width = typeConfig.size;
        this.height = typeConfig.size;
        this.speed = typeConfig.speed;
        this.movement = typeConfig.speed;
        this.health = typeConfig.health; // Set health from typeConfig
        this.maxHealth = typeConfig.health; // Also set maxHealth
        this.pathIndex = 0;
        this.path = this.createPath();
        this.animationSpeed = typeConfig.animationSpeed;
        this.spriteImages = [];
        this.currentFrame = 0;
        
        this.scaleX = typeConfig.scaleX;
        this.scaleY = typeConfig.scaleY;

        for (let i = 1; i <= typeConfig.numFrames; i++) {
            const img = new Image();
            img.src = `${typeConfig.spritePath}${String(i).padStart(3, '0')}.png`;
            this.spriteImages.push(img);
        }
    }

    update() {
        const target = this.path[this.pathIndex];
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.movement) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.movement;
                this.y += (dy / distance) * this.movement;
            }
        }

        if (frame % this.animationSpeed === 0) {
            this.currentFrame = (this.currentFrame + 1) % this.spriteImages.length;
        }
    }

    draw() {
        const currentSprite = this.spriteImages[this.currentFrame];
        if (currentSprite.complete) {
            ctx.drawImage(currentSprite, this.x, this.y, this.width * this.scaleX, this.height * this.scaleY);
        }
    }

    createPath() {
        return [
            { x: path[currentStage].firstX, y: path[currentStage].firstY },
            { x: path[currentStage].secondX, y: path[currentStage].secondY },
            { x: path[currentStage].thirdX, y: path[currentStage].thirdY },
            { x: path[currentStage].forthX, y: path[currentStage].forthY },
            { x: path[currentStage].finalX, y: path[currentStage].finalY }
        ];
    }
}

// The handleEnemies function remains the same as before
function handleEnemies() {
    //  let enemiesInterval = 100;
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x === path[currentStage].finalX && enemies[i].y === path[currentStage].finalY) {
            playerHealth -= 1;
            enemies.splice(i, 1); 
            i--;  

            if (playerHealth <= 0) {
                gameOver = true; // End game if health is depleted
            }
            continue;
        }

        if (enemies[i].health <= 0) {
            let gainedResources = enemies[i].maxHealth / 10;
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
        }
    }

    // Enemy spawning logic
    if (frame % enemiesInterval === 0 && score < winningScore) {
        let path = Math.floor(Math.random() * 3); // Random path
        let verticalPosition = (path * cellSize + cellGap) + cellSize;

        // Choose a random enemy type for each spawn
        let enemyType = Math.floor(Math.random() * enemyTypes.length);
        enemies.push(new Enemy(enemyType));
        enemyPositions.push(verticalPosition);

        // Adjust spawn rate over time
        if (enemiesInterval > 100) enemiesInterval -= 10;
    }
}

function handleResources() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    ctx.fillStyle = 'gold';
    ctx.font = '30px Arial';
    ctx.fillText('Resources: ' + numberOfResources, 20, 40);
    ctx.fillText('Score: ' + score, 20, 80);
    ctx.fillText('Level: ' + (currentStage !== null ? currentStage : 'N/A'), 20, 120);

    drawHealthBar();
}

function handleGameStatus() {    

    let text, subText;

    if (gameOver) {
        text = 'GAME OVER';    } else if (score >= winningScore) {
        text = 'LEVEL COMPLETE';        subText = 'You win with ' + score + ' points!';
    } 
    else {        
        return; // Exit if neither game over nor level complete
    }

    // Center of the canvas    
    const canvasCenterX = canvas.width / 2;
    const canvasCenterY = canvas.height / 2;

    // Draw background rectangle centered on the canvas    
    const windowWidth = 600;
    const windowHeight = 400;    
    const windowX = canvasCenterX - windowWidth / 2;
    const windowY = canvasCenterY - windowHeight / 2;    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent black background
    ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
    // Draw main text centered    
    ctx.font = '60px Arial';
    ctx.fillStyle = 'white';    
    const textWidth = ctx.measureText(text).width;
    const textX = canvasCenterX - textWidth / 2;    
    const textY = canvasCenterY - 20; // Center main text slightly above the middle
    ctx.fillText(text, textX, textY);
    // Draw subtext if it exists, centered below the main text    
    if (subText) {
        ctx.font = '30px Arial';        
        const subTextWidth = ctx.measureText(subText).width;
        const subTextX = canvasCenterX - subTextWidth / 2;        
        const subTextY = textY + 40; // Position below main text
        ctx.fillText(subText, subTextX, subTextY);    }
}

function animate(timestamp) {
    if (gamePaused || !gameStarted) return; // Skip animation if paused or not started

    const elapsed = timestamp - lastTime; // Time since last frame

    if (elapsed > interval) {
        lastTime = timestamp - (elapsed % interval); // Reset lastTime for consistent frame rate
        
        // Clear and draw the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'blue';
        ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
        handleGameGrid();
        handleDefenders();
        handleResources();
        handleProjectiles();
        handleEnemies();
        handleGameStatus();
        frame++;
    }

    if (!gameOver) requestAnimationFrame(animate);
}

function collision(first, second) {
    if (!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)) {
        return true;
    }
}

function resetGame() {
  numberOfResources = 1000;
  enemiesInterval = 600;
  frame = 0;
  gameOver = false;
  score = 0;
  playerHealth = maxHealth;

  // Clear all game elements
  gameGrid.length = 0;
  defenders.length = 0;
  enemies.length = 0;
  enemyPositions.length = 0;
  projectiles.length = 0;

  createGrid(); // Recreate the game grid
}

// Button Event Listeners
document.getElementById('startButton').addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    gamePaused = false;
    requestAnimationFrame(animate);
  } else if (gamePaused) {
    gamePaused = false;
    requestAnimationFrame(animate); // Resume animation
  }
});

document.getElementById('pauseButton').addEventListener('click', () => {
  gamePaused = true;
});

document.getElementById('restartButton').addEventListener('click', () => {
  resetGame();
  gameStarted = true;
  gamePaused = false;
  requestAnimationFrame(animate);
});


// Start Game Function
function startGame(stage) {
  currentStage = stage;
  document.getElementById('menu').style.display = 'none';
  canvas.style.display = 'block';
  document.getElementById('gameControls').style.display = 'flex'; // Show controls
  resetGame(); // Reset the game on new stage
  createGrid();
  gameStarted = true;
  requestAnimationFrame(animate);
}

// Stage Selection Buttons
document.getElementById('stage1').addEventListener('click', function () {
    startGame(1);  // Start game with stage 1
});

document.getElementById('stage2').addEventListener('click', function () {
    startGame(2);  // Start game with stage 2
});

document.getElementById('stage3').addEventListener('click', function () {
    startGame(3);  // Start game with stage 2
});

// Handle window resize
window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});
