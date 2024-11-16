const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

//Define the audio asset
//const mainTheme = document.getElementById('mainTheme');

const bgMusic = new Audio('Audio/bg-ambience.mp3'); 
bgMusic.loop = true; // Loop the bgm
const openingtheme = new Audio('Audio/main theme song.mp3'); 
const hitEnemySound = new Audio('Audio/enemy get hit.mp3');
const enemyDieSound = new Audio('Audio/enemy die.mp3');
const uiInteractionSound = new Audio ('Audio/ui interaction.mp3');
const buildTowerSound = new Audio('Audio/build tower.mp3');
const upgradeTowerSound = new Audio('Audio/tower upgrade.mp3');
const destroyTowerSound = new Audio('Audio/tower destroyed.mp3');
const gameCompleteSound = new Audio('Audio/game-level-complete.mp3');
const gameOverSound = new Audio('Audio/game over.mp3');
const hpDrop = new Audio('Audio/player hp drop.mp3');

// Global variables
const cellSize = 75;
const cellGap = 3;
let numberOfResources = 500;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let gameWin = false;
let score = 0;
let winningScore = 50;
let currentStage = null; // Initialize to null
let hasInterated = false;

const maxHealth = 5; // Maximum health
let playerHealth = maxHealth; // Current health
const healthBarWidth = 150; // Width of the health bar
const healthBarHeight = 35; // Height of the health bar
const healthBarX = 700; // X position of the health bar
const healthBarY = 20; // Y position of the health bar

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];

const fps = 120; // Set desired frames per second
const interval = 1000 / fps; // Calculate time between frames in milliseconds
let lastTime = 0;

let hasInteracted = false;


// Game state controls
let gamePaused = false;
let gameStarted = false;

const TILE_TYPES = {
    GRASS: 0,
    PATH: 1,
    OBSTACLE: 2
};

const tileImages = {
    [TILE_TYPES.GRASS]: 'Sprites/Background/4 Test/tile000.png',
    [TILE_TYPES.PATH]: 'Sprites/Background/4 Test/tile039.png', // example path for path tile
    [TILE_TYPES.OBSTACLE]: 'Sprites/Background/4 Test/tile000.png' // example path for obstacle tile
};

const loadedImages = {};
for (const type in tileImages) {
    const img = new Image();
    img.src = tileImages[type];
    loadedImages[type] = img;
}

