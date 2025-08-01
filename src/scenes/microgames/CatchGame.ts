import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class CatchGame extends BaseMicrogame {
    private basket!: Phaser.GameObjects.Rectangle;
    private eggs!: Phaser.Physics.Arcade.Group;
    private eggSpawnTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'CatchGame' });
    }

    /**
     * Get the prompt for this game
     */
    getPrompt(): string {
        return 'CATCH!';
    }

    /**
     * Get the duration based on game speed
     */
    getGameDuration(): number {
        return 5000; // 5 seconds base time
    }

    /**
     * Set up the game after prompt
     */
    setupGame(): void {
        // Enable gravity for this scene
        this.physics.world.gravity.y = 300;

        // Create background
        this.createBackground();

        // Create basket
        this.createBasket();

        // Create eggs group
        this.eggs = this.physics.add.group();

        // Start spawning eggs
        this.spawnEgg();

        // Continuously spawn eggs
        this.eggSpawnTimer = this.time.addEvent({
            delay: 3000, // Spawn every 3 seconds
            callback: () => {
                if (!this.hasWon && !this.hasFailed) {
                    this.spawnEgg();
                }
            },
            repeat: -1
        });

        // Set up collision detection
        this.physics.add.overlap(this.basket, this.eggs, this.catchEgg, undefined, this);
    }

    /**
     * Set up controls - mouse movement for basket
     */
    setupControls(): void {
        this.input.on('pointermove', this.moveBasket, this);
    }

    /**
     * Clean up controls
     */
    cleanupControls(): void {
        this.input.off('pointermove', this.moveBasket, this);
        if (this.eggSpawnTimer) {
            this.eggSpawnTimer.remove();
        }
    }

    /**
     * Reset game-specific state
     */
    resetGameState(): void {
        // No persistent state to reset
    }

    /**
     * Update loop - check for eggs hitting ground
     */
    protected onGameUpdate(_time: number, _delta: number): void {
        if (!this.hasFailed && this.eggs) {
            this.eggs.children.entries.forEach((egg: any) => {
                if (egg.active && egg.y > GAME_HEIGHT - 50) {
                    egg.destroy();
                    this.showMissedEggFeedback();
                    this.setFailState();
                }
            });
        }
    }

    /**
     * Override success feedback for custom "NICE CATCH!" message
     */
    protected showSuccessFeedback(): void {
        const successText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'NICE CATCH!', {
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

    private createBackground() {
        // Use the helper method from base class
        this.createStandardBackground(0xB4E5FF, 0xFFE5B4);

        // Add some clouds
        for (let i = 0; i < 3; i++) {
            const cloud = this.add.graphics();
            const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
            const y = Phaser.Math.Between(50, 150);

            cloud.fillStyle(0xFFFFFF, 0.7);
            cloud.fillCircle(x, y, 30);
            cloud.fillCircle(x + 25, y, 25);
            cloud.fillCircle(x - 25, y, 25);
            cloud.fillCircle(x + 10, y - 15, 20);
            cloud.fillCircle(x - 10, y - 15, 20);
        }
    }

    private createBasket() {
        // Create basket at bottom of screen
        this.basket = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, 80, 40, 0xD7C9AA);
        this.basket.setStrokeStyle(3, 0x8B4513);

        // Add physics to basket
        this.physics.add.existing(this.basket, true);

        // Add basket wobble
        this.tweens.add({
            targets: this.basket,
            angle: { from: -2, to: 2 },
            duration: 200,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private moveBasket(pointer: Phaser.Input.Pointer) {
        this.basket.x = Phaser.Math.Clamp(pointer.x, 40, GAME_WIDTH - 40);
        (this.basket.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    }

    private spawnEgg() {
        const x = Phaser.Math.Between(50, GAME_WIDTH - 50);

        // Create egg shape
        const egg = this.add.ellipse(x, -30, 35, 45, 0xFFFDD0);
        egg.setStrokeStyle(2, 0xE6D7C3);

        // Add shine effect
        const shine = this.add.ellipse(x - 8, -38, 12, 18, 0xFFFFFF, 0.6);

        // Add subtle shadow
        const shadow = this.add.ellipse(x + 3, -25, 20, 10, 0xE6D7C3, 0.2);

        // Add physics to the egg
        this.physics.add.existing(egg, false);

        // Configure physics body
        const body = egg.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(100 + (50 * this.gameState.speed));
        body.setSize(35, 45);

        // Add to eggs group
        this.eggs.add(egg);

        // Make shine and shadow follow egg
        this.time.addEvent({
            delay: 16,
            callback: () => {
                if (egg && egg.active) {
                    shine.x = egg.x - 8;
                    shine.y = egg.y - 8;
                    shadow.x = egg.x + 3;
                    shadow.y = egg.y + 5;
                } else {
                    shine.destroy();
                    shadow.destroy();
                }
            },
            repeat: -1
        });

        // Add slight wobble
        this.tweens.add({
            targets: egg,
            angle: { from: -3, to: 3 },
            duration: 400,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private catchEgg(_basket: any, egg: any) {
        if (!this.hasWon && egg.active) {
            // Destroy the egg
            egg.destroy();

            // Stop spawning more eggs
            if (this.eggSpawnTimer) {
                this.eggSpawnTimer.remove();
            }

            // Basket happy animation
            this.tweens.add({
                targets: this.basket,
                scaleX: 1.3,
                scaleY: 0.8,
                duration: 100,
                yoyo: true
            });

            // Success particles
            for (let i = 0; i < 10; i++) {
                const particle = this.add.circle(
                    this.basket.x + Phaser.Math.Between(-20, 20),
                    this.basket.y,
                    5,
                    0xFFD700
                );

                this.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(-50, 50),
                    y: particle.y - Phaser.Math.Between(50, 100),
                    alpha: 0,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }

            // Mark as won
            this.setWinState();
        }
    }

    private showMissedEggFeedback() {
        // Stop spawning more eggs
        if (this.eggSpawnTimer) {
            this.eggSpawnTimer.remove();
        }

        // Show splat effect
        const missText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'SPLAT!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        // Egg splat effect
        const splat = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 100, 30, 0xFFD700, 0.8);
        splat.setScale(0);

        this.tweens.add({
            targets: splat,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.out'
        });

        this.tweens.add({
            targets: missText,
            alpha: 1,
            scaleX: { from: 2, to: 1 },
            scaleY: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });

        // Fade out feedback
        this.tweens.add({
            targets: [missText, splat],
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => {
                missText.destroy();
                splat.destroy();
            }
        });
    }
} 