import { MenuRenderer } from './MenuRenderer';

export class MenuManager {
    private menuRenderer: MenuRenderer | null = null;
    private game: any;
    private coins: number = 5000;
    private selectedPig: string = 'basic';
    private selectedWing: string = 'none';
    private selectedParticle: string = 'none';

    private pigs = [
        { id: 'basic', name: 'Original Pig', model: '/pig.glb', icon: '/images/shop/pixelpig.png', speed: 5.0, agility: 3.0, luck: 2.0, owned: true, selected: true, color: '#ffadc7' },
        { id: 'cute_stylized', name: 'Mud Pig', model: '/assets/3D_Models/Pigs/cute_stylized_pig_low_poly_game_ready.glb', icon: '/images/shop/mudpig.png', speed: 5.2, agility: 3.5, luck: 2.0, owned: false, price: 100 },
        { id: 'elegant', name: 'Elegant Pig', model: '/assets/3D_Models/Pigs/elegant_pig.glb', icon: '/images/shop/elegant_minecraft_pig.png', speed: 5.5, agility: 3.2, luck: 2.5, owned: false, price: 300 },
        { id: 'foreman', name: 'Foreman Pig', model: '/assets/3D_Models/Pigs/foreman_pig.glb', icon: '/images/shop/foreman.png', speed: 5.0, agility: 3.0, luck: 4.0, owned: false, price: 500 },
        { id: 'hamm', name: 'Toy Hamm', model: '/assets/3D_Models/Pigs/kingdom_hearts_iii_-_hamm.glb', icon: '/images/shop/hamm.png', speed: 5.0, agility: 4.0, luck: 3.0, owned: false, price: 400 },
        { id: 'lowpoly', name: 'Pixel Pig', model: '/assets/3D_Models/Pigs/low-poly_pig.glb', icon: '/images/shop/pixelpig.png', speed: 5.8, agility: 4.5, luck: 2.0, owned: false, price: 200 },
        { id: 'minecraft', name: 'Minecraft Pig', model: '/assets/3D_Models/Pigs/minecraft_-_pig.glb', icon: '/images/shop/minecraftpig.png', speed: 5.0, agility: 3.0, luck: 2.0, owned: false, price: 300 },
        { id: 'king_pig', name: 'King Pig', model: '/assets/3D_Models/Pigs/mobile_-_angry_birds_go_-_king_pig.glb', icon: '/images/shop/kingpig.png', speed: 4.0, agility: 2.0, luck: 8.0, owned: false, price: 500 },
        { id: 'waddles', name: 'Mr. Waddles', model: '/assets/3D_Models/Pigs/mr_waddles_gravity_falls.glb', icon: '/images/shop/mrwaddles.png', speed: 5.0, agility: 5.0, luck: 5.0, owned: false, price: 500 },
        { id: 'muddy', name: 'Durty Pig', model: '/assets/3D_Models/Pigs/muddy_pig.glb', icon: '/images/shop/durtyminecraftpig.png', speed: 5.2, agility: 3.2, luck: 3.5, owned: false, price: 500 },
        { id: 'peppa', name: 'Peppa Pig', model: '/assets/3D_Models/Pigs/peppa_pig_with_2d_look.glb', icon: '/images/shop/peppapig.png', speed: 5.0, agility: 4.0, luck: 2.0, owned: false, price: 1000 },
        { id: 'crown', name: 'Technoblade', model: '/assets/3D_Models/Pigs/pig_with_crown.glb', icon: '/images/shop/technoblade.png', speed: 6.0, agility: 3.5, luck: 6.0, owned: false, price: 800 },
        { id: 'piglet', name: 'Piglet', model: '/assets/3D_Models/Pigs/piglet.glb', icon: '/images/shop/piglet.png', speed: 7.0, agility: 5.5, luck: 1.0, owned: false, price: 1000 },
        { id: 'porky', name: 'Porky Pig', model: '/assets/3D_Models/Pigs/porky_pig.glb', icon: '/images/shop/porky.png', speed: 5.8, agility: 4.2, luck: 3.0, owned: false, price: 1000 },
        { id: 'pumba', name: 'Pumba', model: '/assets/3D_Models/Pigs/pumba.glb', icon: '/images/shop/pumba.png', speed: 4.5, agility: 2.5, luck: 4.5, owned: false, price: 1000 },
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

        try {
            this.menuRenderer = new MenuRenderer('pig-display');
            this.updatePigDisplay();
        } catch (e) {
            console.error('MenuRenderer init failed:', e);
        }
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
                const target = e.currentTarget as HTMLElement;
                document.querySelectorAll('.locker-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.locker-tab-content').forEach(c => c.classList.remove('active'));
                target.classList.add('active');
                const tabId = target.dataset.tab!;
                const content = document.querySelector(`.locker-tab-content[data-tab="${tabId}"]`);
                if (content) content.classList.add('active');
            });
        });

        document.querySelectorAll('.shop-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.shop-tab-content').forEach(c => c.classList.remove('active'));
                target.classList.add('active');
                const tabId = target.dataset.tab!;
                const content = document.querySelector(`.shop-tab-content[data-tab="${tabId}"]`);
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
        document.getElementById('main-start-screen')?.classList.add('hidden');
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
            setTimeout(() => this.loadLockerItems(), 100);
        } else if (submenu === 'shop') {
            setTimeout(() => this.loadShopItems(), 100);
        }
    }

    private loadLockerItems(): void {
        const pigsGrid = document.getElementById('pigs-grid');
        if (pigsGrid) {
            pigsGrid.innerHTML = '';
            this.pigs.filter(p => p.owned).forEach(pig => {
                const item = this.createLockerItem(pig, 'pig');
                pigsGrid.appendChild(item);
                item.addEventListener('click', () => this.selectPig(pig.id));
            });
        }

        const wingsGrid = document.getElementById('wings-grid');
        if (wingsGrid) {
            wingsGrid.innerHTML = '';
            this.wings.filter(w => w.owned).forEach(wing => {
                const item = this.createLockerItem(wing, 'wing');
                wingsGrid.appendChild(item);
                item.addEventListener('click', () => this.selectWing(wing.id));
            });
        }

        const particlesGrid = document.getElementById('particles-grid');
        if (particlesGrid) {
            particlesGrid.innerHTML = '';
            this.particles.filter(p => p.owned).forEach(particle => {
                const item = this.createLockerItem(particle, 'particle');
                particlesGrid.appendChild(item);
                item.addEventListener('click', () => this.selectParticle(particle.id));
            });
        }
    }

    private loadShopItems(): void {
        const shopPigsGrid = document.getElementById('locked-pigs-grid');
        if (shopPigsGrid) {
            shopPigsGrid.innerHTML = '';
            const unownedPigs = this.pigs.filter(p => !p.owned);

            if (unownedPigs.length === 0) {
                shopPigsGrid.innerHTML = `
                    <div class="all-owned-celebration">
                        Wow, you now got all the pigs! 
                    </div>
                `;
            } else {
                unownedPigs.forEach(pig => {
                    const item = this.createShopItem(pig, 'pig');
                    shopPigsGrid.appendChild(item);
                    item.addEventListener('click', () => this.buyPig(pig.id));
                });
            }
        }
    }

    private createLockerItem(item: any, type: string): HTMLElement {
        const div = document.createElement('div');
        div.className = `locker-item ${item.selected ? 'selected' : ''}`;
        div.dataset.id = item.id;
        div.dataset.type = type;

        let status = item.selected ? 'SELECTED' : 'OWNED';

        const iconHtml = (typeof item.icon === 'string' && item.icon.startsWith('/'))
            ? `<img src="${item.icon}" class="pig-icon-img" alt="${item.name}">`
            : item.icon;

        div.innerHTML = `
            <div class="item-icon">${iconHtml}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-status owned">${status}</div>
        `;

        div.addEventListener('click', () => {
            div.style.transform = 'scale(0.95)';
            setTimeout(() => { div.style.transform = ''; }, 100);
        });

        return div;
    }

    private createShopItem(item: any, type: string): HTMLElement {
        const div = document.createElement('div');
        div.className = 'locker-item shop-item';
        div.dataset.id = item.id;
        div.dataset.type = type;

        const iconHtml = (typeof item.icon === 'string' && item.icon.startsWith('/'))
            ? `<img src="${item.icon}" class="pig-icon-img" alt="${item.name}">`
            : item.icon;

        div.innerHTML = `
            <div class="item-icon">${iconHtml}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.price}🪙</div>
            <button class="buy-btn" data-id="${item.id}">BUY</button>
        `;

        return div;
    }

    private buyPig(pigId: string): void {
        const pig = this.pigs.find(p => p.id === pigId);
        if (!pig || pig.owned) return;

        const price = (pig.price !== undefined) ? pig.price : 200;

        if (this.coins >= price) {
            this.coins -= price;
            pig.owned = true;
            this.updateStats();
            this.loadShopItems();
            this.saveGameData();
        } else {
            this.showInsufficientFundsModal();
        }
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
            const pigNameElement = document.getElementById('current-pig-name');
            if (pigNameElement) pigNameElement.textContent = pig.name;

            if (this.menuRenderer && pig.model) {
                this.menuRenderer.loadModel(pig.model);
            } else {
                const pigDisplayElement = document.getElementById('pig-display');
                if (pigDisplayElement) {
                    pigDisplayElement.innerHTML = `<div class="pig-head">${pig.icon}</div>`;
                }
            }

            const quickSpeedElement = document.getElementById('quick-speed');
            const quickLuckElement = document.getElementById('quick-luck');
            const quickScoreElement = document.getElementById('quick-score');

            if (quickSpeedElement) quickSpeedElement.textContent = pig.speed.toFixed(1);
            if (quickLuckElement) quickLuckElement.textContent = pig.luck.toFixed(1);

            const totalScore = localStorage.getItem('totalScore') || '0';
            if (quickScoreElement) quickScoreElement.textContent = totalScore;

            localStorage.setItem('selectedPig', pig.id);
        }
    }

    private updateStats(): void {
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
            flightsList.innerHTML = `<div class="flight-item"><span>No flights yet</span><span>Start your first adventure!</span></div>`;
            return;
        }

        try {
            const flights = JSON.parse(savedFlights);
            flightsList.innerHTML = '';
            flights.slice(0, 5).forEach((flight: any) => {
                const flightItem = document.createElement('div');
                flightItem.className = 'flight-item';
                flightItem.innerHTML = `<span>${flight.date}</span><span>Score: ${flight.score} | Dist: ${flight.distance}m</span>`;
                flightsList.appendChild(flightItem);
            });
        } catch (e) {
            console.error('Error loading flights:', e);
        }
    }

    private openChest(chestType: string): void {
        let cost = (chestType === 'rare') ? 100 : 0;
        if (this.coins < cost) {
            this.showInsufficientFundsModal();
            return;
        }
        this.coins -= cost;

        const items = [...this.pigs, ...this.wings, ...this.particles];
        const availableItems = items.filter(item => !item.owned && item.id !== 'none');

        if (availableItems.length === 0) {
            alert('You already own all items!');
            this.coins += cost;
            return;
        }

        const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];

        const pig = this.pigs.find(p => p.id === randomItem.id);
        const wing = this.wings.find(w => w.id === randomItem.id);
        const particle = this.particles.find(p => p.id === randomItem.id);

        if (pig) pig.owned = true;
        else if (wing) wing.owned = true;
        else if (particle) particle.owned = true;

        alert(`Congratulations! You got: ${randomItem.name}`);
        this.updateStats();
        this.loadLockerItems();
        this.saveGameData();
    }

    private saveSettings(): void {
        const volume = (document.getElementById('volume') as HTMLInputElement)?.value || '70';
        const sfx = (document.getElementById('sfx') as HTMLInputElement)?.value || '80';
        const graphics = (document.getElementById('graphics') as HTMLSelectElement)?.value || 'medium';
        const controls = (document.getElementById('controls') as HTMLSelectElement)?.value || 'arrows';

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

    private showInsufficientFundsModal(): void {
        const modal = document.getElementById('insufficient-funds-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const closeBtn = document.getElementById('funds-modal-close');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    modal.classList.add('hidden');
                };
            }
        }
    }
}