const stageMaps = {
    1: [
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ],
    2: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    3: [
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
};

const spawnPoint = [
    {x: 100, y: 50}, //Default
    {x: 100, y: 50},
    {x: 100, y: 600},
    {x: 50, y: 50}
];

const path = [
    { firstX: 100, firstY: 125, secondX: 100, secondY: 525, thirdX: 500, thirdY: 500, forthX: 500, forthY: 200, finalX: 825, finalY: 200 }, //Default
    { firstX: 100, firstY: 125, secondX: 100, secondY: 450, thirdX: 825, thirdY: 450, forthX: 825, forthY: 450, finalX: 825, finalY: 450 },
    { firstX: 100, firstY: 600, secondX: 100, secondY: 375, thirdX: 825, thirdY: 375, forthX: 825, forthY: 100, finalX: 825, finalY: 100 },
    { firstX: 100, firstY: 125, secondX: 100, secondY: 500, thirdX: 500, thirdY: 500, forthX: 500, forthY: 200, finalX: 825, finalY: 200 }
];

const defenderTypes = [
    {
        name: 'Archer',
        sprites: ['Sprites/Defender/Tower1_001.png', 'Sprites/Defender/Tower1_002.png', 'Sprites/Defender/Tower1_003.png'],
        cost: 100,
        range: 150,
        attackSpeed: 80,
    },
    {
        name: 'Mage',
        sprites: ['Sprites/Defender/Tower2_001.png', 'Sprites/Defender/Tower2_002.png', 'Sprites/Defender/Tower2_003.png'],
        cost: 150,
        range: 200,
        attackSpeed: 100,
    },
    {
        name: 'Cannon',
        sprites: ['Sprites/Defender/Tower1_001.png', 'Sprites/Defender/Tower1_002.png', 'Sprites/Defender/Tower1_003.png'],
        cost: 200,
        range: 100,
        attackSpeed: 50,
    }
];
let selectedDefender = defenderTypes[0]; // Default to the first type

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

function handleInteraction() {
    if (!hasInteracted) {
        hasInteracted = true;
        openingtheme.play().catch(err => {
            console.log('Error playing main theme:', err);
        });
    } 
    
}

function drawHealthBar() {
    // Draw the border of the health bar
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Calculate width of filled portion
    const healthRatio = playerHealth / maxHealth;
    const filledWidth = healthBarWidth * healthRatio;

    // Draw the filled portion
    ctx.fillStyle = '#198c1f';
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
                hitEnemySound.currentTime = 0;
                hitEnemySound.play();
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
    constructor(x, y, typeConfig) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.range = typeConfig.range;
        this.attackSpeed = typeConfig.attackSpeed;
        this.shooting = false;
        this.health = 100;
        this.timer = 0;
        //this.range = 200;

        // Array to hold sprite images
        this.sprites = typeConfig.sprites;
        //this.sprites = [
        //    'Sprites/Defender/Tower2_001.png',  // Level 1
        //    'Sprites/Defender/Tower2_002.png',  // Level 2
        //    'Sprites/Defender/Tower2_003.png'   // Level 3 (max level)
        //];

        this.currentSpriteIndex = 0; // Start with the first sprite
        this.spriteImage = new Image();
        this.spriteImage.src = this.sprites[this.currentSpriteIndex]; // Set initial sprite image
        this.scaleX = 1; // Define any scaling as needed
        this.scaleY = 1;
        this.upgradable = true;  // Track whether the defender can still be upgraded

        // Initial attack speed
        //this.attackSpeed = 100;  // Base attack speed in ms (Level 1)
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
           //Reset and play the upgrade sound effect
           upgradeTowerSound.currentTime = 0;  // Reset the sound to the beginning
           upgradeTowerSound.play();

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
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 20);
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
    if (numberOfResources >= selectedDefender.cost) {
        buildTowerSound.currentTime = 0; //Reset the sound effect of build tower
        buildTowerSound.play();
        defenders.push(new Defender(gridPositionX, gridPositionY, selectedDefender));
        numberOfResources -= selectedDefender.cost;
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
                    destroyTowerSound.currentTime = 0;
                    destroyTowerSound.play();
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
    { size: 50, speed: 0.5, animationSpeed: 3, health: 100, spritePath: 'Sprites/Enemies/slime1_move_', numFrames: 7, scaleX: 1, scaleY: 1 },
    { size: 70, speed: 0.4, animationSpeed: 3, health: 150, spritePath: 'Sprites/Enemies/slime2_move_', numFrames: 7, scaleX: 1, scaleY: 1 },
    { size: 80, speed: 0.2, animationSpeed: 3, health: 200, spritePath: 'Sprites/Enemies/slime3_move_', numFrames: 7, scaleX: 1, scaleY: 1 }
];

class Enemy {
    constructor(typeIndex) {
        const typeConfig = enemyTypes[typeIndex];

        this.x = spawnPoint[currentStage].x;
        this.y = spawnPoint[currentStage].y;
        this.width = typeConfig.size;
        this.height = typeConfig.size;
        this.speed = typeConfig.speed;
        this.movement = typeConfig.speed;
        this.health = typeConfig.health; // Set health from typeConfig
        this.maxHealth = typeConfig.health; // Also set maxHealth
        this.pathIndex = 0;
        this.path = this.createPath(path[currentStage]);
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
            hpDrop.currentTime = 0;
            hpDrop.play();
            playerHealth -= 1;
            enemies.splice(i, 1); 
            i--;  

            if (playerHealth <= 0) {
                gameOver = true; // End game if health is depleted
            }
            continue;
        }

        if (enemies[i].health <= 0) {
            let gainedResources = enemies[i].maxHealth / 2;
            numberOfResources += gainedResources;
            score += gainedResources;
            const findThisIndex = enemyPositions.indexOf(enemies[i].y);
            enemyPositions.splice(findThisIndex, 1);
            enemies.splice(i, 1);
            i--;
            enemyDieSound.currentTime = 0;
            enemyDieSound.play();
        }
    }

    // Enemy spawning logic
    if (frame % enemiesInterval === 0 && score < winningScore) {
        // let path = Math.floor(Math.random() * 3); // Random path
        // let path = currentStage;
        let verticalPosition = (path * cellSize + cellGap) + cellSize;

        // Choose a random enemy type for each spawn
        let enemyType = Math.floor(Math.random() * enemyTypes.length);
        enemies.push(new Enemy(enemyType));
        enemyPositions.push(verticalPosition);

        // Adjust spawn rate over time
        if (enemiesInterval > 100) enemiesInterval -= 10;
    }
}

let resources = [];
const amounts = [30, 50, 70]; // Possible resource amounts
let isGameReset = false;

