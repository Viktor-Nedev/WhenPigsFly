
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
        // Уверете се, че стартовия екран е видим, а менюто е скрито
        if (this.startScreen) {
            this.startScreen.style.opacity = '1';
            this.startScreen.style.visibility = 'visible';
            this.startScreen.style.transform = 'translateY(0) scale(1)';
            this.startScreen.classList.remove('hidden', 'start-slide-out', 'menu-slide-out');
            this.startScreen.classList.add('start-slide-in');
        }

        if (this.menu) {
            this.menu.style.opacity = '0';
            this.menu.style.visibility = 'hidden';
            this.menu.style.transform = 'translateX(100px) scale(0.95)';
            this.menu.classList.remove('hidden', 'menu-slide-in', 'start-slide-in');
            this.menu.classList.add('menu-slide-out');
        }

        // Main start button click
        if (this.mainStartBtn) {
            this.mainStartBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }

        // Menu play button click
        if (this.menuPlayBtn) {
            this.menuPlayBtn.addEventListener('click', () => {
                this.startGame();
            });
        }

        // Restart button from game over
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.showMenu();
            });
        }
    }

    public showMenu(): void {
        if (!this.startScreen || !this.menu || this.isAnimating) return;

        this.isAnimating = true;

        // 1. Анимираме изчезването на стартовия екран
        this.startScreen.classList.remove('start-slide-in');
        this.startScreen.classList.add('start-slide-out');

        // 2. След края на анимацията, скриваме стартовия екран и показваме менюто
        setTimeout(() => {
            // Скриваме стартовия екран
            this.startScreen!.style.visibility = 'hidden';
            this.startScreen!.style.opacity = '0';

            // Показваме менюто
            this.menu!.style.visibility = 'visible';
            this.menu!.style.opacity = '1';
            this.menu!.classList.remove('hidden', 'menu-slide-out');


            setTimeout(() => {
                this.menu!.classList.add('menu-slide-in');


                setTimeout(() => {
                    this.isAnimating = false;


                    if (window.menuManager) {
                        window.menuManager.showMenu();
                    }
                }, 600);

            }, 10);

        }, 600);
    }

    public startGame(): void {
        if (!this.menu || this.isAnimating) return;

        this.isAnimating = true;


        this.menu.classList.remove('menu-slide-in');
        this.menu.classList.add('menu-slide-out');


        setTimeout(() => {
            this.menu!.style.visibility = 'hidden';
            this.menu!.style.opacity = '0';

            this.isAnimating = false;


            const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
            window.dispatchEvent(startEvent);

        }, 600);
    }

    public showGameOver(): void {

        setTimeout(() => {
            this.showMenu();
        }, 1000);
    }


    public showMenuDirect(): void {
        if (this.startScreen) {
            this.startScreen.classList.add('hidden');
        }
        if (this.menu) {
            this.menu.classList.remove('hidden');
            if (window.menuManager) {
                window.menuManager.showMenu();
            }
        }
    }
}