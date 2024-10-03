const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let Classement = [];
let gameOver = false;

const arena = createMatrix(ROWS, COLS);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
};

let nextPiece = null;
const nextCanvas = document.getElementById('nextPiece');
const nextContext = nextCanvas.getContext('2d');
nextContext.scale(30, 30);

// Fonction pour démarrer le jeu
function startGame() {
    resetArena();
    gameOver = false;
    playerReset();
    updateScore();
    update();
}

// Écouteur d'événements pour les touches
document.addEventListener('keydown', (event) => {
    if (!gameOver) {
        if (event.key === 'ArrowLeft') {
            playerMove(-1); // Déplace à gauche
        } else if (event.key === 'ArrowRight') {
            playerMove(1); // Déplace à droite
        } else if (event.key === 'ArrowDown') {
            playerDrop(); // Fait tomber plus rapidement
        } else if (event.key === 'ArrowUp') {
            playerRotate(); // Fait pivoter la pièce
        }
    }
});

document.getElementById('startButton').addEventListener('click', () => {
    startGame(); 
    document.getElementById('startButton').style.display = 'none';
});

function createMatrix(rows, cols) {
    const matrix = [];
    while (rows--) {
        matrix.push(new Array(cols).fill(0));
    }
    return matrix;
}

function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

function update(time = 0) {
    if (gameOver) return; // Arrête la boucle si le jeu est fini

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        sweepArena();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;  // Annule le mouvement si collision
    }
}

function playerRotate() {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1); 
            player.pos.x = pos; 
            return;
        }
    }
}

function rotate(matrix, times = 1) {
    for (let i = 0; i < times; i++) {
        matrix.reverse();
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < y; x++) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
    }
}

function collide(arena, player) {
    const [matrix, pos] = [player.matrix, player.pos];
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0 && (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function playerReset() {
    if (!nextPiece) {
        nextPiece = createPiece(randomPieceType());
    }
    player.matrix = nextPiece;
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    nextPiece = createPiece(randomPieceType());
    drawNextPiece();

    if (collide(arena, player)) {
        endGame(); // Termine le jeu si collision à la réinitialisation
    }
}

function endGame() {
    gameOver = true; // Le jeu est terminé
    document.getElementById('startButton').style.display = 'block'; // Affiche le bouton de démarrage pour recommencer
    Classement.push(player.score); // Ajoute le score au tableau de classement
    Classement.sort((a, b) => b - a); // Trie le classement par ordre décroissant
    updateClassement(); // Met à jour l'affichage du classement
}

function updateClassement() {
    afficheClassement(); // Affiche le classement mis à jour
}

// Nouvelle fonction pour afficher le classement
function afficheClassement() {
    const classementList = document.getElementById('Classement'); // Assurez-vous d'avoir une <ol> avec cet id
    classementList.innerHTML = ''; // Vide l'ancien contenu

    Classement.forEach((score, index) => {
        const scoreElement = document.createElement('li'); // Crée un élément de liste
        scoreElement.textContent = `${score}`; // Définit le texte avec le score
        classementList.appendChild(scoreElement); // Ajoute l'élément à la liste
    });
    if(Classement.length>=10){
        Classement.pop();
    }
}

function drawNextPiece() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    drawMatrix(nextPiece, { x: 1, y: 1 }, nextContext);
}

function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x + offset.x, y + offset.y, COLORS[value], ctx);
            }
        });
    });
}

function drawBlock(x, y, color, ctx = context) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
}

function sweepArena() {
    let rowCount = 0;

    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        rowCount++;
        ++y;
    }

    if (rowCount > 0) {
        player.score += rowCount * 10;
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
    if(parseInt(document.getElementById('score').innerText)>Classement[0]){
        document.getElementById('score').style.color = 'gold'
    }else if(parseInt(document.getElementById('score').innerText)>Classement[1]){
        document.getElementById('score').style.color = 'silver'
    }else if(parseInt(document.getElementById('score').innerText)>Classement[2]){
        document.getElementById('score').style.color = '#cd7f32'
    }else{
        document.getElementById('score').style.color = 'white'
    }
}

// Fonction pour réinitialiser l'arène après la fin du jeu
function resetArena() {
    arena.forEach(row => row.fill(0)); // Réinitialise l'arène
    player.score = 0; // Réinitialise le score du joueur
}

const TETROMINOS = {
    I: [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ],
    O: [
        [2, 2],
        [2, 2]
    ],
    T: [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0]
    ],
    L: [
        [4, 0, 0],
        [4, 0, 0],
        [4, 4, 0]
    ],
    J: [
        [0, 0, 5],
        [0, 0, 5],
        [0, 5, 5]
    ],
    Z: [
        [6, 6, 0],
        [0, 6, 6],
        [0, 0, 0]
    ],
    S: [
        [0, 7, 7],
        [7, 7, 0],
        [0, 0, 0]
    ]
};

const COLORS = [
    null,
    '#00ffff', // I
    '#ffff00', // O
    '#aa00ff', // T
    '#ffaa00', // L
    '#0000ff', // J
    '#ff0000', // Z
    '#00ff00'  // S
];

function createPiece(type) {
    return TETROMINOS[type];
}

function randomPieceType() {
    const pieces = 'TJLOSZI';
    return pieces[pieces.length * Math.random() | 0];
}