const resourceTypes = [
    { spritePath: 'Sprites/Resources/Bronze/Bronze_', numFrames: 30, animationSpeed: 7, width: 50, height: 50, scaleX: 1, scaleY: 1 }
];


class Resource {
    constructor() {
        const typeConfig = resourceTypes[0]; // Currently only one type, but could add more types later

        this.x = Math.random() * (canvas.width - cellSize); // Random X position within canvas
        this.y = Math.random() > 0.5 ? 50 : 75; // Random Y position (50 or 75)
        this.width = typeConfig.width;
        this.height = typeConfig.height;
        this.animationSpeed = typeConfig.animationSpeed;
        this.spriteImages = [];
        this.currentFrame = 0;
        this.amount = Math.random() > 0.5 ? 30 : 50; // Assign a random amount (30 or 50)

        // Load each image frame for the resource animation
        for (let i = 1; i <= typeConfig.numFrames; i++) {
            const img = new Image();
            img.src = `${typeConfig.spritePath}${i}.png`; // Path to individual image files
            this.spriteImages.push(img);
        }
    }

    update() {
        // Update the sprite animation frame
        if (frame % this.animationSpeed === 0) {
            this.currentFrame = (this.currentFrame + 1) % this.spriteImages.length;
        }
    }

    draw() {
        // Draw the current sprite (image from the sequence)
        const currentSprite = this.spriteImages[this.currentFrame];
        if (currentSprite.complete) {
            ctx.drawImage(currentSprite, this.x, this.y, this.width * 1, this.height * 1); // Draw sprite at the correct position
        }

        // Draw the resource value on top of the sprite
        ctx.fillStyle = 'black'; // Text color
        ctx.font = '20px Arial'; // Font size and family
        ctx.fillText(this.amount, this.x + 15, this.y + 25); // Position the value text inside the sprite
    }
}

// Function to drop a new resource at regular intervals and handle collection
function dropResources() {
    
    
    if (isGameReset) {
        // Skip resource spawning for the first frame after reset
        isGameReset = false; // Reset the flag to avoid skipping on future frames
        return;
    }
    if (frame % 500 === 0 && score < winningScore) { // Spawn new resource every 500 frames
        const resource = new Resource(); // Create a new resource
        resource.draw();
        resources.push(resource); // Add the resource to the resources array
    }

    // Draw all resources
    resources.forEach(resource => {
        resource.update();
        resource.draw();
    });

}function handleMouseClick(mouseX, mouseY) {
    // Check if the click is on any resource
    for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];

        // Check if the click is within the bounds of the resource
        if (mouseX > resource.x && mouseX < resource.x + resource.width &&
            mouseY > resource.y && mouseY < resource.y + resource.height) {

            numberOfResources += resource.amount; // Add the resource amount to player's total
            resources.splice(i, 1); // Remove the resource from the array
            i--; // Adjust index to account for the removed resource
            break; // Exit the loop since only one resource is collected at a time
        }
    }
}




function handleResources() {
    
    ctx.fillStyle = '#424f34';
    ctx.fillRect(0, 0, controlsBar.width, controlsBar.height);
    // Draw the black border around the resource bar area
    ctx.strokeStyle = 'black'; // Black border color for the bar
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, controlsBar.width, controlsBar.height);
    
    ctx.fillStyle = '#e2e391';
    ctx.font = '30px Arial';
    ctx.fillText('Resources: ' + numberOfResources, 20, 45);
    ctx.fillText('|   Score: ' + score, 270, 45);
    ctx.fillText('|  Level: ' + (currentStage !== null ? currentStage : 'N/A'), 450, 45);

    drawHealthBar();
}



function handleGameStatus() {    

    let text, subText;

    if (gameOver) {
        text = 'GAME OVER';
        bgMusic.pause();
        bgMusic.currentTime = 0;
        gameOverSound.currentTime = 0;
        gameOverSound.play();
    } 
    else if (score >= winningScore) {
        text = 'LEVEL COMPLETE';        
        subText = 'You win with ' + score + ' points!';
        gameWin = true;
        bgMusic.pause();
        bgMusic.currentTime = 0;
        gameCompleteSound.currentTime = 0;
        gameCompleteSound.play();
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
        dropResources();
        if (mouse.x && mouse.y) {
            handleMouseClick(mouse.x, mouse.y);
        }

        frame++;
    }

    if (!gameOver && !gameWin) requestAnimationFrame(animate);
}

