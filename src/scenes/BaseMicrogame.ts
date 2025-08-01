import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GameState } from '../GameConfig';
import { AudioManager } from '../AudioManager';

/**
 * Base class for all VibeWare microgames
 * 
 * All microgames must extend this class and implement the abstract methods.
 * This ensures consistent behavior across all games.
 */
export default abstract class BaseMicrogame extends Phaser.Scene {
    // Core game state
    protected gameState!: GameState;
    protected timeRemaining: number = 5000; // Default 5 seconds
    protected hasWon: boolean = false;
    protected hasFailed: boolean = false;
    protected gameEnded: boolean = false;
    protected gameReady: boolean = false; // Track if game setup is complete

    // UI elements
    protected timerBar!: Phaser.GameObjects.Rectangle;
    protected timerBarBg!: Phaser.GameObjects.Rectangle;
    protected promptText!: Phaser.GameObjects.Text;

    // Timer
    private gameTimer!: Phaser.Time.TimerEvent;

    /**
     * Get the prompt text to display at the start (e.g., "CATCH!", "TYPE!")
     */
    abstract getPrompt(): string;

    /**
     * Get the duration for this game in milliseconds
     * Can vary based on game speed and difficulty
     */
    abstract getGameDuration(): number;

    /**
     * Set up the game visuals and objects
     * Called after the prompt is shown
     */
    abstract setupGame(): void;

    /**
     * Set up the controls for this game
     * Called after setupGame()
     */
    abstract setupControls(): void;

    /**
     * Clean up controls when game ends
     * Important for keyboard listeners
     */
    abstract cleanupControls(): void;

    /**
     * Reset game-specific state
     * Called during init to ensure clean state between plays
     */
    abstract resetGameState(): void;

    /**
     * Called every frame during gameplay
     * Override to add game-specific update logic
     */
    protected onGameUpdate(_time: number, _delta: number): void {
        // Override in subclasses for update logic
    }

    /**
     * Initialize the microgame
     */
    init(data: { gameState: GameState }) {
        // Use the passed game state
        this.gameState = data.gameState;

        // Reset base game state
        this.hasWon = false;
        this.hasFailed = false;
        this.gameEnded = false;
        this.gameReady = false;
        this.timeRemaining = this.getGameDuration();

        // Reset game-specific state
        this.resetGameState();
    }

    /**
     * Create the microgame
     */
    create() {
        // Show the prompt
        this.showPrompt();

        // After prompt fades, set up the game
        this.time.delayedCall(1000, () => {
            this.setupGame();
            this.setupControls();
            this.startTimer();
            this.gameReady = true;

            // Play a random short audio clip for the game duration
            const audioManager = AudioManager.getInstance(this);
            audioManager.playRandomShortClip(this.getGameDuration());
        });
    }

    /**
     * Update loop
     */
    update(time: number, delta: number) {
        if (!this.gameEnded && this.gameReady) {
            this.onGameUpdate(time, delta);
        }
    }

    /**
     * Show the game prompt (e.g., "CATCH!")
     */
    private showPrompt() {
        this.promptText = this.add.text(GAME_WIDTH / 2, 150, this.getPrompt(), {
            fontSize: '72px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Animate prompt
        this.tweens.add({
            targets: this.promptText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            yoyo: true,
            onComplete: () => {
                this.tweens.add({
                    targets: this.promptText,
                    alpha: 0,
                    duration: 500,
                    delay: 200
                });
            }
        });
    }

    /**
     * Start the game timer
     */
    private startTimer() {
        // Create timer bar
        this.timerBarBg = this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH - 100, 20, 0x000000, 0.3);
        this.timerBar = this.add.rectangle(GAME_WIDTH / 2, 30, GAME_WIDTH - 100, 20, COLORS.success);

        this.gameTimer = this.time.addEvent({
            delay: 50,
            callback: () => {
                this.timeRemaining -= 50;

                // Update timer bar
                const percentage = this.timeRemaining / this.getGameDuration();
                this.timerBar.width = (GAME_WIDTH - 100) * percentage;

                // Change color as time runs out
                if (percentage < 0.3) {
                    this.timerBar.setFillStyle(COLORS.danger);
                } else if (percentage < 0.6) {
                    this.timerBar.setFillStyle(COLORS.warning);
                }

                if (this.timeRemaining <= 0) {
                    this.endGame();
                }
            },
            repeat: -1
        });
    }

    /**
     * Call this when the player successfully completes the objective
     */
    protected setWinState() {
        if (!this.gameEnded && !this.hasWon) {
            this.hasWon = true;
            this.showSuccessFeedback();
        }
    }

    /**
     * Call this when the player fails the objective
     */
    protected setFailState() {
        if (!this.gameEnded && !this.hasFailed) {
            this.hasFailed = true;
            this.showFailureFeedback();
        }
    }

    /**
     * Show success feedback (override for custom effects)
     */
    protected showSuccessFeedback() {
        const successText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'NICE!', {
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

        // Fade out after a moment
        this.tweens.add({
            targets: successText,
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => successText.destroy()
        });
    }

    /**
     * Show failure feedback (override for custom effects)
     */
    protected showFailureFeedback() {
        const failText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MISS!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: failText,
            alpha: 1,
            scaleX: { from: 2, to: 1 },
            scaleY: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });

        // Fade out after a moment
        this.tweens.add({
            targets: failText,
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => failText.destroy()
        });

        // Camera shake
        this.cameras.main.shake(200, 0.02);
    }

    /**
     * End the game and transition
     */
    private endGame() {
        if (this.gameEnded) return;

        this.gameEnded = true;
        this.gameTimer.remove();

        // Stop the music
        const audioManager = AudioManager.getInstance();
        audioManager.stopCurrentMusic();

        // Clean up controls
        this.cleanupControls();

        // Stop physics if it exists
        if (this.physics && this.physics.world) {
            this.physics.pause();
        }

        // Determine if player won
        const won = this.hasWon && !this.hasFailed;

        // Update game state
        if (won) {
            this.gameState.score += 100;
            this.gameState.gamesCompleted++;

            // Increase speed every 5 games (but not when starting from 0)
            if (this.gameState.gamesCompleted > 0 && this.gameState.gamesCompleted % 5 === 0) {
                this.gameState.speed = Math.min(this.gameState.speed + 0.2, 3);
            }
        } else {
            this.gameState.lives--;
        }

        // Transition after a short delay
        this.time.delayedCall(500, () => {
            if (this.gameState.debugMode) {
                this.scene.start('TitleScene');
            } else {
                if (this.gameState.lives <= 0) {
                    this.scene.start('TitleScene');
                } else {
                    this.scene.start('TransitionScene', {
                        gameState: this.gameState,
                        lastGameWon: won,
                        previousGameKey: this.scene.key
                    });
                }
            }
        });
    }

    /**
     * Helper method to create a standard background
     * Override for custom backgrounds
     */
    protected createStandardBackground(topColor: number = 0x87CEEB, bottomColor: number = 0xFFE5B4) {
        const graphics = this.add.graphics();
        const top = Phaser.Display.Color.IntegerToColor(topColor);
        const bottom = Phaser.Display.Color.IntegerToColor(bottomColor);

        for (let i = 0; i < GAME_HEIGHT; i++) {
            const ratio = i / GAME_HEIGHT;
            const r = Phaser.Math.Linear(top.red, bottom.red, ratio);
            const g = Phaser.Math.Linear(top.green, bottom.green, ratio);
            const b = Phaser.Math.Linear(top.blue, bottom.blue, ratio);

            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, i, GAME_WIDTH, 1);
        }
    }
} 