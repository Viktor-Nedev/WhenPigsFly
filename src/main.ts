
import { Game } from './Game';

declare global {
  interface Window {
    menuManager?: any;
    menuAnimation?: any;
  }
}

const game = new Game();

const loadMenuCSS = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'menu.css';
  document.head.appendChild(link);
};

document.addEventListener('DOMContentLoaded', () => {
  loadMenuCSS();

  import('./MenuManager').then(module => {
    const MenuManager = module.MenuManager;
    const menuManager = new MenuManager(game);
    window.menuManager = menuManager;
  }).catch(err => {
    console.error('Failed to load MenuManager:', err);
  });


  import('./menu').then(module => {
    const MenuAnimation = module.MenuAnimation;
    const menuAnimation = new MenuAnimation();
    window.menuAnimation = menuAnimation;
  }).catch(err => {
    console.error('Failed to load MenuAnimation:', err);
    createFallbackMenuAnimation();
  });
});


function createFallbackMenuAnimation() {
  class FallbackMenuAnimation {
    constructor() {
      this.init();
    }

    init() {
      const startBtn = document.getElementById('main-start-btn');
      const menuPlayBtn = document.getElementById('menu-play-btn');
      const restartBtn = document.getElementById('restart-btn');

      if (startBtn) {
        startBtn.addEventListener('click', () => this.showMenu());
      }

      if (menuPlayBtn) {
        menuPlayBtn.addEventListener('click', () => this.startGame());
      }

      if (restartBtn) {
        restartBtn.addEventListener('click', () => this.showMenu());
      }
    }

    showMenu() {
      const startScreen = document.getElementById('main-start-screen');
      const menu = document.getElementById('game-menu');

      if (startScreen) startScreen.classList.add('hidden');
      if (menu) menu.classList.remove('hidden');

      if (window.menuManager) {
        window.menuManager.showMenu();
      }
    }

    startGame() {
      const menu = document.getElementById('game-menu');
      if (menu) menu.classList.add('hidden');

      const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
      window.dispatchEvent(startEvent);
    }
  }

  window.menuAnimation = new FallbackMenuAnimation();
}

document.getElementById('start-btn')?.addEventListener('click', () => {
  const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
  window.dispatchEvent(startEvent);
});


document.getElementById('restart-btn')?.addEventListener('click', () => {
  if (window.menuAnimation) {
    const gameOver = document.getElementById('game-over');
    if (gameOver) gameOver.classList.add('hidden');
    window.menuAnimation.showMenu();
  } else {
    const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
    window.dispatchEvent(startEvent);
  }
});


export { game };