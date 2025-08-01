import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class TypeGame extends BaseMicrogame {
    private targetWord: string = '';
    private typedWord: string = '';
    private wordText!: Phaser.GameObjects.Text;
    private typedText!: Phaser.GameObjects.Text;
    private keyboardListener: any;

    private words = ['BANANA', 'PHASER', 'SPEED', 'QUICK', 'GAME', 'TYPE', 'FAST', 'WIN'];

    constructor() {
        super({ key: 'TypeGame' });
    }

    /**
     * Get the prompt for this game
     */
    getPrompt(): string {
        return 'TYPE!';
    }

    /**
     * Get the duration based on game speed
     */
    getGameDuration(): number {
        return 3000; // 3 seconds base time
    }

    /**
     * Set up the game after prompt
     */
    setupGame(): void {
        // Create CRT monitor aesthetic background
        this.createBackground();

        // Select random word
        this.targetWord = Phaser.Utils.Array.GetRandom(this.words);

        // Display target word
        this.createWordDisplay();
    }

    /**
     * Set up keyboard controls
     */
    setupControls(): void {
        this.keyboardListener = (event: KeyboardEvent) => {
            if (this.gameEnded) return;

            const key = event.key.toUpperCase();

            // Check if it's a letter
            if (key.length === 1 && key.match(/[A-Z]/)) {
                this.typedWord += key;
                this.typedText.setText(this.typedWord);

                // Check if word matches
                if (this.typedWord === this.targetWord) {
                    this.handleSuccess();
                } else if (this.typedWord.length >= this.targetWord.length) {
                    // Wrong word
                    this.flashError();
                    this.typedWord = '';
                    this.typedText.setText('');
                }

                // Update color based on correctness
                this.updateTextColor();
            }

            // Backspace
            if (event.key === 'Backspace' && this.typedWord.length > 0) {
                this.typedWord = this.typedWord.slice(0, -1);
                this.typedText.setText(this.typedWord);
                this.updateTextColor();
            }
        };

        this.input.keyboard?.on('keydown', this.keyboardListener);
    }

    /**
     * Clean up keyboard listener
     */
    cleanupControls(): void {
        this.input.keyboard?.off('keydown');
    }

    resetGameState(): void {
        // No persistent state to reset
    }

    /**
     * Override success feedback for custom "ACCESS GRANTED!" message
     */
    protected showSuccessFeedback(): void {
        // Success effects
        this.wordText.setColor('#00FF00');
        this.typedText.setColor('#00FF00');

        const successText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 150, 'ACCESS GRANTED!', {
            fontSize: '48px',
            fontFamily: 'Courier New, monospace',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        // Matrix-style falling characters
        for (let i = 0; i < 10; i++) {
            const char = this.add.text(
                Phaser.Math.Between(100, GAME_WIDTH - 100),
                Phaser.Math.Between(-100, -50),
                String.fromCharCode(Phaser.Math.Between(65, 90)),
                {
                    fontSize: '24px',
                    fontFamily: 'Courier New, monospace',
                    color: '#00FF00'
                }
            );

            this.tweens.add({
                targets: char,
                y: GAME_HEIGHT + 50,
                duration: Phaser.Math.Between(1000, 2000),
                alpha: { from: 1, to: 0 },
                onComplete: () => char.destroy()
            });
        }

        this.tweens.add({
            targets: successText,
            alpha: 1,
            scaleX: { from: 0, to: 1.2 },
            scaleY: { from: 0, to: 1.2 },
            duration: 300,
            ease: 'Back.out'
        });

        // Fade out success text
        this.tweens.add({
            targets: successText,
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => successText.destroy()
        });
    }

    private createBackground() {
        // Dark background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000);

        // CRT monitor frame
        const frame = this.add.graphics();
        frame.lineStyle(4, 0x00FF00, 0.5);
        frame.strokeRoundedRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100, 20);

        // Scanline effect
        for (let y = 0; y < GAME_HEIGHT; y += 4) {
            this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 1, 0x00FF00, 0.1);
        }

        // Terminal prompt style
        this.add.text(80, 100, '> SYSTEM CHALLENGE', {
            fontSize: '20px',
            fontFamily: 'Courier New, monospace',
            color: '#00FF00'
        });
    }

    private createWordDisplay() {
        // Target word
        this.wordText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, this.targetWord, {
            fontSize: '64px',
            fontFamily: 'Courier New, monospace',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Typed word display
        this.typedText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '', {
            fontSize: '48px',
            fontFamily: 'Courier New, monospace',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Blinking cursor
        const cursor = this.add.text(0, 0, '_', {
            fontSize: '48px',
            fontFamily: 'Courier New, monospace',
            color: '#FFFFFF'
        });

        this.tweens.add({
            targets: cursor,
            alpha: { from: 1, to: 0 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Update cursor position
        this.time.addEvent({
            delay: 50,
            callback: () => {
                const bounds = this.typedText.getBounds();
                cursor.x = bounds.right + 5;
                cursor.y = this.typedText.y - 24;
            },
            repeat: -1
        });
    }

    private handleSuccess() {
        this.setWinState();
    }

    private updateTextColor() {
        // Check each character
        let allCorrect = true;
        for (let i = 0; i < this.typedWord.length; i++) {
            if (this.typedWord[i] !== this.targetWord[i]) {
                allCorrect = false;
                break;
            }
        }

        this.typedText.setColor(allCorrect ? '#00FF00' : '#FF0000');
    }

    private flashError() {
        this.cameras.main.shake(100, 0.01);
        this.typedText.setColor('#FF0000');

        const errorText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 'ERROR!', {
            fontSize: '32px',
            fontFamily: 'Courier New, monospace',
            color: '#FF0000'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: errorText,
            alpha: { from: 1, to: 0 },
            y: errorText.y + 20,
            duration: 500,
            onComplete: () => errorText.destroy()
        });
    }
} 