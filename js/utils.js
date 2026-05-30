const Game2048 = {
  grid: [],
  score: 0,
  bestScore: 0,
  gameOver: false,
  gameWon: false,
  continueAfterWin: false,
  gridSize: 4,
  gap: 15,
  tiles: [],
  touchStartX: 0,
  touchStartY: 0,
  isAnimating: false,

  init: function() {
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.continueAfterWin = false;
    this.tiles = [];
    this.loadBestScore();
    this.createGrid();
    this.bindEvents();
    this.loadHelpText();
    this.loadGames();
    this.startNewGame();
  },

  loadBestScore: function() {
    const saved = localStorage.getItem('2048-best-score');
    this.bestScore = saved ? parseInt(saved) : 0;
    document.getElementById('bestScore').textContent = this.bestScore;
  },

  saveBestScore: function() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('2048-best-score', this.bestScore);
      document.getElementById('bestScore').textContent = this.bestScore;
    }
  },

  createGrid: function() {
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';
    for (let i = 0; i < this.gridSize * this.gridSize; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      gridContainer.appendChild(cell);
    }
  },

  startNewGame: function() {
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.continueAfterWin = false;
    this.tiles = [];
    this.updateScore();
    this.clearTiles();
    this.addRandomTile();
    this.addRandomTile();
    this.renderTiles();
    document.getElementById('gameOver').classList.remove('show');
    document.getElementById('winScreen').classList.remove('show');
  },

  clearTiles: function() {
    const tileContainer = document.getElementById('tileContainer');
    tileContainer.innerHTML = '';
  },

  addRandomTile: function() {
    const emptyCells = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
      this.tiles.push({ r, c, value: this.grid[r][c], isNew: true, merged: false });
    }
  },

  renderTiles: function() {
    const tileContainer = document.getElementById('tileContainer');
    const board = document.getElementById('board');
    const boardSize = board.offsetWidth - 30;
    const tileSize = (boardSize - (this.gap * (this.gridSize - 1))) / this.gridSize;

    tileContainer.innerHTML = '';

    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] !== 0) {
          const tile = document.createElement('div');
          const value = this.grid[r][c];
          const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
          tile.className = `tile ${tileClass}`;

          const tileData = this.tiles.find(t => t.r === r && t.c === c);
          if (tileData && tileData.isNew) {
            tile.classList.add('new');
            tileData.isNew = false;
          }
          if (tileData && tileData.merged) {
            tile.classList.add('merged');
            tileData.merged = false;
          }

          tile.style.width = `${tileSize}px`;
          tile.style.height = `${tileSize}px`;
          tile.style.left = `${c * (tileSize + this.gap)}px`;
          tile.style.top = `${r * (tileSize + this.gap)}px`;
          tile.style.fontSize = value >= 1000 ? `${tileSize * 0.35}px` : `${tileSize * 0.5}px`;
          tile.textContent = value;
          tileContainer.appendChild(tile);
        }
      }
    }
  },

  move: function(direction) {
    if (this.gameOver || (this.gameWon && !this.continueAfterWin)) return;

    let moved = false;
    const newGrid = this.grid.map(row => [...row]);
    this.tiles = [];

    const vectors = {
      up: { r: -1, c: 0 },
      down: { r: 1, c: 0 },
      left: { r: 0, c: -1 },
      right: { r: 0, c: 1 }
    };

    const vector = vectors[direction];
    const traversals = this.buildTraversals(vector);

    traversals.r.forEach(r => {
      traversals.c.forEach(c => {
        const value = newGrid[r][c];
        if (value !== 0) {
          const { farthest, next } = this.findFarthestPosition(newGrid, r, c, vector);

          if (next && newGrid[next.r][next.c] === value && !this.isMerged(newGrid, next.r, next.c)) {
            const merged = value * 2;
            newGrid[next.r][next.c] = merged;
            newGrid[r][c] = 0;
            this.score += merged;
            this.tiles.push({ r: next.r, c: next.c, value: merged, isNew: false, merged: true });

            if (merged === 2048 && !this.gameWon) {
              this.gameWon = true;
            }
            moved = true;
          } else if (farthest.r !== r || farthest.c !== c) {
            newGrid[farthest.r][farthest.c] = value;
            newGrid[r][c] = 0;
            this.tiles.push({ r: farthest.r, c: farthest.c, value, isNew: false, merged: false });
            moved = true;
          } else {
            this.tiles.push({ r, c, value, isNew: false, merged: false });
          }
        }
      });
    });

    if (moved) {
      this.grid = newGrid;
      this.addRandomTile();
      this.updateScore();
      this.renderTiles();
      this.saveBestScore();

      if (this.gameWon && !this.continueAfterWin) {
        this.showWinScreen();
      } else if (this.isGameOver()) {
        this.gameOver = true;
        this.showGameOver();
      }
    }
  },

  buildTraversals: function(vector) {
    const traversals = { r: [], c: [] };
    for (let i = 0; i < this.gridSize; i++) {
      traversals.r.push(i);
      traversals.c.push(i);
    }
    if (vector.r === 1) traversals.r.reverse();
    if (vector.c === 1) traversals.c.reverse();
    return traversals;
  },

  findFarthestPosition: function(grid, r, c, vector) {
    let previous;
    do {
      previous = { r, c };
      r += vector.r;
      c += vector.c;
    } while (this.withinBounds(r, c) && grid[r][c] === 0);

    return {
      farthest: previous,
      next: this.withinBounds(r, c) ? { r, c } : null
    };
  },

  withinBounds: function(r, c) {
    return r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize;
  },

  isMerged: function(grid, r, c) {
    return this.tiles.some(t => t.r === r && t.c === c && t.merged);
  },

  isGameOver: function() {
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        if (this.grid[r][c] === 0) return false;
        if (c < this.gridSize - 1 && this.grid[r][c] === this.grid[r][c + 1]) return false;
        if (r < this.gridSize - 1 && this.grid[r][c] === this.grid[r + 1][c]) return false;
      }
    }
    return true;
  },

  updateScore: function() {
    document.getElementById('score').textContent = this.score;
  },

  showGameOver: function() {
    document.getElementById('finalScore').textContent = `Score: ${this.score}`;
    document.getElementById('gameOver').classList.add('show');
  },

  showWinScreen: function() {
    document.getElementById('winScore').textContent = `Score: ${this.score}`;
    document.getElementById('winScreen').classList.add('show');
  },

  bindEvents: function() {
    document.addEventListener('keydown', (e) => {
      const keyMap = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right'
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        this.move(keyMap[e.key]);
      }

      if ((e.key === 'Enter' || e.key === ' ') && (this.gameOver || (this.gameWon && !this.continueAfterWin))) {
        e.preventDefault();
        if (this.gameWon && !this.continueAfterWin) {
          this.continueAfterWin = true;
          document.getElementById('winScreen').classList.remove('show');
        } else {
          this.startNewGame();
        }
      }
    });

    const board = document.getElementById('board');

    board.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }, { passive: false });

    board.addEventListener('touchend', (e) => {
      e.preventDefault();
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - this.touchStartX;
      const deltaY = touchEndY - this.touchStartY;

      if (Math.abs(deltaX) < 30 && Math.abs(deltaY) < 30) {
        if (this.gameOver) {
          this.startNewGame();
        } else if (this.gameWon && !this.continueAfterWin) {
          this.continueAfterWin = true;
          document.getElementById('winScreen').classList.remove('show');
        }
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        this.move(deltaX > 0 ? 'right' : 'left');
      } else {
        this.move(deltaY > 0 ? 'down' : 'up');
      }
    }, { passive: false });

    board.addEventListener('click', () => {
      if (this.gameOver) {
        this.startNewGame();
      } else if (this.gameWon && !this.continueAfterWin) {
        this.continueAfterWin = true;
        document.getElementById('winScreen').classList.remove('show');
      }
    });

    const helpBtn = document.getElementById('helpBtn');
    const helpDropdown = document.getElementById('helpDropdown');
    helpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      helpDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      helpDropdown.classList.remove('show');
    });

    helpDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    document.getElementById('localeSelect').addEventListener('change', (e) => {
      this.loadHelpText(e.target.value);
    });

    // Games dropdown
    const gamesBtn = document.getElementById('gamesBtn');
    const gamesDropdown = document.getElementById('gamesDropdown');
    gamesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      gamesDropdown.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      gamesDropdown.classList.remove('show');
    });

    gamesDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    window.addEventListener('resize', () => {
      this.renderTiles();
    });
  },

  loadHelpText: function(locale) {
    locale = locale || 'en';
    const helpTexts = {
      en: {
        title: 'How to Play',
        text: 'Use Arrow Keys or swipe to move tiles. When two tiles with the same number touch, they merge into one with their sum. Try to reach 2048!'
      },
      zh: {
        title: '如何玩',
        text: '使用方向键或滑动来移动方块。当两个相同数字的方块接触时，它们会合并成一个更大的数字。尝试达到 2048！'
      }
    };
    const help = helpTexts[locale] || helpTexts.en;
    document.getElementById('helpTitle').textContent = help.title;
    document.getElementById('helpText').textContent = help.text;

    const labels = {
      en: {
        score: 'Score',
        best: 'Best',
        gameOver: 'Game Over!',
        tryAgain: 'Tap to restart',
        youWin: 'You Win!',
        continue: 'Tap to continue'
      },
      zh: {
        score: '分数',
        best: '最高',
        gameOver: '游戏结束!',
        tryAgain: '点击重新开始',
        youWin: '你赢了!',
        continue: '点击继续'
      }
    };
    const l = labels[locale] || labels.en;
    document.getElementById('scoreLabel').textContent = l.score;
    document.getElementById('bestLabel').textContent = l.best;
    document.getElementById('gameOverTitle').textContent = l.gameOver;
    document.getElementById('tryAgain').textContent = l.tryAgain;
    document.getElementById('winTitle').textContent = l.youWin;
    document.getElementById('continueText').textContent = l.continue;
  },

  loadGames: function() {
    fetch('https://zihaohong.github.io/data/links/games.json')
    .then(response => response.json())
    .then(data => {
      const locale = document.getElementById('localeSelect').value;
      const items = data[locale] || data.en || {};
      const currentPath = window.location.pathname;
      const dropdown = document.getElementById('gamesDropdown');
      dropdown.innerHTML = Object.entries(items).map(([title, params]) => {
        const isCurrent = currentPath.includes(params.url.replace('https://zihaohong.github.io/', ''));
        return `<a href="${params.url}" class="${isCurrent ? 'current' : ''}">${title}</a>`;
      }).join('');
    })
    .catch(error => console.error('Error loading games:', error));
  }
};

document.addEventListener('DOMContentLoaded', () => Game2048.init());
