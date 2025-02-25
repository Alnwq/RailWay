const GAME_CONFIG = { 
    easy: { gridSize: 5, levels: 5 },
    hard: { gridSize: 7, levels: 5 }
};

const TILE_CONNECTIONS = {
    empty: [0, 0, 0, 0],
    straight_rail: [1, 1, 1, 1], 
    curve_rail: [1, 1, 1, 1],    
    bridge: [0, 0, 0, 0],     
    bridge_rail: [1, 1, 1, 1],  
    mountain: [0, 0, 0, 0],     
    mountain_rail: [1, 1, 1, 1], 
    oasis: [0, 0, 0, 0]        
};

class GameState {
    constructor() {
        this.grid = null;
        this.difficulty = null;
        this.playerName = '';
        this.elapsedTime = 0;
        this.timer = null;
        this.currentLevel = null;
        this.isPlaying = false;
        this.selectedTileType = null;
    }

    initializeGrid(difficulty, levelNumber) {
        this.difficulty = difficulty;
        this.currentLevel = levelNumber;
        const gridSize = GAME_CONFIG[difficulty.toLowerCase()].gridSize;
        this.grid = Array.from({ length: gridSize }, () =>
            Array.from({ length: gridSize }, () => ({
                type: 'empty',
                rotation: 0,
                isFixed: false
            }))
        );
    }

    resetGame() {
        this.stopTimer();
        this.elapsedTime = 0;
        this.isPlaying = false;
        this.grid = null;
    }

    startTimer() {
        this.isPlaying = true;
        this.timer = setInterval(() => {
            this.elapsedTime += 0.01;
            document.querySelector('#timer').textContent = this.elapsedTime.toFixed(3);
        }, 10);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    pauseTimer() {
        this.stopTimer();
        this.isPlaying = false;
    }

    resumeTimer() {
        if (!this.isPlaying) {
            this.startTimer();
        }
    }
}

const gameState = new GameState();

class GameUI {
    static showScreen(screenId) {
        if (screenId === 'gameScreen' && !document.querySelector('#gameScreen')) {
            const gameScreen = document.createElement('div');
            gameScreen.id = 'gameScreen';
            gameScreen.className = 'screen';
            gameScreen.innerHTML = `
                <div class="game-header">
                    <span id="playerNameDisplay"></span>
                    <span id="timer">0.000</span>
                </div>
                <div class="game-container">
                    <div class="tile-palette">
                        <h3>Available Tiles</h3>
                        <div class="tile-options">
                            <div class="tile-option" data-type="straight_rail">
                                <img src="pics/tiles/straight_rail.png" alt="Straight Rail">
                            </div>
                            <div class="tile-option" data-type="curve_rail">
                                <img src="pics/tiles/curve_rail.png" alt="Curve Rail">
                            </div>
                            <div class="tile-option selected" data-type="empty">
                                <img src="pics/tiles/empty.png" alt="Empty">
                            </div>
                        </div>
                    </div>
                    <div class="grid-container"></div>
                </div>
                <div class="game-controls">
                    <button id="menuBtn">Menu</button>
                    <button id="resetBtn">Reset</button>
                    <button id="checkSolutionBtn">Check Solution</button>
                    <button id="saveGameBtn">Save</button>
                    <button id="loadGameBtn">Load</button>
                </div>
                <div class="instructions">
                    <p>Left click: Place selected tile • Right click: Rotate tile</p>
                </div>
            `;
            document.body.appendChild(gameScreen);
            this.initTilePalette();
        }

        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });
        document.querySelector(`#${screenId}`).style.display = 'block';
    }

    static initTilePalette() {
        const tileOptions = document.querySelectorAll('.tile-option');
        tileOptions.forEach(tile => {
            tile.addEventListener('click', (e) => {
                tileOptions.forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                gameState.selectedTileType = e.currentTarget.dataset.type;
            });
        });
    }

    static updateCell(cell, type, rotation, isFixed = false) {
        cell.style.backgroundImage = `url('pics/tiles/${type}.png')`;
        cell.style.backgroundSize = 'cover';
        cell.style.transform = `rotate(${rotation}deg)`;
        cell.dataset.type = type;
        cell.dataset.rotation = rotation;
        cell.dataset.fixed = isFixed;

        if (isFixed) {
            cell.classList.add('fixed-tile');
        }
    }

    static createGrid() {
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = '';
        const gridSize = GAME_CONFIG[gameState.difficulty.toLowerCase()].gridSize;

        gridContainer.style.display = 'grid';

        gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;


        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('grid-cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
        
                cell.classList.add('grid-cell-hover');
        
                cell.addEventListener('click', (e) => GameController.handleCellClick(e));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    GameController.handleCellRightClick(e);
                });
        
                gridContainer.appendChild(cell);
            }
        }
    }

    static updatePlayerInfo() {
        document.querySelector('#playerNameDisplay').textContent = gameState.playerName;
        document.querySelector('#timer').textContent = '0.000';
    }
}

