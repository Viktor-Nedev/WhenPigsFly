import { MenuRenderer } from './MenuRenderer';
import { audioManager } from './audio';

export class MenuManager {
    private menuRenderer: MenuRenderer | null = null;
    private game: any;
    private coins: number = 5000;
    private selectedPig: string = 'minecraft';
    private selectedWing: string = 'none';
    private selectedParticle: string = 'none';
    private pigBankClicks: number = 0;
    private pigBankStage: number = 0;
    private pigBankBusy: boolean = false;
    private pigBankCardEl: HTMLElement | null = null;
    private pigBankRewardEl: HTMLElement | null = null;
    private pigBankUnlocked: boolean = false;

    private pigs = [
        { id: 'basic', name: 'Original Pig', model: '/pig.glb', icon: '/assets/3D_Models/Pigs/shop/original_pig.png', speed: 5.0, agility: 3.0, luck: 2.0, owned: false, price: 600, color: '#ffadc7' },
        { id: 'cute_stylized', name: 'Mud Pig', model: '/assets/3D_Models/Pigs/cute_stylized_pig_low_poly_game_ready.glb', icon: '/images/shop/mudpig.png', speed: 5.2, agility: 3.5, luck: 2.0, owned: false, price: 500 },
        { id: 'elegant', name: 'Elegant Pig', model: '/assets/3D_Models/Pigs/elegant_pig.glb', icon: '/images/shop/elegant_minecraft_pig.png', speed: 5.5, agility: 3.2, luck: 2.5, owned: false, price: 500 },
        { id: 'foreman', name: 'Foreman Pig', model: '/assets/3D_Models/Pigs/foreman_pig.glb', icon: '/images/shop/foreman.png', speed: 5.0, agility: 3.0, luck: 4.0, owned: false, price: 600 },
        { id: 'hamm', name: 'Toy Hamm', model: '/assets/3D_Models/Pigs/kingdom_hearts_iii_-_hamm.glb', icon: '/images/shop/hamm.png', speed: 5.0, agility: 4.0, luck: 3.0, owned: false, price: 600 },
        { id: 'lowpoly', name: 'Pixel Pig', model: '/assets/3D_Models/Pigs/low-poly_pig.glb', icon: '/images/shop/pixelpig.png', speed: 5.8, agility: 4.5, luck: 2.0, owned: false, price: 500 },
        { id: 'minecraft', name: 'Minecraft Pig', model: '/assets/3D_Models/Pigs/minecraft_-_pig.glb', icon: '/images/shop/minecraftpig.png', speed: 5.0, agility: 3.0, luck: 2.0, owned: true, selected: true, color: '#ffadc7', price: 500 },
        { id: 'king_pig', name: 'King Pig', model: '/assets/3D_Models/Pigs/mobile_-_angry_birds_go_-_king_pig.glb', icon: '/images/shop/kingpig.png', speed: 4.0, agility: 2.0, luck: 8.0, owned: false, price: 600 },
        { id: 'waddles', name: 'Mr. Waddles', model: '/assets/3D_Models/Pigs/nov_model.glb', icon: '/images/shop/mrwaddles.png', speed: 5.0, agility: 5.0, luck: 5.0, owned: false, price: 600 },
        { id: 'muddy', name: 'Durty Pig', model: '/assets/3D_Models/Pigs/muddy_pig.glb', icon: '/images/shop/durtyminecraftpig.png', speed: 5.2, agility: 3.2, luck: 3.5, owned: false, price: 500 },
        { id: 'peppa', name: 'Peppa Pig', model: '/assets/3D_Models/Pigs/peppa_pig_with_2d_look.glb', icon: '/images/shop/peppapig.png', speed: 5.0, agility: 4.0, luck: 2.0, owned: false, price: 800 },
        { id: 'crown', name: 'Technoblade', model: '/assets/3D_Models/Pigs/pig_with_crown.glb', icon: '/images/shop/technoblade.png', speed: 6.0, agility: 3.5, luck: 6.0, owned: false, price: 600 },
        { id: 'piglet', name: 'Piglet', model: '/assets/3D_Models/Pigs/piglet.glb', icon: '/images/shop/piglet.png', speed: 7.0, agility: 5.5, luck: 1.0, owned: false, price: 800 },
        { id: 'porky', name: 'Porky Pig', model: '/assets/3D_Models/Pigs/porky_pig.glb', icon: '/images/shop/porky.png', speed: 5.8, agility: 4.2, luck: 3.0, owned: false, price: 800 },
        { id: 'pumba', name: 'Pumba', model: '/assets/3D_Models/Pigs/pumba.glb', icon: '/images/shop/pumba.png', speed: 4.5, agility: 2.5, luck: 4.5, owned: false, price: 1000 }
    ];


