const Game2048 = {
  board: [],
  score: 0,
  bestScore: 0,
  gameOver: false,
  size: 4,

  init: function() {
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.loadBestScore();
    this.addRandomTile();
    this.addRandomTile();
    this.renderBoard();
    this.bindEvents();
    this.loadHelpText();
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

  addRandomTile: function() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) {
          emptyCells.push({ r, c });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[r][c] = Math.random() < 0.9 ? 2 : 4;
      return { r, c };
    }
    return null;
  },

  renderBoard: function() {
    const boardEl = document.getElementById('board');
    boardEl.innerHTML = '';
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.value = this.board[r][c];
        cell.textContent = this.board[r][c] || '';
        boardEl.appendChild(cell);
      }
    }
    document.getElementById('score').textContent = this.score;
    document.getElementById('bestScore').textContent = this.bestScore;
  },

  bindEvents: function() {
    let touchStartX, touchStartY;

    document.addEventListener('keydown', (e) => {
      if (this.gameOver) {
        this.init();
        return;
      }
      let moved = false;
      switch (e.key) {
        case 'ArrowUp': moved = this.moveUp(); break;
        case 'ArrowDown': moved = this.moveDown(); break;
        case 'ArrowLeft': moved = this.moveLeft(); break;
        case 'ArrowRight': moved = this.moveRight(); break;
      }
      if (moved) {
        e.preventDefault();
        this.addRandomTile();
        this.renderBoard();
        this.checkGameOver();
      }
    });

    const boardEl = document.getElementById('board');
    boardEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    boardEl.addEventListener('touchend', (e) => {
      if (this.gameOver) {
        this.init();
        return;
      }
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      const minSwipe = 30;

      let moved = false;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > minSwipe) moved = this.moveRight();
        else if (dx < -minSwipe) moved = this.moveLeft();
      } else {
        if (dy > minSwipe) moved = this.moveDown();
        else if (dy < -minSwipe) moved = this.moveUp();
      }

      if (moved) {
        e.preventDefault();
        this.addRandomTile();
        this.renderBoard();
        this.checkGameOver();
      }
    });

    const gameOverEl = document.getElementById('gameOver');
    gameOverEl.addEventListener('click', () => {
      this.init();
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
  },

  moveLeft: function() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const row = this.board[r].filter(v => v !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i + 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i + 1, 1);
        }
      }
      while (row.length < this.size) row.push(0);
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] !== row[c]) moved = true;
        this.board[r][c] = row[c];
      }
    }
    if (moved) this.saveBestScore();
    return moved;
  },

  moveRight: function() {
    let moved = false;
    for (let r = 0; r < this.size; r++) {
      const row = this.board[r].filter(v => v !== 0);
      for (let i = row.length - 1; i > 0; i--) {
        if (row[i] === row[i - 1]) {
          row[i] *= 2;
          this.score += row[i];
          row.splice(i - 1, 1);
          i--;
        }
      }
      while (row.length < this.size) row.unshift(0);
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] !== row[c]) moved = true;
        this.board[r][c] = row[c];
      }
    }
    if (moved) this.saveBestScore();
    return moved;
  },

  moveUp: function() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = [];
      for (let r = 0; r < this.size; r++) col.push(this.board[r][c]);
      const filtered = col.filter(v => v !== 0);
      for (let i = 0; i < filtered.length - 1; i++) {
        if (filtered[i] === filtered[i + 1]) {
          filtered[i] *= 2;
          this.score += filtered[i];
          filtered.splice(i + 1, 1);
        }
      }
      while (filtered.length < this.size) filtered.push(0);
      for (let r = 0; r < this.size; r++) {
        if (this.board[r][c] !== filtered[r]) moved = true;
        this.board[r][c] = filtered[r];
      }
    }
    if (moved) this.saveBestScore();
    return moved;
  },

  moveDown: function() {
    let moved = false;
    for (let c = 0; c < this.size; c++) {
      const col = [];
      for (let r = 0; r < this.size; r++) col.push(this.board[r][c]);
      const filtered = col.filter(v => v !== 0);
      for (let i = filtered.length - 1; i > 0; i--) {
        if (filtered[i] === filtered[i - 1]) {
          filtered[i] *= 2;
          this.score += filtered[i];
          filtered.splice(i - 1, 1);
          i--;
        }
      }
      while (filtered.length < this.size) filtered.unshift(0);
      for (let r = 0; r < this.size; r++) {
        if (this.board[r][c] !== filtered[r]) moved = true;
        this.board[r][c] = filtered[r];
      }
    }
    if (moved) this.saveBestScore();
    return moved;
  },

  checkGameOver: function() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 0) return;
        if (c < this.size - 1 && this.board[r][c] === this.board[r][c + 1]) return;
        if (r < this.size - 1 && this.board[r][c] === this.board[r + 1][c]) return;
      }
    }
    this.gameOver = true;
    document.getElementById('gameOver').classList.add('show');
  },

  loadHelpText: function(locale) {
    locale = locale || 'en';
    const helpTexts = {
      en: {
        title: 'How to Play',
        text: 'Use arrow keys or swipe to move tiles. When two tiles with the same number touch, they merge into one with their sum. Try to reach 2048!'
      },
      zh: {
        title: '如何玩',
        text: '使用方向键或滑动来移动方块。当两个相同数字的方块接触时，它们会合并成一个更大的数字。尝试达到2048！'
      }
    };
    const help = helpTexts[locale] || helpTexts.en;
    document.getElementById('helpTitle').textContent = help.title;
    document.getElementById('helpText').textContent = help.text;
  }
};

document.addEventListener('DOMContentLoaded', () => Game2048.init());
