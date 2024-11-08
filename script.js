const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 900;
canvas.height = 600;

// Global variables
const cellSize = 100;
const cellGap = 3;
let numberOfResources = 300;
let enemiesInterval = 600;
let frame = 0;
let gameOver = false;
let score = 0;
const winningScore = 50;
let currentStage = null; // Initialize to null

const gameGrid = [];
const defenders = [];
const enemies = [];
const enemyPositions = [];
const projectiles = [];

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

// Game cells
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
    }
    draw() {
        if (mouse.x && mouse.y && collision(this, mouse)) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
}

function createGrid() {
    for (let y = cellSize; y < canvas.height; y += cellSize) {
        for (let x = 0; x < canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y));
        }
    }
}
createGrid();

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
        this.range = 200;  // Define the attack range of the defender
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'gold';
        ctx.font = '30px Arial';
        ctx.fillText(Math.floor(this.health), this.x + 15, this.y + 30);
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
                break;  // Only target the first enemy in range
            }
        }

        // Shoot at the enemy if in range
        if (targetEnemy) {
            this.shooting = true;
            this.timer++;
            if (this.timer % 100 === 0) {
                // Create a projectile aimed at the target enemy
                const angle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
                projectiles.push(new Projectile(this.x + this.width / 2, this.y + this.height / 2, angle));
            }
        } else {
            this.shooting = false;
            this.timer = 0;
        }
    }
}

canvas.addEventListener('click', function () {
    const gridPositionX = mouse.x - (mouse.x % cellSize) + cellGap;
    const gridPositionY = mouse.y - (mouse.y % cellSize) + cellGap;
    if (gridPositionY < cellSize) return;

    for (let i = 0; i < defenders.length; i++) {
        if (defenders[i].x === gridPositionX && defenders[i].y === gridPositionY)
            return;
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
class Enemy {
    constructor() {
        this.x = 100; // Starting x position
        this.y = 100; // Starting y position
        this.width = cellSize - cellGap * 2;
        this.height = cellSize - cellGap * 2;
        this.speed = Math.random() * 0.5 + 0.5; // Adjust speed as needed
        this.health = 100;
        this.maxHealth = this.health;
        this.pathIndex = 0; // Track current waypoint index
        this.path = this.createPath(); // Initialize path waypoints

        // Animation setup
        this.spriteImages = []; // Array to store sprite frames
        this.currentFrame = 0; // Track current frame in animation

        // Load each frame in the sequence
        for (let i = 1; i <= 7; i++) { // Loop from 1 to 7 to match the filenames
            const img = new Image();
            img.src = `WALK/WALK_${String(i).padStart(3, '0')}.png`; // Adjust path if necessary
            this.spriteImages.push(img);
        }
    }

    update() {
        // Update logic for movement
        const target = this.path[this.pathIndex];
        if (target) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.speed) {
                this.x = target.x;
                this.y = target.y;
                this.pathIndex++;
            } else {
                this.x += (dx / distance) * this.speed;
                this.y += (dy / distance) * this.speed;
            }
        }

        // Cycle through animation frames
        this.currentFrame = (this.currentFrame + 1) % this.spriteImages.length;
    }

    draw() {
        // Ensure current frame image is loaded before drawing
        const currentSprite = this.spriteImages[this.currentFrame];
        if (currentSprite.complete) { // Check if image is loaded
            ctx.drawImage(currentSprite, this.x, this.y, this.width, this.height);
        }
    }

    createPath() {
        // Define a simple path for the enemy
        return [
            { x: 100, y: 100 },
            { x: 100, y: 500 },
            { x: 500, y: 500 },
            { x: 500, y: 200 },
            { x: 900, y: 200 }
        ];
    }
}

function handleEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        enemies[i].update();
        enemies[i].draw();
        if (enemies[i].x < 0) {
            gameOver = true;
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

    // Stage-specific enemy spawning
    if (currentStage === 1) {
        if (frame % enemiesInterval === 0 && score < winningScore) {
            let path = Math.floor(Math.random() * 3); // Three paths (0, 1, 2)
            let verticalPosition = (path * cellSize + cellGap) + cellSize; // Offset by path
            enemies.push(new Enemy(verticalPosition));
            enemyPositions.push(verticalPosition);
            if (enemiesInterval > 120) enemiesInterval -= 50;
        }
    } else if (currentStage === 2) {
        if (frame % enemiesInterval === 0 && score < winningScore) {
            let path = Math.floor(Math.random() * 4); // Four paths (0, 1, 2, 3)
            let verticalPosition = (path * cellSize + cellGap) + cellSize; // Offset by path
            enemies.push(new Enemy(verticalPosition));
            enemyPositions.push(verticalPosition);
            if (enemiesInterval > 100) enemiesInterval -= 30;
        }
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
}

function handleGameStatus() {
    if (gameOver) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.fillText('GAME OVER', 230, 300);
    } else if (score >= winningScore) {
        ctx.fillStyle = 'black';
        ctx.font = '60px Arial';
        ctx.fillText('LEVEL COMPLETE', 130, 300);
        ctx.font = '30px Arial';
        ctx.fillText('You win with ' + score + ' points!', 134, 340);
    }
}

const fps = 24; // Set desired frames per second
const interval = 1000 / fps; // Calculate time between frames in milliseconds
let lastTime = 0;

function animate(timestamp) {
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

// Start Game Function
function startGame(stage) {
    currentStage = stage;  // Store selected stage
    document.getElementById('menu').style.display = 'none';
    canvas.style.display = 'block';

    // Update canvas position after it becomes visible
    canvasPosition = canvas.getBoundingClientRect();
    
    animate();
}

// Stage Selection Buttons
document.getElementById('stage1').addEventListener('click', function () {
    startGame(1);  // Start game with stage 1
});

document.getElementById('stage2').addEventListener('click', function () {
    startGame(2);  // Start game with stage 2
});

// Handle window resize
window.addEventListener('resize', function () {
    canvasPosition = canvas.getBoundingClientRect();
});
