import Grid from "./grid.js"
import Tile from "./tile.js"

const gameBoard = document.getElementById("game-board");

const grid = new Grid(gameBoard)


grid.randomEmptyCell().tile = new Tile(gameBoard)
grid.randomEmptyCell().tile = new Tile(gameBoard)
setupInput();
let score = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
document.getElementById('reset-button').addEventListener('click', resetGame); //reset buttons setup
document.getElementById('popup-button').addEventListener('click', resetGame);

function setupInput() {
    window.addEventListener("keydown", handleInput, { once: true });
    window.addEventListener("touchstart", e => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    window.addEventListener("touchmove", e => {
        e.preventDefault();
    }, { passive: false });
    window.addEventListener("touchend", handleSwipe, false);
}
function gameOver() { 
    const gameOverPopup = document.getElementById('game-over-popup');
    gameOverPopup.style.display = 'block';
}
function updateScoreDisplay() {
    const scoreDisplay = document.getElementById('score-display-popup');
    scoreDisplay.textContent = score;
}

function resetGame() {
    //reset score
    score = 0;
    updateScoreDisplay();

    //get tiles
    let cellsWithTiles = null
    cellsWithTiles = getCellsWithTiles(grid.cellsByColumn)
    console.log(cellsWithTiles)
    console.log('reset pressed')
    //remove tiles from cells
    cellsWithTiles.forEach(cell => {
        cell.tile.remove()
        cell.tile = null
    })
    //add two tiles
    let emptyCell = grid.randomEmptyCell();
    if (emptyCell) {
        emptyCell.tile = new Tile(gameBoard);
    }
    emptyCell = grid.randomEmptyCell();
    if (emptyCell) {
        emptyCell.tile = new Tile(gameBoard);
    }
    //hide popup
    const gameOverPopup = document.getElementById('game-over-popup');
    gameOverPopup.style.display = 'none';
    setupInput();
}

async function handleSwipe(e) {
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    let deltaX = touchEndX - touchStartX;
    let deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) { // Horizontal swipe
        if (deltaX > 0) {
            await handleInput({ key: "ArrowRight" });
        } else {
            await handleInput({ key: "ArrowLeft" });
        }
    } else { // Vertical swipe
        if (deltaY > 0) {
            await handleInput({ key: "ArrowDown" });
        } else {
            await handleInput({ key: "ArrowUp" });
        }
    }
}

async function handleInput(e) {
    switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
            if (!canMoveUp()) {
                setupInput()
                return
            }
            await moveUp()
            break
        case "ArrowDown":
        case "s":
        case "S":
            if (!canMoveDown()) {
                setupInput()
                return
            }
            await moveDown()
            break
        case "ArrowLeft":
        case "a":
        case "A":
            if (!canMoveLeft()) {
                setupInput()
                return
            }
            await moveLeft()
            break
        case "ArrowRight":
        case "d":
        case "D":
            if (!canMoveRight()) {
                setupInput()
                return
            }
            await moveRight()
            break
        default:
            setupInput()
            return
    }

    grid.cells.forEach(cell => cell.mergeTiles())

    const newTile = new Tile(gameBoard)
    grid.randomEmptyCell().tile = newTile

    if (!canMoveUp() && !canMoveDown() && !canMoveLeft() && !canMoveRight()) {
        newTile.waitForTransition(true).then(() => {
            updateScoreDisplay();
            gameOver()
        })
        return
    }

    setupInput()
}

function moveUp() {
    return slideTiles(grid.cellsByColumn)
}

function moveDown() {
    return slideTiles(grid.cellsByColumn.map(column => [...column].reverse()))
}

function moveLeft() {
    return slideTiles(grid.cellsByRow)
}

function moveRight() {
    return slideTiles(grid.cellsByRow.map(row => [...row].reverse()))
}

function getCellsWithTiles(cells) {
    return cells.flatMap(group => {
        return group.filter(cell => cell.tile != null)
    })
}

function slideTiles(cells) {
    return Promise.all(
        cells.flatMap(group => {
            const promises = []
            for (let i = 1; i < group.length; i++) {
                const cell = group[i]
                if (cell.tile == null) continue
                let lastValidCell
                for (let j = i - 1; j >= 0; j--) {
                    const moveToCell = group[j]
                    if (!moveToCell.canAccept(cell.tile)) break
                    lastValidCell = moveToCell
                }
                if (lastValidCell != null) {
                    promises.push(cell.tile.waitForTransition())
                    if (lastValidCell.tile != null) {
                        lastValidCell.mergeTile = cell.tile
                        score += cell.tile.value * 2; // Increment score with the merged tiles' values
                        console.log(score);
                    } else {
                        lastValidCell.tile = cell.tile
                    }
                    cell.tile = null
                }
            }
            return promises
        })
    )
}

function canMoveUp() {
    return canMove(grid.cellsByColumn)
}

function canMoveDown() {
    return canMove(grid.cellsByColumn.map(column => [...column].reverse()))
}

function canMoveLeft() {
    return canMove(grid.cellsByRow)
}

function canMoveRight() {
    return canMove(grid.cellsByRow.map(row => [...row].reverse()))
}

function canMove(cells) {
    return cells.some(group => {
        return group.some((cell, index) => {
            if (index === 0) return false
            if (cell.tile == null) return false
            const moveToCell = group[index - 1]
            return moveToCell.canAccept(cell.tile)
        })
    })
}