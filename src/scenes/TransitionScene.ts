import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, GameState, MICROGAMES, MicrogameInfo } from '../GameConfig';
import { AudioManager } from '../AudioManager';

export default class TransitionScene extends Phaser.Scene {
    private gameState!: GameState;
    private livesDisplay!: Phaser.GameObjects.Container;
    private controlsDisplay!: Phaser.GameObjects.Container;
    private countdownText!: Phaser.GameObjects.Text;
    private speedIndicator!: Phaser.GameObjects.Container;
    private nextGameKey: string = '';
    private lastGameWon: boolean = true;

    constructor() {
        super({ key: 'TransitionScene' });
    }

    init(data: { gameState: GameState, lastGameWon?: boolean, previousGameKey?: string }) {
        this.gameState = data.gameState;
        this.lastGameWon = data.lastGameWon ?? true;
        if (data.previousGameKey) {
            this.gameState.previousGameKey = data.previousGameKey;
        }
    }

    create() {
        // Play transition music for 4 seconds (3s countdown + 1s transition)
        const audioManager = AudioManager.getInstance(this);
        audioManager.playTransitionMusic(4000);

        // Create animated background
        this.createBackground();

        // Display lives with potential animation
        this.createLivesDisplay();

        // Display score
        this.createScoreDisplay();

        // Display speed indicator
        this.createSpeedIndicator();

        // Show dramatic heart break if last game was lost
        if (!this.lastGameWon) {
            this.showDramaticHeartBreak();
        }

        // Show next game controls
        this.showNextGameControls();

        // Start countdown
        this.startCountdown();
    }

    private createBackground() {
        // Dynamic gradient that changes based on game progress
        const graphics = this.add.graphics();

        const color1 = Phaser.Display.Color.IntegerToColor(COLORS.secondary);
        const bgColor = Phaser.Display.Color.IntegerToColor(COLORS.background);

        for (let i = 0; i < GAME_HEIGHT; i++) {
            const ratio = i / GAME_HEIGHT;
            const r = Phaser.Math.Linear(color1.red, bgColor.red, ratio);
            const g = Phaser.Math.Linear(color1.green, bgColor.green, ratio);
            const b = Phaser.Math.Linear(color1.blue, bgColor.blue, ratio);

            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, i, GAME_WIDTH, 1);
        }

