import Phaser from 'phaser';
import BaseMicrogame from '../BaseMicrogame';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../GameConfig';

export default class TerminalVirusGame extends BaseMicrogame {
    private hexDump: string = '';
    private payloadProgress: number = 0;
    private terminalText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private isCtrlPressed: boolean = false;

    constructor() {
        super({ key: 'TerminalVirusGame' });
    }

    getPrompt(): string {
        return 'TERMINATE!';
    }

    getGameDuration(): number {
        return 5000;
    }

    setupGame(): void {
        // Create terminal background
        const bg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000);
        bg.setOrigin(0, 0);

        // Create terminal text
        this.terminalText = this.add.text(GAME_WIDTH / 2, 150, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#00FF00',
            align: 'left'
        }).setOrigin(0.5);

        // Create progress bar
        this.add.rectangle(GAME_WIDTH / 2, 300, 400, 20, 0x333333);
        this.progressBar = this.add.rectangle(GAME_WIDTH / 2, 300, 0, 20, COLORS.danger);

        // Add instruction text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Press Ctrl+C to terminate the virus!', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#FFFF00'
        }).setOrigin(0.5);

        // Start virus animation
        this.updateHexDump();
        this.time.addEvent({
            delay: 200,
            callback: this.updateHexDump,
            callbackScope: this,
            loop: true
        });
    }

    setupControls(): void {
        const keyboard = this.input.keyboard;
        if (!keyboard) return;

        keyboard.on('keydown-CTRL', () => {
            this.isCtrlPressed = true;
        });

        keyboard.on('keydown-C', () => {
            if (this.isCtrlPressed) {
                this.setWinState();
            }
        });

        keyboard.on('keyup-CTRL', () => {
            this.isCtrlPressed = false;
        });
    }

    cleanupControls(): void {
        this.input.keyboard?.off('keydown');
    }

    resetGameState(): void {
        this.hexDump = '';
        this.payloadProgress = 0;
        this.isCtrlPressed = false;
    }

    private updateHexDump(): void {
        // Generate random hex dump
        const lines = [];
        for (let i = 0; i < 8; i++) {
            const address = (Math.random() * 0xffff).toString(16).padStart(4, '0').toUpperCase();
            const bytes = Array.from({ length: 16 }, () =>
                Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
            ).join(' ');
            lines.push(`0x${address}: ${bytes}`);
        }
        this.hexDump = lines.join('\n');
        this.terminalText.setText(this.hexDump);
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        // Update payload progress
        if (!this.hasWon) {
            this.payloadProgress = Math.min(100, this.payloadProgress + 0.1 * this.gameState.speed);
            this.progressBar.setDisplaySize((this.payloadProgress / 100) * 400, 20);

            // Check for failure condition
            if (this.payloadProgress >= 100) {
                this.setFailState();
            }
        }

        // Update glitch effects
        // ... existing code ...
    }
} 