import Phaser from 'phaser';
import BaseMicrogame from '../BaseMicrogame';

export default class SneezeGame extends BaseMicrogame {
    private sPresses: number = 0;
    private readonly WIN_THRESHOLD: number = 10;
    private ahText!: Phaser.GameObjects.Text;
    private chooText!: Phaser.GameObjects.Text;
    private pressCounter!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private progressBarBg!: Phaser.GameObjects.Rectangle;
    private blushOverlay!: Phaser.GameObjects.Rectangle;
    private sKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super({ key: 'SneezeGame' });
    }

    getPrompt(): string {
        return 'SNEEZE!';
    }

    getGameDuration(): number {
        return 3000; // 3 seconds
    }

    init(data: { gameState: any }) {
        super.init(data);
        // Reset game-specific state
        this.sPresses = 0;
    }

    setupGame(): void {
        // Create background with screentone pattern
        this.createBackground();

        // Create UI elements
        this.createUI();

        // Show game UI immediately
        this.showGameUI();

        // Setup controls
        this.setupControls();
    }

    setupControls(): void {
        this.sKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // Remove any existing listeners before adding new ones
        this.sKey.removeAllListeners();

        this.sKey.on('down', () => {
            this.handleSPress();
        });
    }

    cleanupControls(): void {
        if (this.sKey) {
            this.sKey.removeAllListeners();
        }
    }

    resetGameState(): void {
        this.sPresses = 0;
    }

    private createBackground() {
        // Create simple background
        const graphics = this.add.graphics();
        graphics.fillStyle(0xf0f0f0);
        graphics.fillRect(0, 0, this.scale.width, this.scale.height);

        // Add a few decorative elements instead of thousands of dots
        graphics.fillStyle(0x000000, 0.05);
        graphics.fillRect(0, 0, this.scale.width, 100);
        graphics.fillRect(0, this.scale.height - 100, this.scale.width, 100);
    }

    private createUI() {
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        // Title
        this.add.text(centerX, 50, 'FAKE SNEEZE!', {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setRotation(-0.1).setDepth(10);

        // Press counter (hidden initially)
        this.pressCounter = this.add.text(50, 50, 'S Presses: 0/10', {
            fontSize: '20px',
            fontFamily: 'Arial Black',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setVisible(false).setDepth(10);

        // Progress bar background
        this.progressBarBg = this.add.rectangle(centerX, this.scale.height - 80, 300, 30, 0xffffff);
        this.progressBarBg.setStrokeStyle(3, 0x000000);
        this.progressBarBg.setVisible(false).setDepth(10);

        // Progress bar fill
        this.progressBar = this.add.rectangle(centerX - 150, this.scale.height - 80, 0, 26, 0xff6b6b);
        this.progressBar.setOrigin(0, 0.5);
        this.progressBar.setVisible(false).setDepth(10);

        // "Ah-" text (hidden initially)
        this.ahText = this.add.text(centerX, centerY + 100, 'Ah-', {
            fontSize: '48px',
            fontFamily: 'Arial Black',
            color: '#000000',
            backgroundColor: '#ffffff',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setVisible(false).setRotation(-0.05).setDepth(10);

        // "CHOO!" text (hidden initially)
        this.chooText = this.add.text(centerX, centerY, '-CHOO!', {
            fontSize: '72px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setVisible(false).setRotation(0.15).setDepth(20);

        // Blush overlay (hidden initially)
        this.blushOverlay = this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0xff6b6b, 0).setDepth(5);
    }

    private handleSPress() {
        if (this.gameEnded) return;

        this.sPresses++;
        this.updateGameState();

        // Check for win condition
        if (this.sPresses >= this.WIN_THRESHOLD) {
            this.triggerSneeze();
        }
    }

    private showGameUI() {
        this.pressCounter.setVisible(true);
        this.progressBarBg.setVisible(true);
        this.progressBar.setVisible(true);
        this.ahText.setVisible(true);
    }

    private updateGameState() {
        // Update press counter
        this.pressCounter.setText(`S Presses: ${this.sPresses}/${this.WIN_THRESHOLD}`);

        // Update progress bar
        const progress = Math.min(this.sPresses / this.WIN_THRESHOLD, 1);
        this.progressBar.width = 300 * progress;

        // Update "Ah-" text scale only (more performant than changing fontSize)
        const scale = 1 + (this.sPresses * 0.3);
        this.ahText.setScale(scale);

        if (this.sPresses > 7) {
            this.ahText.setColor('#ff6b6b');
        }

        // Add blush effect when close
        if (this.sPresses > 7) {
            this.blushOverlay.setAlpha(0.2);
        }
    }

    private triggerSneeze() {
        this.chooText.setVisible(true);
        this.chooText.setScale(0);

        this.tweens.add({
            targets: this.chooText,
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.setWinState();
            }
        });

        // Hide other UI
        this.ahText.setVisible(false);
        this.pressCounter.setVisible(false);
        this.progressBarBg.setVisible(false);
        this.progressBar.setVisible(false);
    }

    protected showSuccessFeedback(): void {
        const successText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'ACHOO!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: successText,
            alpha: 1,
            scaleX: { from: 0, to: 1.2 },
            scaleY: { from: 0, to: 1.2 },
            duration: 300,
            ease: 'Back.out'
        });

        // Fade out
        this.tweens.add({
            targets: successText,
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => successText.destroy()
        });
    }

} 