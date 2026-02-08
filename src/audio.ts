const clampPercent = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));
const percentToRatio = (percent: number): number => clampPercent(percent) / 100;

const hasLocalStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export class AudioManager {
    private readonly backgroundMusic: HTMLAudioElement;
    private readonly startClick: HTMLAudioElement;
    private readonly buttonClick: HTMLAudioElement;
    private musicEnabled: boolean;
    private musicVolume = 0.7;
    private sfxVolume = 0.8;
    private backgroundMusicPending: boolean = false;

    constructor() {
        this.backgroundMusic = this.createAudio(new URL('../sounds/game_music.mp3', import.meta.url).href, true);
        this.startClick = this.createAudio(new URL('../sounds/playbutton_click.mp3', import.meta.url).href, false);
        this.buttonClick = this.createAudio(new URL('../sounds/button_click.wav', import.meta.url).href, false);

        this.musicVolume = percentToRatio(this.readStoredPercent('volume', 70));
        this.sfxVolume = percentToRatio(this.readStoredPercent('sfx', 80));
        this.musicEnabled = this.readStoredToggle('musicEnabled', true);

        this.updateMusicVolume();
    }

    public setMusicVolumePercent(percent: number): void {
        this.musicVolume = percentToRatio(percent);
        this.updateMusicVolume();
    }

    public setSfxVolumePercent(percent: number): void {
        this.sfxVolume = percentToRatio(percent);
    }

    public toggleMusicEnabled(): boolean {
        this.setMusicEnabled(!this.musicEnabled);
        return this.musicEnabled;
    }

    public setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;
        if (hasLocalStorage()) {
            window.localStorage.setItem('musicEnabled', enabled ? 'true' : 'false');
        }
        if (enabled) {
            this.updateMusicVolume();
            this.backgroundMusic.play().catch(() => undefined);
        } else {
            this.backgroundMusic.pause();
        }
    }

    public isMusicEnabled(): boolean {
        return this.musicEnabled;
    }

    public playBackgroundMusic(): void {
        if (!this.musicEnabled) return;
        this.backgroundMusic.play().catch(() => {
            this.scheduleBackgroundMusicResume();
        });
    }

    public pauseBackgroundMusic(): void {
        this.backgroundMusic.pause();
    }

    public playStartClick(): void {
        this.playSfx(this.startClick);
    }

    public playButtonClick(): void {
        this.playSfx(this.buttonClick);
    }

    private createAudio(src: string, loop: boolean): HTMLAudioElement {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.loop = loop;
        audio.volume = 1;
        return audio;
    }

    private playSfx(audio: HTMLAudioElement): void {
        if (this.sfxVolume <= 0) return;
        audio.volume = this.sfxVolume;
        audio.currentTime = 0;
        audio.play().catch(() => undefined);
    }

    private updateMusicVolume(): void {
        this.backgroundMusic.volume = this.musicEnabled ? this.musicVolume : 0;
    }

    private scheduleBackgroundMusicResume(): void {
        if (this.backgroundMusicPending || !this.musicEnabled) return;
        this.backgroundMusicPending = true;
        const resume = () => {
            this.backgroundMusicPending = false;
            this.backgroundMusic.play().catch(() => {
                this.scheduleBackgroundMusicResume();
            });
        };

        if (typeof document !== 'undefined') {
            document.addEventListener('pointerdown', resume, { once: true, capture: true });
            document.addEventListener('keydown', resume, { once: true, capture: true });
        }
    }

    private readStoredPercent(key: string, fallback: number): number {
        if (!hasLocalStorage()) return fallback;
        const stored = window.localStorage.getItem(key);
        if (!stored) return fallback;
        const parsed = parseInt(stored, 10);
        if (Number.isNaN(parsed)) return fallback;
        return clampPercent(parsed);
    }

    private readStoredToggle(key: string, fallback: boolean): boolean {
        if (!hasLocalStorage()) return fallback;
        const stored = window.localStorage.getItem(key);
        if (!stored) return fallback;
        return stored === 'true';
    }
}

export const audioManager = new AudioManager();