    private wings = [
        { id: 'none', name: 'No Wings', icon: '🚫', speed: 0, agility: 0, owned: true, selected: true },
        { id: 'demon', name: 'Demon Wings', model: '/assets/3D_Models/Wings/demon_wings_1.1_low_poly_-_animated.glb', icon: '/assets/3D_Models/Wings/shop/demon_wings_1.1_low_poly_-_animated.png', speed: 2, agility: 1, owned: false, price: 500 },
        { id: 'angel_v1', name: 'Angel Wings v1', model: '/assets/3D_Models/Wings/angel-wings.glb', icon: '/assets/3D_Models/Wings/shop/angel-wings.png', speed: 1, agility: 3, owned: false, price: 500 },
        { id: 'angel_v2', name: 'Angel Wings v2', model: '/assets/3D_Models/Wings/angel_wings.glb', icon: '/assets/3D_Models/Wings/shop/angel_wings.png', speed: 1, agility: 3, owned: false, price: 500 },
        { id: 'angel_low', name: 'Eagle wings', model: '/assets/3D_Models/Wings/angel_wings_low_poly.glb', icon: '/assets/3D_Models/Wings/shop/angel_wings_low_poly.png', speed: 1, agility: 2, owned: false, price: 600 },
        { id: 'elytra', name: 'Minecraft Elytra', model: '/assets/3D_Models/Wings/minecraft_-_elytra.glb', icon: '/assets/3D_Models/Wings/shop/minecraft_-_elytra.png', speed: 3, agility: 2, owned: false, price: 800 },
        { id: 'superman', name: 'Superman Cape', model: '/assets/3D_Models/Wings/superman_cape.glb', icon: '/assets/3D_Models/Wings/shop/superman_cape.png', speed: 3, agility: 1, owned: false, price: 800 },
        { id: 'basic_wings', name: 'Basic Wings', model: '/assets/3D_Models/Wings/wings.glb', icon: '/assets/3D_Models/Wings/shop/wings.png', speed: 1, agility: 1, owned: false, price: 500 }
    ];

