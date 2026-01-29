
export class MenuAnimation {
    private startScreen: HTMLElement | null;
    private menu: HTMLElement | null;
    private mainStartBtn: HTMLElement | null;
    private menuPlayBtn: HTMLElement | null;
    private isAnimating: boolean = false;

    constructor() {
        this.startScreen = document.getElementById('main-start-screen');
        this.menu = document.getElementById('game-menu');
        this.mainStartBtn = document.getElementById('main-start-btn');
        this.menuPlayBtn = document.getElementById('menu-play-btn');

        this.init();
    }

    private init(): void {

        if (this.startScreen) {
            this.startScreen.style.opacity = '1';
            this.startScreen.style.visibility = 'visible';
            this.startScreen.style.display = 'flex';
            this.startScreen.classList.remove('hidden');
        }

        if (this.menu) {
            this.menu.style.opacity = '0';
            this.menu.style.visibility = 'hidden';
            this.menu.classList.add('hidden');
        }


        if (this.mainStartBtn) {
            this.mainStartBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }


        if (this.menuPlayBtn) {
            this.menuPlayBtn.addEventListener('click', () => {
                this.startGame();
            });
        }


        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.showMenuDirect();
            });
        }
    }

    public showMenu(): void {
        if (!this.startScreen || !this.menu || this.isAnimating) return;

        this.isAnimating = true;


        this.menu.classList.remove('hidden');
        this.menu.style.opacity = '1';
        this.menu.style.visibility = 'visible';
        this.menu.classList.add('menu-active');


        this.startScreen.style.transition = 'opacity 1s ease-in-out, transform 1s ease-in-out, filter 1s ease-in-out';
        this.startScreen.style.opacity = '0';
        this.startScreen.style.transform = 'scale(1.2)';
        this.startScreen.style.filter = 'blur(20px)';

        setTimeout(() => {
            if (this.startScreen) {
                this.startScreen.style.display = 'none';
                this.startScreen.classList.add('hidden');
            }
            this.isAnimating = false;

            if (window.menuManager) {
                window.menuManager.showMenu();
            }
        }, 1000);
    }

    public startGame(): void {
        if (!this.menu || this.isAnimating) return;

        this.isAnimating = true;
        this.menu.classList.remove('menu-active');
        this.menu.classList.add('menu-exit');

        setTimeout(() => {
            this.menu!.style.visibility = 'hidden';
            this.menu!.style.opacity = '0';
            this.menu!.classList.add('hidden');
            this.menu!.classList.remove('menu-exit');

            this.isAnimating = false;


            const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
            window.dispatchEvent(startEvent);

        }, 600);
    }

    public showGameOver(): void {
        setTimeout(() => {
            this.showMenuDirect();
        }, 1000);
    }

    public showMenuDirect(): void {
        if (this.startScreen) {
            this.startScreen.style.display = 'none';
            this.startScreen.classList.add('hidden');
        }
        if (this.menu) {
            this.menu.classList.remove('hidden', 'menu-exit');
            this.menu.style.visibility = 'visible';
            this.menu.style.opacity = '1';
            this.menu.classList.add('menu-active');
            if (window.menuManager) {
                window.menuManager.showMenu();
            }
        }
    }
}