        // Add speed lines effect
        for (let i = 0; i < 20; i++) {
            const line = this.add.rectangle(
                GAME_WIDTH + 100,
                Phaser.Math.Between(0, GAME_HEIGHT),
                Phaser.Math.Between(50, 150),
                2,
                0xffffff,
                0.3
            );

            this.tweens.add({
                targets: line,
                x: -200,
                duration: 1000 / this.gameState.speed,
                ease: 'Linear',
                repeat: -1,
                delay: i * 50
            });
        }
    }

    private createLivesDisplay() {
        const containerX = 50;
        const containerY = 50;

        this.livesDisplay = this.add.container(containerX, containerY);

        // Lives label
        const label = this.add.text(0, 0, 'LIVES:', {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.livesDisplay.add(label);

        // Heart icons - show current state without animation
        for (let i = 0; i < 4; i++) {
            if (i < this.gameState.lives) {
                // Active heart
                const heart = this.createHeart(80 + i * 35, 12);
                this.livesDisplay.add(heart);

                // Animate hearts
                this.tweens.add({
                    targets: heart,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 500,
                    ease: 'Sine.inOut',
                    yoyo: true,
                    repeat: -1,
                    delay: i * 100
                });
            } else {
                // Empty heart slot
                const emptyHeart = this.createHeart(80 + i * 35, 12);
                emptyHeart.alpha = 0.2;
                emptyHeart.fillStyle(0x666666);
                emptyHeart.fillPath();
                this.livesDisplay.add(emptyHeart);
            }
        }

        // Entrance animation
        this.tweens.add({
            targets: this.livesDisplay,
            alpha: { from: 0, to: 1 },
            x: { from: -100, to: containerX },
            duration: 500,
            ease: 'Back.out'
        });
    }

    private createHeart(x: number, y: number): Phaser.GameObjects.Graphics {
        const heart = this.add.graphics();
        heart.fillStyle(COLORS.primary);

        // Draw heart shape using simpler method
        heart.fillCircle(x - 5, y - 2, 6);
        heart.fillCircle(x + 5, y - 2, 6);
        heart.fillTriangle(x - 10, y + 2, x + 10, y + 2, x, y + 12);

        return heart;
    }

    private createScoreDisplay() {
        const scoreText = this.add.text(GAME_WIDTH - 50, 50, `SCORE: ${this.gameState.score}`, {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(1, 0);

        // Entrance animation
        this.tweens.add({
            targets: scoreText,
            alpha: { from: 0, to: 1 },
            x: { from: GAME_WIDTH + 100, to: GAME_WIDTH - 50 },
            duration: 500,
            ease: 'Back.out',
            delay: 100
        });

        // Pulse animation
        this.tweens.add({
            targets: scoreText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createSpeedIndicator() {
        const centerX = GAME_WIDTH / 2;
        const bottomY = GAME_HEIGHT - 80;

        this.speedIndicator = this.add.container(centerX, bottomY);

        // Speed label
        const speedLabel = this.add.text(0, 0, `SPEED x${this.gameState.speed}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Speed bars
        const barWidth = 40;
        const barHeight = 8;
        const barSpacing = 50;

        for (let i = 0; i < this.gameState.speed; i++) {
            const bar = this.add.rectangle(
                (i - (this.gameState.speed - 1) / 2) * barSpacing,
                25,
                barWidth,
                barHeight,
                COLORS.tertiary
            );

            this.speedIndicator.add(bar);

            // Animate bars
            this.tweens.add({
                targets: bar,
                scaleX: { from: 0, to: 1 },
                duration: 300,
                ease: 'Elastic.out',
                delay: 500 + i * 100
            });
        }

        this.speedIndicator.add(speedLabel);

        // Container animation
        this.tweens.add({
            targets: this.speedIndicator,
            y: { from: GAME_HEIGHT + 50, to: bottomY },
            duration: 600,
            ease: 'Back.out',
            delay: 200
        });
    }

    private showNextGameControls() {
        // Randomly select next microgame with intelligent shuffling
        if (MICROGAMES.length > 0) {
            // Initialize recentGames array if it doesn't exist
            if (!this.gameState.recentGames) {
                this.gameState.recentGames = [];
            }

            // Maximum number of games to remember in history
            const HISTORY_SIZE = Math.min(3, Math.floor(MICROGAMES.length / 2));

            let nextGame: MicrogameInfo;

            if (MICROGAMES.length <= HISTORY_SIZE + 1) {
                // If we have very few games, just avoid the immediate previous one
                let availableGames = MICROGAMES;
                if (this.gameState.previousGameKey && MICROGAMES.length > 1) {
                    availableGames = MICROGAMES.filter(game => game.key !== this.gameState.previousGameKey);
                }
                nextGame = Phaser.Utils.Array.GetRandom(availableGames);
            } else {
                // Create weighted selection based on recency
                const gameWeights = MICROGAMES.map(game => {
                    // Check if game is in recent history
                    const recentIndex = this.gameState.recentGames!.indexOf(game.key);

                    if (recentIndex === -1) {
                        // Game hasn't been played recently - high weight
                        return { game, weight: 100 };
                    } else {
                        // Recently played - lower weight based on how recent
                        // Most recent gets lowest weight, older games get higher weights
                        const age = this.gameState.recentGames!.length - recentIndex;
                        return { game, weight: age * 20 };
                    }
                });

                // Select game based on weights
                const totalWeight = gameWeights.reduce((sum, gw) => sum + gw.weight, 0);
                let random = Math.random() * totalWeight;

                for (const gameWeight of gameWeights) {
                    random -= gameWeight.weight;
                    if (random <= 0) {
                        nextGame = gameWeight.game;
                        break;
                    }
                }

                // Fallback in case something goes wrong
                if (!nextGame!) {
                    nextGame = Phaser.Utils.Array.GetRandom(MICROGAMES);
                }
            }

            this.nextGameKey = nextGame.key;
            const controls = nextGame.controls;

            // Create controls display container
            this.controlsDisplay = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
            this.controlsDisplay.setAlpha(0);

            // Show control icons based on type
            if (controls.toLowerCase().includes('mouse')) {
                this.createMouseIcon();
            } else if (controls.toLowerCase().includes('arrow')) {
                this.createArrowKeysIcon();
            } else if (controls.toLowerCase().includes('keyboard') || controls.toLowerCase().includes('type')) {
                this.createKeyboardIcon();
            } else if (controls.toLowerCase().includes('wasd')) {
                this.createWASDIcon();
            }

            // Add instruction text below icons
            const instructionText = this.add.text(0, 80, controls, {
                fontSize: '24px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            this.controlsDisplay.add(instructionText);

            // Dramatic entrance
            this.tweens.add({
                targets: this.controlsDisplay,
                alpha: 1,
                scaleX: { from: 0, to: 1 },
                scaleY: { from: 0, to: 1 },
                duration: 400,
                ease: 'Back.out',
                delay: 800
            });
        }
    }

    private createMouseIcon() {
        const mouseBody = this.add.graphics();

        // Mouse body
        mouseBody.fillStyle(0xFFFFFF, 1);
        mouseBody.lineStyle(4, 0x000000, 1);
        mouseBody.fillRoundedRect(-30, -40, 60, 80, 30);
        mouseBody.strokeRoundedRect(-30, -40, 60, 80, 30);

        // Mouse buttons divider
        mouseBody.lineStyle(3, 0x000000, 1);
        mouseBody.beginPath();
        mouseBody.moveTo(0, -40);
        mouseBody.lineTo(0, -10);
        mouseBody.stroke();

        // Scroll wheel
        mouseBody.fillStyle(0x666666, 1);
        mouseBody.fillRect(-5, -25, 10, 15);

        this.controlsDisplay.add(mouseBody);

        // Add movement arrows
        const leftArrow = this.add.text(-60, 0, '◀', {
            fontSize: '32px',
            color: '#FFE66D'
        }).setOrigin(0.5);

        const rightArrow = this.add.text(60, 0, '▶', {
            fontSize: '32px',
            color: '#FFE66D'
        }).setOrigin(0.5);

        this.controlsDisplay.add([leftArrow, rightArrow]);

        // Animate arrows
        this.tweens.add({
            targets: [leftArrow, rightArrow],
            alpha: { from: 0.5, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    private createArrowKeysIcon() {
        const keySize = 50;
        const gap = 5;

        // Create arrow keys
        const keys: Phaser.GameObjects.Graphics[] = [];
        const positions = [
            { x: 0, y: -keySize - gap, arrow: '▲' }, // Up
            { x: -keySize - gap, y: 0, arrow: '◀' }, // Left
            { x: 0, y: 0, arrow: '▼' }, // Down
            { x: keySize + gap, y: 0, arrow: '▶' } // Right
        ];

        positions.forEach((pos, index) => {
            const key = this.add.graphics();
            key.fillStyle(0x333333, 1);
            key.lineStyle(3, 0xFFFFFF, 1);
            key.fillRoundedRect(pos.x - keySize / 2, pos.y - keySize / 2, keySize, keySize, 8);
            key.strokeRoundedRect(pos.x - keySize / 2, pos.y - keySize / 2, keySize, keySize, 8);

            const arrow = this.add.text(pos.x, pos.y, pos.arrow, {
                fontSize: '28px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#FFFFFF'
            }).setOrigin(0.5);

            this.controlsDisplay.add([key, arrow]);
            keys.push(key);

            // Only highlight left and right for this game type
            if (index === 1 || index === 3) {
                this.tweens.add({
                    targets: key,
                    alpha: { from: 0.6, to: 1 },
                    duration: 600,
                    yoyo: true,
                    repeat: -1,
                    delay: index * 100
                });
            } else {
                key.alpha = 0.3;
                arrow.alpha = 0.3;
            }
        });
    }

    private createKeyboardIcon() {
        // Simplified keyboard representation
        const keyboardBg = this.add.graphics();
        keyboardBg.fillStyle(0x333333, 1);
        keyboardBg.lineStyle(3, 0xFFFFFF, 1);
        keyboardBg.fillRoundedRect(-100, -30, 200, 60, 10);
        keyboardBg.strokeRoundedRect(-100, -30, 200, 60, 10);

        this.controlsDisplay.add(keyboardBg);

        // Add some key representations
        const keyPositions = [
            { x: -70, y: -10 }, { x: -35, y: -10 }, { x: 0, y: -10 },
            { x: 35, y: -10 }, { x: 70, y: -10 },
            { x: -52, y: 20 }, { x: -17, y: 20 }, { x: 18, y: 20 }, { x: 53, y: 20 }
        ];

        const keys: Phaser.GameObjects.Graphics[] = [];
        keyPositions.forEach(pos => {
            const key = this.add.graphics();
            key.fillStyle(0x666666, 1);
            key.fillRoundedRect(pos.x - 12, pos.y - 12, 24, 24, 4);
            this.controlsDisplay.add(key);
            keys.push(key);
        });

        // Animate keys being pressed
        keys.forEach((key, index) => {
            this.tweens.add({
                targets: key,
                scaleY: 0.8,
                alpha: { from: 0.6, to: 1 },
                duration: 200,
                yoyo: true,
                repeat: -1,
                delay: index * 100
            });
        });
    }

    private createWASDIcon() {
        const keySize = 50;
        const gap = 5;

        // Create WASD keys
        const positions = [
            { x: 0, y: -keySize - gap, letter: 'W' }, // W
            { x: -keySize - gap, y: 0, letter: 'A' }, // A
            { x: 0, y: 0, letter: 'S' }, // S
            { x: keySize + gap, y: 0, letter: 'D' } // D
        ];

        positions.forEach((pos, index) => {
            const key = this.add.graphics();
            key.fillStyle(0x333333, 1);
            key.lineStyle(3, 0xFFFFFF, 1);
            key.fillRoundedRect(pos.x - keySize / 2, pos.y - keySize / 2, keySize, keySize, 8);
            key.strokeRoundedRect(pos.x - keySize / 2, pos.y - keySize / 2, keySize, keySize, 8);

            const letter = this.add.text(pos.x, pos.y, pos.letter, {
                fontSize: '32px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#FFFFFF'
            }).setOrigin(0.5);

            this.controlsDisplay.add([key, letter]);

            // Animate keys
            this.tweens.add({
                targets: key,
                alpha: { from: 0.6, to: 1 },
                duration: 600,
                yoyo: true,
                repeat: -1,
                delay: index * 100
            });
        });
    }

    private startCountdown() {
        let countdown = 3;

        this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, '', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Countdown timer
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (countdown > 0) {
                    this.countdownText.setText(countdown.toString());

                    // Countdown animation
                    this.tweens.add({
                        targets: this.countdownText,
                        scaleX: { from: 2, to: 1 },
                        scaleY: { from: 2, to: 1 },
                        alpha: { from: 0, to: 1 },
                        duration: 300,
                        ease: 'Power2'
                    });

                    countdown--;
                } else {
                    // Transition to microgame
                    this.transitionToGame();
                }
            },
            repeat: 3,
            startAt: 500
        });
    }

    private transitionToGame() {
        // Add a 0.5 second delay before transitioning
        this.time.delayedCall(500, () => {
            // Flash effect
            const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF)
                .setAlpha(0);

            this.tweens.add({
                targets: flash,
                alpha: 1,
                duration: 200,
                yoyo: true,
                onComplete: () => {
                    if (this.nextGameKey && this.scene.get(this.nextGameKey)) {
                        // Update game history
                        if (!this.gameState.recentGames) {
                            this.gameState.recentGames = [];
                        }

                        // Add the current game to recent games history
                        this.gameState.recentGames.push(this.nextGameKey);

                        // Keep only the last N games in history
                        const HISTORY_SIZE = Math.min(3, Math.floor(MICROGAMES.length / 2));
                        if (this.gameState.recentGames.length > HISTORY_SIZE) {
                            this.gameState.recentGames.shift(); // Remove oldest game
                        }

                        // Also update previousGameKey for backward compatibility
                        this.gameState.previousGameKey = this.nextGameKey;

                        // Start the selected microgame
                        this.scene.start(this.nextGameKey, { gameState: this.gameState });
                    } else {
                        // Fallback to title if no game available
                        console.warn('No microgame available, returning to title');
                        this.scene.start('TitleScene');
                    }
                }
            });
        });
    }

    private showDramaticHeartBreak() {
        // Delay the dramatic animation slightly
        this.time.delayedCall(300, () => {
            // Create a giant heart in the center of the screen
            const centerX = GAME_WIDTH / 2;
            const centerY = GAME_HEIGHT / 2;

            // Create container for the breaking heart
            const heartContainer = this.add.container(centerX, centerY);
            heartContainer.setScale(0);
            heartContainer.setAlpha(0);

            // Left half of heart
            const leftHalf = this.add.graphics();
            leftHalf.fillStyle(COLORS.primary);
            leftHalf.fillCircle(-25, -15, 30);
            leftHalf.fillTriangle(0, 60, -50, 5, 0, -10);

            // Right half of heart  
            const rightHalf = this.add.graphics();
            rightHalf.fillStyle(COLORS.primary);
            rightHalf.fillCircle(25, -15, 30);
            rightHalf.fillTriangle(0, 60, 50, 5, 0, -10);

            // Add jagged crack line
            const crack = this.add.graphics();
            crack.lineStyle(4, 0x000000, 0);
            crack.beginPath();
            crack.moveTo(0, -40);
            crack.lineTo(-5, -20);
            crack.lineTo(3, 0);
            crack.lineTo(-2, 20);
            crack.lineTo(4, 40);
            crack.lineTo(0, 60);
            crack.stroke();

            heartContainer.add([leftHalf, rightHalf, crack]);

            // Heart appears with impact
            this.tweens.add({
                targets: heartContainer,
                scale: { from: 0, to: 1.5 },
                alpha: { from: 0, to: 1 },
                duration: 300,
                ease: 'Back.out',
                onComplete: () => {
                    // Screen shake
                    this.cameras.main.shake(400, 0.03);

                    // TODO: Add breaking sound effect here

                    // Show crack
                    this.tweens.add({
                        targets: crack,
                        alpha: 1,
                        duration: 100
                    });

                    // Break apart animation
                    this.time.delayedCall(200, () => {
                        // Animate halves separating
                        this.tweens.add({
                            targets: leftHalf,
                            x: -30,
                            angle: -15,
                            duration: 600,
                            ease: 'Power2.in'
                        });

                        this.tweens.add({
                            targets: rightHalf,
                            x: 30,
                            angle: 15,
                            duration: 600,
                            ease: 'Power2.in'
                        });

                        // Fade out the whole container
                        this.tweens.add({
                            targets: heartContainer,
                            alpha: 0,
                            y: centerY + 50,
                            duration: 600,
                            delay: 200,
                            onComplete: () => heartContainer.destroy()
                        });

                        // Add falling particles
                        for (let i = 0; i < 12; i++) {
                            const particle = this.add.circle(
                                centerX + Phaser.Math.Between(-40, 40),
                                centerY + Phaser.Math.Between(-20, 20),
                                Phaser.Math.Between(3, 8),
                                COLORS.primary
                            );

                            this.tweens.add({
                                targets: particle,
                                y: particle.y + Phaser.Math.Between(100, 200),
                                x: particle.x + Phaser.Math.Between(-50, 50),
                                alpha: 0,
                                duration: Phaser.Math.Between(800, 1200),
                                ease: 'Power2.in',
                                onComplete: () => particle.destroy()
                            });
                        }
                    });
                }
            });

            // Red flash overlay
            const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFF0000, 0);
            this.tweens.add({
                targets: flash,
                alpha: { from: 0.5, to: 0 },
                duration: 600,
                ease: 'Power2.out',
                onComplete: () => flash.destroy()
            });

            // Add "LIFE LOST" text
            const lostText = this.add.text(centerX, centerY - 150, 'LIFE LOST!', {
                fontSize: '48px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#FF0000',
                stroke: '#000000',
                strokeThickness: 6
            }).setOrigin(0.5).setAlpha(0);

            this.tweens.add({
                targets: lostText,
                alpha: 1,
                y: centerY - 120,
                duration: 400,
                ease: 'Power2.out',
                delay: 300
            });

            this.tweens.add({
                targets: lostText,
                alpha: 0,
                duration: 400,
                delay: 1500,
                onComplete: () => lostText.destroy()
            });
        });
    }
} 