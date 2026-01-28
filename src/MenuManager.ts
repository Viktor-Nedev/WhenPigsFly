export class MenuManager {
    private game: any;
    private coins: number = 1000;
    private selectedPig: string = 'basic';
    private selectedWing: string = 'none';
    private selectedParticle: string = 'none';

    private pigs = [
        {
            id: 'basic',
            name: 'Basic Pig',
            icon: '🐷',
            speed: 5.0,
            agility: 3.0,
            luck: 2.0,
            owned: true,
            selected: true,
            color: '#ffadc7'
        },
        {
            id: 'speedy',
            name: 'Speedy Pig',
            icon: '🐖',
            speed: 7.0,
            agility: 4.0,
            luck: 1.0,
            owned: false,
            price: 500,
            color: '#ff6666'
        },
        {
            id: 'lucky',
            name: 'Lucky Pig',
            icon: '🐽',
            speed: 4.0,
            agility: 3.0,
            luck: 5.0,
            owned: false,
            price: 750,
            color: '#66ff66'
        },
        {
            id: 'rainbow',
            name: 'Rainbow Pig',
            icon: '🌈🐷',
            speed: 6.0,
            agility: 5.0,
            luck: 4.0,
            owned: false,
            price: 1500,
            color: '#ff66ff'
        },
        {
            id: 'cyber',
            name: 'Cyber Pig',
            icon: '🤖🐷',
            speed: 8.0,
            agility: 4.0,
            luck: 3.0,
            owned: false,
            price: 2000,
            color: '#6666ff'
        },
        {
            id: 'golden',
            name: 'Golden Pig',
            icon: '🐷✨',
            speed: 9.0,
            agility: 6.0,
            luck: 6.0,
            owned: false,
            price: 5000,
            color: '#ffd700'
        }
    ];


    private wings = [
        { id: 'none', name: 'No Wings', icon: '🚫', speed: 0, agility: 0, owned: true, selected: true },
        { id: 'angel', name: 'Angel Wings', icon: '👼', speed: 1, agility: 2, owned: false, price: 300 },
        { id: 'bat', name: 'Bat Wings', icon: '🦇', speed: 2, agility: 1, owned: false, price: 400 },
        { id: 'jet', name: 'Jet Wings', icon: '✈️', speed: 3, agility: 1, owned: false, price: 600 },
        { id: 'dragon', name: 'Dragon Wings', icon: '🐉', speed: 2, agility: 3, owned: false, price: 800 }
    ];


    private particles = [
        { id: 'none', name: 'No Particles', icon: '○', effect: 'None', owned: true, selected: true },
        { id: 'sparkles', name: 'Sparkles', icon: '✨', effect: 'Sparkle Trail', owned: false, price: 200 },
        { id: 'fire', name: 'Fire Trail', icon: '🔥', effect: 'Fire Trail', owned: false, price: 350 },
        { id: 'rainbow', name: 'Rainbow Trail', icon: '🌈', effect: 'Rainbow Trail', owned: false, price: 450 },
        { id: 'stars', name: 'Star Dust', icon: '⭐', effect: 'Star Trail', owned: false, price: 300 }
    ];

    constructor(game: any) {
        this.game = game;
        this.initMenu();
        this.loadGameData();
    }

    private initMenu(): void {

        const navButtons = ['home', 'locker', 'shop', 'chest', 'settings'];

        navButtons.forEach(buttonId => {
            const button = document.getElementById(`${buttonId}-btn`);
            if (button) {
                button.addEventListener('click', () => {
                    navButtons.forEach(id => {
                        const btn = document.getElementById(`${id}-btn`);
                        if (btn) btn.classList.remove('active');
                    });

                    button.classList.add('active');

                    this.showSubmenu(buttonId);
                });
            }
        });

        document.getElementById('menu-play-btn')?.addEventListener('click', () => this.startGame());

        document.querySelectorAll('.locker-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;

                document.querySelectorAll('.locker-tab').forEach(t => {
                    t.classList.remove('active');
                });

                document.querySelectorAll('.locker-tab-content').forEach(c => {
                    c.classList.remove('active');
                });

                target.classList.add('active');

                const tabId = target.dataset.tab!;
                const content = document.querySelector(`.locker-tab-content[data-tab="${tabId}"]`);
                if (content) content.classList.add('active');
            });
        });

        const volumeInput = document.getElementById('volume') as HTMLInputElement;
        const sfxInput = document.getElementById('sfx') as HTMLInputElement;

        if (volumeInput) {
            volumeInput.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                const volumeValue = document.getElementById('volume-value');
                if (volumeValue) volumeValue.textContent = `${value}%`;
            });
        }

        if (sfxInput) {
            sfxInput.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                const sfxValue = document.getElementById('sfx-value');
                if (sfxValue) sfxValue.textContent = `${value}%`;
            });
        }

        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-progress')?.addEventListener('click', () => this.resetProgress());

        document.querySelectorAll('.open-chest-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chestType = (e.target as HTMLElement).dataset.chest;
                if (chestType) this.openChest(chestType);
            });
        });
    }

    public showMenu(): void {
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('game-over')?.classList.add('hidden');
        document.getElementById('game-menu')?.classList.remove('hidden');


        this.updateStats();


        this.showSubmenu('home');


        this.loadLockerItems();
    }

    public hideMenu(): void {
        document.getElementById('game-menu')?.classList.add('hidden');
    }

    private showSubmenu(submenu: string): void {

        document.querySelectorAll('.submenu').forEach(menu => {
            menu.classList.remove('active');
        });


        const submenuElement = document.getElementById(`${submenu}-submenu`);
        if (submenuElement) {
            submenuElement.classList.add('active');
        }


        if (submenu === 'locker') {
            setTimeout(() => {
                this.loadLockerItems();
            }, 100);
        }
    }

    private switchLockerTab(tab: string): void {
        document.querySelectorAll('.locker-tab').forEach(t => {
            t.classList.remove('active');
        });

        document.querySelectorAll('.locker-tab-content').forEach(c => {
            c.classList.remove('active');
        });

        document.querySelector(`.locker-tab[data-tab="${tab}"]`)?.classList.add('active');

        document.querySelector(`.locker-tab-content[data-tab="${tab}"]`)?.classList.add('active');
    }

    private loadLockerItems(): void {
        const pigsGrid = document.getElementById('pigs-grid');
        if (pigsGrid) {
            pigsGrid.innerHTML = '';
            this.pigs.forEach(pig => {
                const item = this.createLockerItem(pig, 'pig');
                pigsGrid.appendChild(item);

                item.addEventListener('click', () => this.selectPig(pig.id));
            });
        }

        const wingsGrid = document.getElementById('wings-grid');
        if (wingsGrid) {
            wingsGrid.innerHTML = '';
            this.wings.forEach(wing => {
                const item = this.createLockerItem(wing, 'wing');
                wingsGrid.appendChild(item);

                item.addEventListener('click', () => this.selectWing(wing.id));
            });
        }


        const particlesGrid = document.getElementById('particles-grid');
        if (particlesGrid) {
            particlesGrid.innerHTML = '';
            this.particles.forEach(particle => {
                const item = this.createLockerItem(particle, 'particle');
                particlesGrid.appendChild(item);


                item.addEventListener('click', () => this.selectParticle(particle.id));
            });
        }
    }

    private createLockerItem(item: any, type: string): HTMLElement {
        const div = document.createElement('div');
        div.className = `locker-item ${item.selected ? 'selected' : ''}`;
        div.dataset.id = item.id;
        div.dataset.type = type;

        let status = '🔒 LOCKED';
        if (item.owned) {
            status = item.selected ? '⭐ SELECTED' : '✅ OWNED';
        }

        div.innerHTML = `
        <div class="item-icon">${item.icon}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-status ${item.owned ? 'owned' : 'locked'}">
            ${status}
        </div>
        ${!item.owned ? `<div class="item-price">${item.price}🪙</div>` : ''}
    `;


        div.addEventListener('click', () => {

            div.style.transform = 'scale(0.95)';
            setTimeout(() => {
                div.style.transform = '';
            }, 100);
        });

        return div;
    }

    private selectPig(pigId: string): void {
        const pig = this.pigs.find(p => p.id === pigId);
        if (!pig || !pig.owned) return;


        this.pigs.forEach(p => p.selected = false);
        pig.selected = true;
        this.selectedPig = pigId;


        this.updatePigDisplay();


        this.loadLockerItems();


        this.saveGameData();
    }

    private selectWing(wingId: string): void {
        const wing = this.wings.find(w => w.id === wingId);
        if (!wing || !wing.owned) return;


        this.wings.forEach(w => w.selected = false);
        wing.selected = true;
        this.selectedWing = wingId;


        this.loadLockerItems();


        this.saveGameData();
    }

    private selectParticle(particleId: string): void {
        const particle = this.particles.find(p => p.id === particleId);
        if (!particle || !particle.owned) return;


        this.particles.forEach(p => p.selected = false);
        particle.selected = true;
        this.selectedParticle = particleId;


        this.loadLockerItems();


        this.saveGameData();
    }


    private updatePigDisplay(): void {
        const pig = this.pigs.find(p => p.id === this.selectedPig);
        if (pig) {
            // Актуализира името
            const pigNameElement = document.getElementById('current-pig-name');
            if (pigNameElement) pigNameElement.textContent = pig.name;

            // Актуализира иконата на прасето с проста анимация
            const pigDisplayElement = document.getElementById('pig-display');
            if (pigDisplayElement) {
                pigDisplayElement.innerHTML = `<div class="pig-head">${pig.icon}</div>`;
            }

            // Актуализира бързите статистики
            const quickSpeedElement = document.getElementById('quick-speed');
            const quickLuckElement = document.getElementById('quick-luck');
            const quickScoreElement = document.getElementById('quick-score');

            if (quickSpeedElement) quickSpeedElement.textContent = pig.speed.toFixed(1);
            if (quickLuckElement) quickLuckElement.textContent = pig.luck.toFixed(1);

            // Взема общия резултат от localStorage
            const totalScore = localStorage.getItem('totalScore') || '0';
            if (quickScoreElement) quickScoreElement.textContent = totalScore;

            // Запазва избраното прасе
            localStorage.setItem('selectedPig', pig.id);
        }
    }

    // Актуализирайте updateStats метода:
    private updateStats(): void {
        // Актуализира статистиките в Home
        const totalScore = localStorage.getItem('totalScore') || '0';
        const totalDistance = localStorage.getItem('totalDistance') || '0';
        const obstaclesDodged = localStorage.getItem('obstaclesDodged') || '0';
        const playTime = localStorage.getItem('playTime') || '0:00';

        const totalScoreElement = document.getElementById('total-score');
        const totalDistanceElement = document.getElementById('total-distance');
        const obstaclesDodgedElement = document.getElementById('obstacles-dodged');
        const playTimeElement = document.getElementById('play-time');
        const coinsAmountElement = document.getElementById('coins-amount');

        if (totalScoreElement) totalScoreElement.textContent = totalScore;
        if (totalDistanceElement) totalDistanceElement.textContent = `${totalDistance}m`;
        if (obstaclesDodgedElement) obstaclesDodgedElement.textContent = obstaclesDodged;
        if (playTimeElement) playTimeElement.textContent = playTime;
        if (coinsAmountElement) coinsAmountElement.textContent = this.coins.toString();


        const quickScoreElement = document.getElementById('quick-score');
        if (quickScoreElement) quickScoreElement.textContent = totalScore;


        this.updateFlightsList();
    }

    private updateFlightsList(): void {
        const flightsList = document.getElementById('flights-list');
        if (!flightsList) return;

        const savedFlights = localStorage.getItem('recentFlights');
        if (!savedFlights) {
            flightsList.innerHTML = `
            <div class="flight-item">
                <span>No flights yet</span>
                <span>Start your first adventure!</span>
            </div>
        `;
            return;
        }

        try {
            const flights = JSON.parse(savedFlights);
            flightsList.innerHTML = '';

            flights.slice(0, 5).forEach((flight: any) => {
                const flightItem = document.createElement('div');
                flightItem.className = 'flight-item';
                flightItem.innerHTML = `
                <span>${flight.date}</span>
                <span>Score: ${flight.score} | Dist: ${flight.distance}m</span>
            `;
                flightsList.appendChild(flightItem);
            });
        } catch (e) {
            console.error('Error loading flights:', e);
        }
    }


    private openChest(chestType: string): void {
        let cost = 0;
        if (chestType === 'rare') {
            cost = 100;
            if (this.coins < cost) {
                alert('Not enough coins!');
                return;
            }
            this.coins -= cost;
        }


        const items = [...this.pigs, ...this.wings, ...this.particles];
        const availableItems = items.filter(item => !item.owned && item.id !== 'none');

        if (availableItems.length === 0) {
            alert('You already own all items!');
            if (cost > 0) this.coins += cost;
            return;
        }

        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];


        if (this.pigs.find(p => p.id === randomItem.id)) {
            const pig = this.pigs.find(p => p.id === randomItem.id);
            if (pig) pig.owned = true;
        } else if (this.wings.find(w => w.id === randomItem.id)) {
            const wing = this.wings.find(w => w.id === randomItem.id);
            if (wing) wing.owned = true;
        } else if (this.particles.find(p => p.id === randomItem.id)) {
            const particle = this.particles.find(p => p.id === randomItem.id);
            if (particle) particle.owned = true;
        }


        alert(`Congratulations! You got: ${randomItem.name}`);


        this.updateStats();
        this.loadLockerItems();
        this.saveGameData();
    }

    private saveSettings(): void {
        const volumeElement = document.getElementById('volume') as HTMLInputElement;
        const sfxElement = document.getElementById('sfx') as HTMLInputElement;
        const graphicsElement = document.getElementById('graphics') as HTMLSelectElement;
        const controlsElement = document.getElementById('controls') as HTMLSelectElement;

        const volume = volumeElement ? volumeElement.value : '70';
        const sfx = sfxElement ? sfxElement.value : '80';
        const graphics = graphicsElement ? graphicsElement.value : 'medium';
        const controls = controlsElement ? controlsElement.value : 'arrows';

        localStorage.setItem('volume', volume);
        localStorage.setItem('sfx', sfx);
        localStorage.setItem('graphics', graphics);
        localStorage.setItem('controls', controls);

        alert('Settings saved!');
    }

    private resetProgress(): void {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            localStorage.clear();
            this.coins = 1000;
            this.selectedPig = 'basic';
            this.selectedWing = 'none';
            this.selectedParticle = 'none';


            this.pigs.forEach(pig => {
                pig.owned = pig.id === 'basic';
                pig.selected = pig.id === 'basic';
            });

            this.wings.forEach(wing => {
                wing.owned = wing.id === 'none';
                wing.selected = wing.id === 'none';
            });

            this.particles.forEach(particle => {
                particle.owned = particle.id === 'none';
                particle.selected = particle.id === 'none';
            });

            this.updateStats();
            this.loadLockerItems();
            this.updatePigDisplay();
            alert('Progress reset!');
        }
    }

    private startGame(): void {

        this.hideMenu();


        if (this.game && typeof this.game.startGame === 'function') {
            this.game.startGame();
        } else {

            const startEvent = new KeyboardEvent('keydown', { code: 'Enter' });
            window.dispatchEvent(startEvent);
        }


        this.saveGameData();
    }

    private loadGameData(): void {
        const savedData = localStorage.getItem('pigGameData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.coins = data.coins || this.coins;
                this.selectedPig = data.selectedPig || this.selectedPig;
                this.selectedWing = data.selectedWing || this.selectedWing;
                this.selectedParticle = data.selectedParticle || this.selectedParticle;

                this.pigs.forEach(pig => {
                    if (data.pigsOwned?.includes(pig.id)) pig.owned = true;
                    pig.selected = pig.id === this.selectedPig;
                });

                this.wings.forEach(wing => {
                    if (data.wingsOwned?.includes(wing.id)) wing.owned = true;
                    wing.selected = wing.id === this.selectedWing;
                });

                this.particles.forEach(particle => {
                    if (data.particlesOwned?.includes(particle.id)) particle.owned = true;
                    particle.selected = particle.id === this.selectedParticle;
                });
            } catch (e) {
                console.error('Error loading game data:', e);
            }
        }

        this.updatePigDisplay();
    }

    private saveGameData(): void {
        const data = {
            coins: this.coins,
            selectedPig: this.selectedPig,
            selectedWing: this.selectedWing,
            selectedParticle: this.selectedParticle,
            pigsOwned: this.pigs.filter(p => p.owned).map(p => p.id),
            wingsOwned: this.wings.filter(w => w.owned).map(w => w.id),
            particlesOwned: this.particles.filter(p => p.owned).map(p => p.id)
        };

        localStorage.setItem('pigGameData', JSON.stringify(data));
    }


    public updateGameStats(score: number, distance: number): void {

        const totalScore = parseInt(localStorage.getItem('totalScore') || '0') + Math.floor(score);
        const totalDistance = parseInt(localStorage.getItem('totalDistance') || '0') + Math.floor(distance);
        const obstaclesDodged = parseInt(localStorage.getItem('obstaclesDodged') || '0') + Math.floor(score / 100);

        localStorage.setItem('totalScore', totalScore.toString());
        localStorage.setItem('totalDistance', totalDistance.toString());
        localStorage.setItem('obstaclesDodged', obstaclesDodged.toString());

        this.coins += Math.floor(score / 10);
        this.saveGameData();
    }
}