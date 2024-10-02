const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

context.scale(BLOCK_SIZE, BLOCK_SIZE);

let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

const arena = createMatrix(ROWS, COLS);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0
};

// Fonction pour démarrer le jeu
function startGame() {
    playerReset();
    updateScore();
    update();
}

// Écouteur d'événements pour les touches
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1); // Déplace à gauche
    } else if (event.key === 'ArrowRight') {
        playerMove(1); // Déplace à droite
    } else if (event.key === 'ArrowDown') {
        playerDrop(); // Fait tomber plus rapidement
    } else if (event.key === 'ArrowUp') {
        playerRotate(); // Fait pivoter la pièce
    }
});

// Ajoute un écouteur d'événement sur le bouton "Démarrer"
document.getElementById('startButton').addEventListener('click', () => {
    startGame(); // Démarre le jeu lorsqu'on clique sur le bouton
    document.getElementById('startButton').disabled = true; // Désactive le bouton après le lancement
});

function createMatrix(rows, cols) {
    const matrix = [];
    while (rows--) {
        matrix.push(new Array(cols).fill(0));
    }
    return matrix;
}

function draw() {
    context.fillStyle = '#000'; // Couleur de fond
    context.fillRect(0, 0, canvas.width, canvas.height); // Effacer le canevas

    drawMatrix(arena, { x: 0, y: 0 }); // Dessiner l'arène
    drawMatrix(player.matrix, player.pos); // Dessiner la pièce actuelle
}

function update(time = 0) {
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
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
}

function createPiece(type) {
    return TETROMINOS[type];
}

function drawBlock(x, y, color) {
    context.fillStyle = color;
    context.fillRect(x, y, 1, 1);
}

function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(x + offset.x, y + offset.y, COLORS[value]);
            }
        });
    });
}

function sweepArena() {
    let rowCount = 0;

    outer: for (let y = arena.length - 1; y >= 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // Si un bloc est vide, on passe à la ligne suivante
            }
        }

        // Si la ligne est remplie, on la supprime
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row); // Ajouter une nouvelle ligne vide en haut
        rowCount++; // Compter le nombre de lignes supprimées
        ++y; // Remettre l'index y à la ligne actuelle pour réévaluer après le déplacement
    }

    // Mettre à jour le score en fonction du nombre de lignes supprimées
    if (rowCount > 0) {
        player.score += rowCount * 10; // Ex. : chaque ligne vaut 10 points
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

// Les tétrominos et leurs couleurs
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

const COLORS = {
    1: 'cyan',   // I
    2: 'yellow', // O
    3: 'purple', // T
    4: 'orange', // L
    5: 'blue',   // J
    6: 'red',    // Z
    7: 'green'   // S
};

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
    // Si la rotation provoque une collision, on ajuste la position
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -1); // Revert rotation
            player.pos.x = pos; // Remettre la position originale
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