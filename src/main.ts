
import { Game } from './Game';
import { audioManager } from './audio';

declare global {
  interface Window {
    menuManager?: any;
    menuAnimation?: any;
  }
}

const game = new Game();

const registerGlobalButtonSounds = () => {
  const handler = (event: MouseEvent) => {
    const clicked = event.target as HTMLElement | null;
    const button = clicked?.closest('button');
    if (!button) return;
    if (button.dataset.sound === 'start') {
      audioManager.playStartClick();
      return;
    }
    if (button.dataset.sound === 'none') {
      return;
    }
    audioManager.playButtonClick();
  };
  document.body.addEventListener('click', handler, { capture: true });
};

const loadMenuCSS = () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'menu.css';
  document.head.appendChild(link);
};

document.addEventListener('DOMContentLoaded', () => {
  loadMenuCSS();

  registerGlobalButtonSounds();
  audioManager.playBackgroundMusic();

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
      const playAgainBtn = document.getElementById('play-again-btn');
      const menuBtn = document.getElementById('menu-btn');

      if (startBtn) {
        startBtn.addEventListener('click', () => this.showMenu());
      }

      if (menuPlayBtn) {
        menuPlayBtn.addEventListener('click', () => this.startGame());
      }

      if (menuBtn) {
        menuBtn.addEventListener('click', () => this.showMenu());
      }

      if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => this.startGame());
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


document.getElementById('menu-btn')?.addEventListener('click', () => {
  if (window.menuAnimation) {
    const gameOver = document.getElementById('game-over');
    if (gameOver) gameOver.classList.add('hidden');
    window.menuAnimation.showMenu();
  }
});

document.getElementById('play-again-btn')?.addEventListener('click', () => {
  const gameOver = document.getElementById('game-over');
  if (gameOver) gameOver.classList.add('hidden');
  const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
  window.dispatchEvent(startEvent);
});


export { game };
