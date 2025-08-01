import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../GameConfig';
import { AudioManager } from '../AudioManager';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 30, 320, 50);

        const loadingText = this.make.text({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px Arial',
                color: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);

        const percentText = this.make.text({
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2 - 5,
            text: '0%',
            style: {
                font: '18px Arial',
                color: '#ffffff'
            }
        });
        percentText.setOrigin(0.5, 0.5);

        // Update loading bar
        this.load.on('progress', (value: number) => {
            percentText.setText(Math.floor(value * 100) + '%');
            progressBar.clear();
            progressBar.fillStyle(COLORS.primary, 1);
            progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 20, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });

        // Initialize AudioManager and preload audio
        const audioManager = new AudioManager(this);
        audioManager.preloadAudio(this);
    }

    create() {
        // Start the title scene after preloading
        this.scene.start('TitleScene');
    }
} 