    private particles = [
        { id: 'none', name: 'No Particles', icon: '○', effect: 'None', owned: true, selected: true },
        { id: 'sparkles', name: 'Sparkles', icon: '✨', effect: 'Sparkle Trail', owned: false, price: 300 },
        { id: 'fire', name: 'Fire Trail', icon: '🔥', effect: 'Fire Trail', owned: false, price: 300 },
        { id: 'rainbow', name: 'Rainbow Trail', icon: '🌈', effect: 'Rainbow Trail', owned: false, price: 400 },
        { id: 'stars', name: 'Star Dust', icon: '⭐', effect: 'Star Trail', owned: false, price: 300 },
        { id: 'confetti', name: 'Confetti Shower', icon: '🎉', effect: 'Bursting confetti stream', owned: false, price: 400 },
        { id: 'aurora', name: 'Aurora Veil', icon: '🌌', effect: 'Shimmering aurora glow', owned: false, price: 400 },
        { id: 'nebula', name: 'Nebula Dust', icon: '🌠', effect: 'Cosmic dust trail', owned: false, price: 400 }
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

                this.loadLockerItems();
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


                this.loadShopItems();
            });
        });

        const volumeInput = document.getElementById('volume') as HTMLInputElement;
        const sfxInput = document.getElementById('sfx') as HTMLInputElement;

        if (volumeInput) {
            volumeInput.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                audioManager.setMusicVolumePercent(Number(value));
                const volumeValue = document.getElementById('volume-value');
                if (volumeValue) volumeValue.textContent = `${value}%`;
            });
        }

        if (sfxInput) {
            sfxInput.addEventListener('input', (e) => {
                const value = (e.target as HTMLInputElement).value;
                audioManager.setSfxVolumePercent(Number(value));
                const sfxValue = document.getElementById('sfx-value');
                if (sfxValue) sfxValue.textContent = `${value}%`;
            });
        }

        document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-progress')?.addEventListener('click', () => this.resetProgress());
        document.getElementById('fullscreen-toggle')?.addEventListener('click', () => this.toggleFullscreen());

        this.initPigBank();
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
            this.loadLockerItems();
        } else if (submenu === 'shop') {
            this.loadShopItems();
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
        console.log('Loading Shop Items...');


        const shopPigsGrid = document.getElementById('locked-pigs-grid');
        if (shopPigsGrid) {
            const unowned = this.pigs.filter(p => !p.owned);
            console.log(`Pigs to show in shop: ${unowned.length}`);
            this.renderShopGrid(shopPigsGrid, unowned, 'pig');
        }


        const shopWingsGrid = document.getElementById('locked-wings-grid');
        if (shopWingsGrid) {
            const unowned = this.wings.filter(w => !w.owned);
            console.log(`Wings to show in shop: ${unowned.length}`);
            this.renderShopGrid(shopWingsGrid, unowned, 'wing');
        }


        const shopParticlesGrid = document.getElementById('locked-particles-grid');
        if (shopParticlesGrid) {
            const unowned = this.particles.filter(p => !p.owned);
            console.log(`Particles to show in shop: ${unowned.length}`);
            this.renderShopGrid(shopParticlesGrid, unowned, 'particle');
        }
    }

    private renderShopGrid(grid: HTMLElement, items: any[], type: string): void {
        grid.innerHTML = '';
        if (items.length === 0) {
            grid.innerHTML = `<div class="all-owned-celebration" style="grid-column: 1/-1; padding: 40px; font-size: 20px; color: #ff9800;">
                You own all items in this category! 🎉
            </div>`;
            return;
        }

        items.forEach(item => {
            const element = this.createShopItem(item, type);
            grid.appendChild(element);
            element.querySelector('.buy-btn')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.buyItem(item.id, type);
            });
        });
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

    private buyItem(itemId: string, type: string): void {
        let item: any;
        if (type === 'pig') item = this.pigs.find(p => p.id === itemId);
        else if (type === 'wing') item = this.wings.find(w => w.id === itemId);
        else if (type === 'particle') item = this.particles.find(p => p.id === itemId);

        if (!item || item.owned) return;

        const price = (item.price !== undefined) ? item.price : 200;

        if (this.coins >= price) {
            this.coins -= price;
            item.owned = true;
            this.updateStats();
            this.loadShopItems();
            this.saveGameData();
            console.log(`Purchased ${type}: ${item.name}`);
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
        const bestScore = localStorage.getItem('bestScore') || localStorage.getItem('totalScore') || '0';
        const bestDistance = localStorage.getItem('bestDistance') || localStorage.getItem('totalDistance') || '0';
        const bestObstacles = localStorage.getItem('bestObstacles') || localStorage.getItem('obstaclesDodged') || '0';
        const bestTime = localStorage.getItem('bestTime') || localStorage.getItem('playTime') || '0:00';

        const totalScoreElement = document.getElementById('total-score');
        const totalDistanceElement = document.getElementById('total-distance');
        const obstaclesDodgedElement = document.getElementById('obstacles-dodged');
        const playTimeElement = document.getElementById('play-time');
        const coinsAmountElement = document.getElementById('coins-amount');

        if (totalScoreElement) totalScoreElement.textContent = bestScore;
        if (totalDistanceElement) totalDistanceElement.textContent = `${bestDistance}m`;
        if (obstaclesDodgedElement) obstaclesDodgedElement.textContent = bestObstacles;
        if (playTimeElement) playTimeElement.textContent = bestTime;
        if (coinsAmountElement) coinsAmountElement.textContent = this.coins.toString();

        const quickScoreElement = document.getElementById('quick-score');
        if (quickScoreElement) quickScoreElement.textContent = bestScore;

        this.updateFlightsList();
        this.updatePigBankProgress(parseInt(localStorage.getItem('totalDistance') || '0'));
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

    private initPigBank(): void {
        const pigImage = document.getElementById('pigbank-image') as HTMLImageElement | null;
        const stageLabel = document.getElementById('pigbank-stage');
        const progressFill = document.getElementById('pigbank-progress-fill');
        const clicksLabel = document.getElementById('pigbank-clicks');
        const rewardSlot = document.getElementById('pigbank-reward');
        const distanceFill = document.getElementById('pigbank-distance-fill') as HTMLElement | null;
        const distanceText = document.getElementById('pigbank-distance-text');
        const hint = document.getElementById('pigbank-hint');
        const pigCard = document.querySelector('.pigbank-card') as HTMLElement | null;
        if (!pigImage || !progressFill || !rewardSlot) return;

        this.pigBankCardEl = pigCard;
        this.pigBankRewardEl = rewardSlot;

        const totalDistance = parseInt(localStorage.getItem('totalDistance') || '0');
        const base = parseInt(localStorage.getItem('pigBankDistanceBase') || '0');
        if (!isNaN(base) && base > totalDistance) {
            localStorage.setItem('pigBankDistanceBase', `${totalDistance}`);
        }
        this.updatePigBankProgress(totalDistance, distanceFill, distanceText, hint);

        this.pigBankClicks = 0;
        localStorage.setItem('pigBankClicks', '0');
        this.updatePigBankUI(pigImage, stageLabel, progressFill, clicksLabel);
        if (this.pigBankClicks < 32) rewardSlot.classList.add('hidden');
        pigCard?.classList.remove('hidden');
        if (hint) hint.textContent = this.pigBankUnlocked ? 'CLICK ME!' : 'LOCKED';

        pigImage.addEventListener('click', () => {
            if (this.pigBankBusy) return;
            const totalDistanceNow = parseInt(localStorage.getItem('totalDistance') || '0');
            this.updatePigBankProgress(totalDistanceNow);
            if (!this.pigBankUnlocked) {
                pigImage.classList.remove('pigbank-shake');
                void pigImage.offsetWidth;
                pigImage.classList.add('pigbank-shake');
                return;
            }
            if (this.pigBankClicks >= 32) return;
            this.pigBankClicks += 1;
            localStorage.setItem('pigBankClicks', `${this.pigBankClicks}`);
            this.updatePigBankUI(pigImage, stageLabel, progressFill, clicksLabel);
            pigImage.classList.remove('pigbank-pop');
            void pigImage.offsetWidth;
            pigImage.classList.add('pigbank-pop');

            if (this.pigBankClicks >= 32) {
                this.revealPigBankReward(rewardSlot);
            }
        });
    }

    private updatePigBankProgress(totalDistance: number, fillEl?: HTMLElement | null, textEl?: HTMLElement | null, hintEl?: HTMLElement | null): void {
        const base = parseInt(localStorage.getItem('pigBankDistanceBase') || '0');
        const adjustedBase = isNaN(base) ? 0 : base;
        const bankDistance = Math.max(0, totalDistance - adjustedBase);
        const progress = Math.min(1, bankDistance / 5000);
        const fill = fillEl || (document.getElementById('pigbank-distance-fill') as HTMLElement | null);
        const text = textEl || document.getElementById('pigbank-distance-text');
        const hint = hintEl || document.getElementById('pigbank-hint');
        if (fill) fill.style.width = `${Math.round(progress * 100)}%`;
        if (text) text.textContent = `${Math.min(bankDistance, 5000)} / 5000m`;
        this.pigBankUnlocked = bankDistance >= 5000;
        if (hint) hint.textContent = this.pigBankUnlocked ? 'CLICK ME!' : 'LOCKED';
    }

    private updatePigBankUI(
        pigImage: HTMLImageElement,
        stageLabel: HTMLElement | null,
        progressFill: HTMLElement,
        clicksLabel: HTMLElement | null
    ): void {
        const stage = Math.min(3, Math.floor(this.pigBankClicks / 8));
        this.pigBankStage = stage;
        const images = [
            '/assets/3D_Models/Chest/pigbank_normal.png',
            '/assets/3D_Models/Chest/pigbank_stage1.png',
            '/assets/3D_Models/Chest/pigbank_stage2.png',
            '/assets/3D_Models/Chest/pigbank_stage3.png'
        ];
        pigImage.src = images[stage];
        if (stageLabel) stageLabel.textContent = `STAGE ${stage}`;
        const progress = Math.min(100, Math.round((this.pigBankClicks / 32) * 100));
        progressFill.style.width = `${progress}%`;
        if (clicksLabel) clicksLabel.textContent = `${this.pigBankClicks} / 32`;
    }

    private revealPigBankReward(rewardSlot: HTMLElement): void {
        this.pigBankBusy = true;
        rewardSlot.classList.remove('hidden');
        this.pigBankCardEl?.classList.add('hidden');
        rewardSlot.classList.add('reveal');
        rewardSlot.innerHTML = '';

        const reward = this.pickPigBankReward();
        if (!reward) {
            rewardSlot.innerHTML = `<div class="reward-card"><div class="reward-title">ALL UNLOCKED!</div><div>No rewards left.</div></div>`;
            this.pigBankBusy = false;
            return;
        }

        const { item, type } = reward;
        item.owned = true;
        const card = this.createRewardCard(item, type);
        const actions = document.createElement('div');
        actions.className = 'reward-actions';
        const collectBtn = document.createElement('button');
        collectBtn.className = 'collect-reward-btn';
        collectBtn.textContent = 'Collect';
        actions.appendChild(collectBtn);
        card.appendChild(actions);
        rewardSlot.appendChild(card);

        this.updateStats();
        this.loadLockerItems();
        this.loadShopItems();
        this.saveGameData();

        collectBtn.addEventListener('click', () => {
            rewardSlot.classList.add('hidden');
            rewardSlot.classList.remove('reveal');
            rewardSlot.innerHTML = '';
            this.pigBankClicks = 0;
            localStorage.setItem('pigBankClicks', '0');
            const totalDistanceNow = parseInt(localStorage.getItem('totalDistance') || '0');
            localStorage.setItem('pigBankDistanceBase', `${totalDistanceNow}`);
            const pigImage = document.getElementById('pigbank-image') as HTMLImageElement | null;
            const stageLabel = document.getElementById('pigbank-stage');
            const progressFill = document.getElementById('pigbank-progress-fill');
            const clicksLabel = document.getElementById('pigbank-clicks');
            if (pigImage && stageLabel && progressFill && clicksLabel) {
                this.updatePigBankUI(pigImage, stageLabel, progressFill, clicksLabel);
            }
            this.updatePigBankProgress(totalDistanceNow);
            this.pigBankCardEl?.classList.remove('hidden');
            this.pigBankBusy = false;
        });
    }

    private pickPigBankReward(): { item: any; type: string } | null {
        const pigRewards = this.pigs.filter(p => !p.owned);
        const wingRewards = this.wings.filter(w => !w.owned && w.id !== 'none');
        const particleRewards = this.particles.filter(p => !p.owned && p.id !== 'none');
        const pools = [
            ...pigRewards.map(item => ({ item, type: 'pig' })),
            ...wingRewards.map(item => ({ item, type: 'wing' })),
            ...particleRewards.map(item => ({ item, type: 'particle' }))
        ];
        if (pools.length === 0) return null;
        return pools[Math.floor(Math.random() * pools.length)];
    }

    private createRewardCard(item: any, type: string): HTMLElement {
        const card = document.createElement('div');
        card.className = 'reward-card';
        const iconHtml = (typeof item.icon === 'string' && item.icon.startsWith('/'))
            ? `<img src="${item.icon}" class="pig-icon-img" alt="${item.name}">`
            : item.icon;
        card.innerHTML = `
            <div class="reward-title">YOU WON!</div>
            <div class="item-icon">${iconHtml}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-status owned">${type.toUpperCase()}</div>
        `;
        return card;
    }

    private saveSettings(): void {
        const volume = (document.getElementById('volume') as HTMLInputElement)?.value || '70';
        const sfx = (document.getElementById('sfx') as HTMLInputElement)?.value || '80';
        const controls = (document.getElementById('controls') as HTMLSelectElement)?.value || 'both';

        localStorage.setItem('volume', volume);
        localStorage.setItem('sfx', sfx);
        localStorage.setItem('controls', controls);
        audioManager.setMusicVolumePercent(Number(volume));
        audioManager.setSfxVolumePercent(Number(sfx));
        alert('Settings saved!');
    }

    private toggleFullscreen(): void {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => undefined);
        } else {
            document.exitFullscreen?.().catch(() => undefined);
        }
    }

    private resetProgress(): void {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone!')) {
            localStorage.clear();
            this.coins = 1000;
            this.selectedPig = 'minecraft';
            this.selectedWing = 'none';
            this.selectedParticle = 'none';

            this.pigs.forEach(pig => {
                pig.owned = pig.id === 'minecraft';
                pig.selected = pig.id === 'minecraft';
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
            this.loadShopItems();
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
                this.selectedWing = (data.selectedWing === 'black') ? 'none' : (data.selectedWing || this.selectedWing);
                this.selectedParticle = data.selectedParticle || this.selectedParticle;

                const hasSelected = this.pigs.some(pig => pig.id === this.selectedPig);
                if (!hasSelected) this.selectedPig = 'minecraft';
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

                console.log('Game Data Loaded. Coins:', this.coins);
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
        console.log('Game Data Saved.');
    }

    public updateGameStats(score: number, distance: number, timeSeconds: number, obstaclesDodged: number): void {
        const totalScore = parseInt(localStorage.getItem('totalScore') || '0') + Math.floor(score);
        const totalDistance = parseInt(localStorage.getItem('totalDistance') || '0') + Math.floor(distance);
        const totalObstacles = parseInt(localStorage.getItem('obstaclesDodged') || '0') + Math.floor(obstaclesDodged);
        const totalTimeSeconds = parseInt(localStorage.getItem('playTimeSeconds') || '0') + Math.floor(timeSeconds);

        localStorage.setItem('totalScore', totalScore.toString());
        localStorage.setItem('totalDistance', totalDistance.toString());
        localStorage.setItem('obstaclesDodged', totalObstacles.toString());
        localStorage.setItem('playTimeSeconds', totalTimeSeconds.toString());
        localStorage.setItem('playTime', this.formatTime(totalTimeSeconds));

        this.coins += Math.floor(score);
        this.saveGameData();
        this.updatePigBankProgress(totalDistance);
    }

    private formatTime(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
