import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class KeyboardSmashGame extends BaseMicrogame {
    private keyboard!: Phaser.GameObjects.Container;
    private keys!: Phaser.GameObjects.Rectangle[];
    private keyTexts!: Phaser.GameObjects.Text[];
    private keysPressed: Set<string> = new Set();
    private targetKeyCount: number = 20;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private progressText!: Phaser.GameObjects.Text;
    private keyboardSpring!: Phaser.GameObjects.Rectangle[];
    private keyboardListener!: (event: KeyboardEvent) => void;

    constructor() {
        super({ key: 'KeyboardSmashGame' });
    }

    getPrompt(): string {
        return 'SMASH!';
    }

    getGameDuration(): number {
        return 5000;
    }

    resetGameState(): void {
        this.keysPressed.clear();
    }

    setupGame(): void {
        // Create background
        this.createStandardBackground(0x3498db, 0x2c3e50);

        // Determine target based on game speed
        this.targetKeyCount = Math.floor(20 + (5 * this.gameState.speed));

        // Create progress bar
        this.progressBar = this.add.rectangle(GAME_WIDTH / 2, 120, 400, 30, 0x000000, 0.3);
        this.progressBar.setOrigin(0, 0.5);

        this.progressText = this.add.text(
            GAME_WIDTH / 2,
            120,
            `0/${this.targetKeyCount} KEYS`,
            {
                fontSize: '24px',
                color: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);

        // Create keyboard spring
        this.createKeyboardSpring();

        // Create keyboard
        this.createKeyboard();

        // Instructions
        this.add.text(
            GAME_WIDTH / 2,
            80,
            `Hit ${this.targetKeyCount} different keys!`,
            {
                fontSize: '28px',
                color: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
    }

    setupControls(): void {
        this.keyboardListener = (event: KeyboardEvent) => {
            // Prevent default behavior
            event.preventDefault();

            const key = event.key.toUpperCase();

            // Only count if it's a new key
            if (!this.keysPressed.has(key)) {
                this.keysPressed.add(key);
                this.updateProgress();
                this.animateKeyPress(key);

                // Compress keyboard on keypress
                this.tweens.add({
                    targets: this.keyboard,
                    y: GAME_HEIGHT / 2 + 20,
                    duration: 50,
                    yoyo: true,
                    ease: 'Bounce.Out'
                });

                // Compress springs
                this.keyboardSpring.forEach(spring => {
                    this.tweens.add({
                        targets: spring,
                        scaleY: 0.7,
                        duration: 50,
                        yoyo: true,
                        ease: 'Sine.Out'
                    });
                });

                // Check if we've hit the target
                if (this.keysPressed.size >= this.targetKeyCount) {
                    this.setWinState();
                    this.animateKeyboardSuccess();
                }
            }
        };

        // Add event listener to window
        window.addEventListener('keydown', this.keyboardListener);
    }

    cleanupControls(): void {
        // Remove event listener
        if (this.keyboardListener) {
            window.removeEventListener('keydown', this.keyboardListener);
        }
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        // If time runs out and we haven't hit the target, fail
        if (this.timeRemaining <= 0 && !this.hasWon && !this.hasFailed) {
            this.setFailState();
            this.animateKeyboardFailure();
        }
    }

    private createKeyboard(): void {
        // Create keyboard container
        this.keyboard = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Create keyboard body
        const keyboardBody = this.add.rectangle(0, 0, 500, 200, 0x333333, 1);
        keyboardBody.setStrokeStyle(4, 0x222222);
        this.keyboard.add(keyboardBody);

        // Create keys
        const keyLayout = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
        ];

        this.keys = [];
        this.keyTexts = [];

        // Create rows of keys
        for (let row = 0; row < keyLayout.length; row++) {
            const keys = keyLayout[row];
            const offsetX = (row === 1) ? 20 : (row === 2) ? 40 : 0;

            for (let i = 0; i < keys.length; i++) {
                const keyWidth = 40;
                const keyHeight = 40;
                const spacing = 5;
                const x = -220 + offsetX + i * (keyWidth + spacing);
                const y = -50 + row * (keyHeight + spacing);

                // Key background
                const key = this.add.rectangle(x, y, keyWidth, keyHeight, 0x666666, 1);
                key.setStrokeStyle(2, 0x444444);
                this.keyboard.add(key);
                this.keys.push(key);

                // Key text
                const keyText = this.add.text(x, y, keys[i], {
                    fontSize: '20px',
                    color: '#ffffff',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
                this.keyboard.add(keyText);
                this.keyTexts.push(keyText);
            }
        }

        // Add spacebar
        const spaceKey = this.add.rectangle(0, 70, 250, 40, 0x666666, 1);
        spaceKey.setStrokeStyle(2, 0x444444);
        this.keyboard.add(spaceKey);
        this.keys.push(spaceKey);

        const spaceText = this.add.text(0, 70, 'SPACE', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        this.keyboard.add(spaceText);
        this.keyTexts.push(spaceText);
    }

    private createKeyboardSpring(): void {
        this.keyboardSpring = [];

        // Create springs at the bottom of the keyboard
        for (let i = 0; i < 3; i++) {
            const x = GAME_WIDTH / 2 - 100 + i * 100;
            const spring = this.add.rectangle(x, GAME_HEIGHT / 2 + 120, 20, 40, 0x888888);
            spring.setOrigin(0.5, 0);
            this.keyboardSpring.push(spring);
        }
    }

    private updateProgress(): void {
        // Update progress bar
        const progress = this.keysPressed.size / this.targetKeyCount;
        const width = Math.min(progress, 1) * 400;

        this.tweens.add({
            targets: this.progressBar,
            width: width,
            duration: 100,
            ease: 'Power1'
        });

        // Update text
        this.progressText.setText(`${this.keysPressed.size}/${this.targetKeyCount} KEYS`);

        // Change color as progress increases
        if (progress >= 0.6) {
            this.progressBar.setFillStyle(COLORS.success);
        } else if (progress >= 0.3) {
            this.progressBar.setFillStyle(COLORS.warning);
        } else {
            this.progressBar.setFillStyle(COLORS.danger);
        }
    }

    private animateKeyPress(keyChar: string): void {
        // Find the key and highlight it
        for (let i = 0; i < this.keyTexts.length; i++) {
            const text = this.keyTexts[i];
            if (text.text === keyChar || (keyChar === ' ' && text.text === 'SPACE')) {
                // Highlight the key
                this.keys[i].setFillStyle(0x00ff00);

                // Create a little spark effect
                const sparkle = this.add.circle(
                    this.keyboard.x + text.x,
                    this.keyboard.y + text.y,
                    10,
                    0xffff00,
                    0.8
                );

                // Animate the sparkle
                this.tweens.add({
                    targets: sparkle,
                    alpha: 0,
                    scale: 2,
                    duration: 200,
                    onComplete: () => {
                        sparkle.destroy();
                    }
                });

                // Reset key color after a delay
                this.time.delayedCall(200, () => {
                    this.keys[i].setFillStyle(0x666666);
                });

                break;
            }
        }
    }

    private animateKeyboardSuccess(): void {
        // Launch keyboard into the air
        this.tweens.add({
            targets: this.keyboard,
            y: -200,
            angle: Phaser.Math.Between(-30, 30),
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // Create confetti
        for (let i = 0; i < 50; i++) {
            const confetti = this.add.rectangle(
                GAME_WIDTH / 2 + Phaser.Math.Between(-250, 250),
                GAME_HEIGHT / 2 + Phaser.Math.Between(-100, 100),
                Phaser.Math.Between(5, 15),
                Phaser.Math.Between(5, 15),
                Phaser.Display.Color.RandomRGB().color
            );

            this.tweens.add({
                targets: confetti,
                y: confetti.y - Phaser.Math.Between(200, 400),
                x: confetti.x + Phaser.Math.Between(-100, 100),
                angle: Phaser.Math.Between(-180, 180),
                alpha: 0,
                duration: Phaser.Math.Between(1000, 2000),
                onComplete: () => {
                    confetti.destroy();
                }
            });
        }
    }

    private animateKeyboardFailure(): void {
        // Keyboard deflation effect
        this.tweens.add({
            targets: this.keyboard,
            scaleX: 0.8,
            scaleY: 0.5,
            angle: -5,
            y: GAME_HEIGHT / 2 + 50,
            duration: 500,
            ease: 'Bounce.Out'
        });

        // Springs collapse
        this.keyboardSpring.forEach(spring => {
            this.tweens.add({
                targets: spring,
                scaleY: 0.2,
                angle: Phaser.Math.Between(-30, 30),
                duration: 500
            });
        });

        // Sad particles
        for (let i = 0; i < 10; i++) {
            const particle = this.add.circle(
                GAME_WIDTH / 2 + Phaser.Math.Between(-200, 200),
                GAME_HEIGHT / 2 + Phaser.Math.Between(-50, 50),
                5,
                0x888888
            );

            this.tweens.add({
                targets: particle,
                y: particle.y + 50,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}