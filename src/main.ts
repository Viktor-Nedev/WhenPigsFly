import { Game } from './Game';

new Game();

document.getElementById('start-btn')?.addEventListener('click', () => {
  const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
  window.dispatchEvent(startEvent);
});

document.getElementById('restart-btn')?.addEventListener('click', () => {
  const restartEvent = new KeyboardEvent('keydown', { code: 'Enter' });
  window.dispatchEvent(restartEvent);
});