class GameController {
    static showMessage(message) {
        const messageContainer = document.querySelector('#messageContainer');
        const messageText = document.querySelector('#messageText');
        messageText.textContent = message;
        messageContainer.style.display = 'block';
        messageContainer.classList.add('show');

        setTimeout(() => {
            messageContainer.classList.remove('show');
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 500); 
        }, 3000);
    }
    static init() {
            const easyBtn = document.querySelector('#easyMode');
            const hardBtn = document.querySelector('#hardMode');
            const rulesBtn = document.querySelector('#rulesBtn');
            const startBtn = document.querySelector('#startBtn');
            const modal = document.querySelector('#rulesModal');
            const closeBtn = document.querySelector('.close-btn');
            const playerNameInput = document.querySelector('#playerName');

            let selectedDifficulty = 'easy';

            easyBtn.addEventListener('click', () => {
                easyBtn.classList.add('selected');
                hardBtn.classList.remove('selected');
                selectedDifficulty = 'easy';
            });

            hardBtn.addEventListener('click', () => {
                hardBtn.classList.add('selected');
                easyBtn.classList.remove('selected');
                selectedDifficulty = 'hard';
            });

            rulesBtn.addEventListener('click', () => {
                modal.style.display = 'block';
            });

            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });

            window.addEventListener('click', (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });

            startBtn.addEventListener('click', () => {
                const playerName = playerNameInput.value.trim();
                if (!playerName) {
                    GameController.showMessage('Please enter your name!');
                    return;
                }

                gameState.playerName = playerName;
                gameState.difficulty = selectedDifficulty;
                this.startGame();
            });

            document.querySelector('#menuBtn')?.addEventListener('click', () => this.returnToMenu());
            document.querySelector('#resetBtn')?.addEventListener('click', () => this.resetLevel());
            document.querySelector('#saveGameBtn')?.addEventListener('click', () => this.saveGame());
            document.querySelector('#loadGameBtn')?.addEventListener('click', () => this.loadGame());
            document.querySelector('#checkSolutionBtn')?.addEventListener('click', () => this.checkSolution());

            this.initDragAndDrop();
    }

    static initDragAndDrop() {
        const tileOptions = document.querySelectorAll('.tile-option');
        tileOptions.forEach(tile => {
            tile.setAttribute('draggable', true);
            tile.addEventListener('dragstart', (e) => {
                gameState.selectedTileType = e.currentTarget.dataset.type;
            });
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
    }

    static startGame() {
        console.log('Game started');
        const levelNumber = Math.floor(Math.random() * GAME_CONFIG[gameState.difficulty.toLowerCase()].levels) + 1;
        
        gameState.initializeGrid(gameState.difficulty, levelNumber);
        GameUI.showScreen('gameScreen');
        GameUI.updatePlayerInfo();
        GameUI.createGrid();
        this.loadLevel(gameState.difficulty, levelNumber);
        gameState.startTimer();
    }

    static returnToMenu() {
        gameState.resetGame();
        GameUI.showScreen('mainMenu');
    }

    static resetLevel() {
        if (confirm('Are you sure you want to reset the level?')) {
            gameState.stopTimer();
            gameState.elapsedTime = 0;
            this.loadLevel(gameState.difficulty, gameState.currentLevel);
            gameState.startTimer();
        }
    }

    static handleCellClick(event) {
        const cell = event.target;
        if (cell.dataset.fixed === 'true') return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const currentType = cell.dataset.type || 'empty';
        
        if (currentType === 'oasis') return;
        
        let nextType = gameState.selectedTileType;
        if (!nextType) {
            nextType = this.getNextTileType(currentType);
        }
        
        let rotation = parseInt(cell.dataset.rotation || 0);
        
        if (nextType === 'straight_rail' || nextType === 'curve_rail') {
            rotation = (rotation + 90) % 360;
        }
        
        GameUI.updateCell(cell, nextType, rotation, false);
        gameState.grid[row][col] = { type: nextType, rotation, isFixed: false };
    }

    static handleCellRightClick(event) {
        event.preventDefault();
        const cell = event.target;
        if (cell.dataset.fixed === 'true') return;
        
        const currentRotation = parseInt(cell.dataset.rotation || 0);
        const nextRotation = (currentRotation + 90) % 360;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const type = cell.dataset.type || 'empty';
        
        GameUI.updateCell(cell, type, nextRotation, false);
        gameState.grid[row][col].rotation = nextRotation;
    }

    static getNextTileType(currentType) {
        const transitions = {
            'empty': 'straight_rail',
            'straight_rail': 'curve_rail',
            'curve_rail': 'empty',
            'bridge': 'bridge_rail',
            'bridge_rail': 'bridge',
            'mountain': 'mountain_rail',
            'mountain_rail': 'mountain',
            'oasis': 'oasis'
        };
        return transitions[currentType];
    }

    static loadLevel(difficulty, levelNumber) {
        const gridSize = GAME_CONFIG[difficulty.toLowerCase()].gridSize;
        gameState.initializeGrid(difficulty, levelNumber);

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const cell = document.querySelector(`.grid-cell[data-row="${row}"][data-col="${col}"]`);
                if (cell) {
                    const rand = Math.random();
                    let type = 'empty';
                    let isFixed = false;
                    
                    if (rand < 0.1) {
                        type = 'mountain';
                        isFixed = true;
                    } else if (rand < 0.2) {
                        type = 'bridge';
                        isFixed = true;
                    } else if (rand < 0.3) {
                        type = 'oasis';
                        isFixed = true;
                    } else if (rand < 0.4) {
                        type = 'straight_rail';
                        isFixed = true;
                    } else if (rand < 0.5) {
                        type = 'curve_rail';
                        isFixed = true;
                    }
                    
                    GameUI.updateCell(cell, type, 0, isFixed);
                    gameState.grid[row][col] = { type, rotation: 0, isFixed };
                }
            }
        }
    }

    static validateRailNetwork() {
        const isRail = (cell) => {
            return cell.type === 'straight_rail' || cell.type === 'curve_rail' || 
                   cell.type === 'bridge_rail' || cell.type === 'mountain_rail';
        };
    
        const isConnected = (currentTile, nextTile) => {
            const currentConnections = TILE_CONNECTIONS[currentTile.type];
            const nextConnections = TILE_CONNECTIONS[nextTile.type];
    
            const rowDifference = Math.abs(currentTile.row - nextTile.row);
            const colDifference = Math.abs(currentTile.col - nextTile.col);
    
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    if (currentConnections[i] && nextConnections[j]) {
                        if (rowDifference === 1 && colDifference === 0 && (i + 2) % 4 === j) {
                            return true;
                        } else if (colDifference === 1 && rowDifference === 0 && (i + 1) % 4 === j) {
                            return true;
                        }
                    }
                }
            }
        }
    
         return false;
    };
        
    static checkSolution() {
        if (this.validateRailNetwork()) {
            gameState.stopTimer();
            GameController.showMessage('Congratulations! You\'ve completed the railway circuit!');
        } else {
            GameController.showMessage('The railway network is not valid. Make sure it forms a complete loop and reaches all required destinations!');
        }
    }

    static saveGame() {
        gameState.pauseTimer();
        const saveData = {
            grid: gameState.grid,
            playerName: gameState.playerName,
            difficulty: gameState.difficulty,
            elapsedTime: gameState.elapsedTime,
            currentLevel: gameState.currentLevel
        };
        localStorage.setItem('railwayPuzzleSave', JSON.stringify(saveData));
        GameController.showMessage('Game saved!');
        GameController.showGameSavedMessage();
    }

    static showGameSavedMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('game-saved-message');
        messageDiv.innerText = 'Game Saved';

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000); 
    }

    
    static loadGame() {
        const savedData = localStorage.getItem('railwayGameSave');
        if (savedData) {
            gameState.pauseTimer();
            if (confirm('Load saved game? Current progress will be lost.')) {
                const data = JSON.parse(savedData);
                gameState.grid = data.grid || [];
                gameState.playerName = data.playerName || '';
                gameState.difficulty = data.difficulty || 'normal'; 
                gameState.elapsedTime = data.elapsedTime || 0;
                gameState.currentLevel = data.currentLevel || 1;
    
                GameUI.showScreen('gameScreen');
                GameUI.updatePlayerInfo();
                GameUI.createGrid(); 
                this.loadLevel(gameState.difficulty, gameState.currentLevel);
                gameState.startTimer();
            }
        } else {
            GameController.showMessage('No saved game found!');
        }
    }
}

GameController.init();