function collision(first, second) {
    if (!(first.x > second.x + second.width ||
        first.x + first.width < second.x ||
        first.y > second.y + second.height ||
        first.y + first.height < second.y)) {
        return true;
    }
    return false;
}

function resetGame() {
  numberOfResources = 1000;
  enemiesInterval = 600;
  frame = 0;
  gameOver = false;
  score = 0;
  playerHealth = maxHealth;
  gameWin = false
  resources = [];
  isGameReset = true;
  // Clear all game elements
  gameGrid.length = 0;
  defenders.length = 0;
  enemies.length = 0;
  enemyPositions.length = 0;
  projectiles.length = 0;

  createGrid(); // Recreate the game grid
}

// Add event listeners for defender selection
document.getElementById('defender1').addEventListener('click', () => {
    selectedDefender = defenderTypes[0]; // Select Defender 1
    uiInteractionSound.currentTime = 0;
    uiInteractionSound.play();
});
document.getElementById('defender2').addEventListener('click', () => {
    selectedDefender = defenderTypes[1]; // Select Defender 2
    uiInteractionSound.currentTime = 0;
    uiInteractionSound.play();
});
document.getElementById('defender3').addEventListener('click', () => {
    selectedDefender = defenderTypes[2]; // Select Defender 3
    uiInteractionSound.currentTime = 0;
    uiInteractionSound.play();
});

// Button Event Listeners
document.getElementById('startButton').addEventListener('click', () => {
  // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();
  
    if (!gameStarted) {
    gameStarted = true;
    gamePaused = false;
    requestAnimationFrame(animate);
  } else if (gamePaused) {
    gamePaused = false;
    requestAnimationFrame(animate); // Resume animation
  }
  bgMusic.play();
});

document.getElementById('pauseButton').addEventListener('click', () => {
  // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();

  gamePaused = true;
  bgMusic.pause();
});

document.getElementById('restartButton').addEventListener('click', () => {
  // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();
    if(currentStage == 1){
        startGame(1);
        numberOfResources = 300;
        enemiesInterval = 600;
        winningScore = 550;
        handleInteraction();
    }
    else if (currentStage == 2){
        startGame(2);  // Start game with stage 2
        numberOfResources = 400;
        enemiesInterval = 700;
        winningScore = 1550;
        handleInteraction();
    }
    else if (currentStage == 3){
        startGame(3);  // Start game with stage 2
        numberOfResources = 500;
        enemiesInterval = 800;
        winningScore = 2550;
         handleInteraction();
    }
  //resetGame();
  gameStarted = true;
  gamePaused = false;
  requestAnimationFrame(animate);
  bgMusic.currentTime = 0;
});

document.getElementById('MainMenuButton').addEventListener('click', () => {
    // Play interaction sound
    uiInteractionSound.currentTime = 0;
    uiInteractionSound.play();
  
    location.reload();
    requestAnimationFrame(animate);
    
  });

// Start Game Function
function startGame(stage) {
  currentStage = stage;
  document.getElementById('menu').style.display = 'none';
  canvas.style.display = 'block';
  document.getElementById('gameContainer').style.display = 'flex';
  document.getElementById('gameControls').style.display = 'flex';
  document.getElementById('defenderSelection').style.display = 'flex';
  
  resetGame(); // Reset the game on new stage
  createGrid();
  gameStarted = true;

  openingtheme.pause(); //Pause the main theme when enter gameplay
  openingtheme.currentTime = 0;

  bgMusic.play();
  requestAnimationFrame(animate);
}


function endGame(win) {
    gameOver = true;
    gameWin = win;
}

// Stage Selection Buttons
document.getElementById('stage1').addEventListener('click', function () {
    // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();
    startGame(1);  // Start game with stage 1
    numberOfResources = 300;
    enemiesInterval = 600;
    winningScore = 550;
    handleInteraction();
});

document.getElementById('stage2').addEventListener('click', function () {
   // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();
    startGame(2);  // Start game with stage 2
    numberOfResources = 400;
    enemiesInterval = 700;
    winningScore = 1550;
    handleInteraction();
});

document.getElementById('stage3').addEventListener('click', function () {
   // Play interaction sound
  uiInteractionSound.currentTime = 0;
  uiInteractionSound.play();
    startGame(3);  // Start game with stage 2
   numberOfResources = 500;
   enemiesInterval = 800;
   winningScore = 2550;
    handleInteraction();
});

// Handle window resize
window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});

window.addEventListener('load', function () {
    // This is added to allow any page load event to trigger the interaction if needed.
    handleInteraction();
});


