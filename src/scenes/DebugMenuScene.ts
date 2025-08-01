import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, MICROGAMES, MicrogameInfo, INITIAL_GAME_STATE } from '../GameConfig';

export default class DebugMenuScene extends Phaser.Scene {
    private gameButtons: Phaser.GameObjects.Container[] = [];
    private selectedIndex: number = 0;
    private scrollContainer!: Phaser.GameObjects.Container;
    private scrollY: number = 0;
    private maxScrollY: number = 0;
    private viewportHeight: number = 380; // Height of the scrollable area
    private viewportMask!: Phaser.Display.Masks.GeometryMask;
    private scrollUpIndicator!: Phaser.GameObjects.Container;
    private scrollDownIndicator!: Phaser.GameObjects.Container;

    constructor() {
        super({ key: 'DebugMenuScene' });
    }

    init() {
        // Reset scene state when entering
        this.gameButtons = [];
        this.selectedIndex = 0;
        this.scrollY = 0;
        this.maxScrollY = 0;
    }

    create() {
        // Create background
        this.createBackground();

        // Create title
        this.createTitle();

        // Create scrollable container for game buttons
        this.scrollContainer = this.add.container(0, 0);

        // Create viewport mask
        const maskShape = this.make.graphics({ x: 0, y: 0 }, false);
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(0, 150, GAME_WIDTH, this.viewportHeight);
        this.viewportMask = maskShape.createGeometryMask();
        this.scrollContainer.setMask(this.viewportMask);

        // Create scroll indicators first (before game buttons)
        this.createScrollIndicators();

        // Create game buttons
        this.createGameButtons();

        // Create back button
        this.createBackButton();

        // Add keyboard navigation
        this.setupKeyboardControls();

        // Add mouse wheel support
        this.setupMouseWheel();
    }

    private createBackground() {
        const graphics = this.add.graphics();

        // Dark gradient background
        const darkGray = Phaser.Display.Color.IntegerToColor(0x202020);
        const black = Phaser.Display.Color.IntegerToColor(0x101010);

        for (let i = 0; i < GAME_HEIGHT; i++) {
            const ratio = i / GAME_HEIGHT;
            const r = Phaser.Math.Linear(darkGray.red, black.red, ratio);
            const g = Phaser.Math.Linear(darkGray.green, black.green, ratio);
            const b = Phaser.Math.Linear(darkGray.blue, black.blue, ratio);

            graphics.fillStyle(Phaser.Display.Color.GetColor(r, g, b));
            graphics.fillRect(0, i, GAME_WIDTH, 1);
        }

        // Grid pattern
        graphics.lineStyle(1, 0x333333, 0.3);
        for (let x = 0; x < GAME_WIDTH; x += 40) {
            graphics.lineBetween(x, 0, x, GAME_HEIGHT);
        }
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            graphics.lineBetween(0, y, GAME_WIDTH, y);
        }
    }

    private createTitle() {
        const title = this.add.text(GAME_WIDTH / 2, 50, 'DEBUG MENU', {
            fontSize: '48px',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold',
            color: '#00ff00',
            resolution: 2
        }).setOrigin(0.5).setStroke('#000000', 6).setPadding(4);

        // Glitch effect
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.tweens.add({
                    targets: title,
                    x: title.x + Phaser.Math.Between(-2, 2),
                    duration: 50,
                    repeat: 3,
                    yoyo: true
                });
            },
            repeat: -1
        });

        this.add.text(GAME_WIDTH / 2, 90, 'Select a microgame to test', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
    }

    private createGameButtons() {
        const startY = 150; // Start at viewport position
        const buttonHeight = 100;
        const buttonSpacing = 20;

        MICROGAMES.forEach((game, index) => {
            const container = this.createGameButton(game, index, startY + (buttonHeight + buttonSpacing) * index);
            this.gameButtons.push(container);
            // Add to scroll container
            this.scrollContainer.add(container);
        });

        // Calculate max scroll
        const totalHeight = MICROGAMES.length * (buttonHeight + buttonSpacing);
        this.maxScrollY = Math.max(0, totalHeight - this.viewportHeight);

        // If no games, show placeholder
        if (MICROGAMES.length === 0) {
            this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'No microgames available yet!', {
                fontSize: '24px',
                fontFamily: 'Arial, sans-serif',
                color: '#666666',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        } else {
            // Highlight first button
            this.highlightButton(0);
            // Update scroll indicators
            this.updateScrollIndicators();
        }
    }

    private createGameButton(game: MicrogameInfo, index: number, y: number): Phaser.GameObjects.Container {
        const container = this.add.container(GAME_WIDTH / 2, y);

        // Button background
        const bg = this.add.rectangle(0, 0, GAME_WIDTH - 100, 90, 0x1a1a1a)
            .setStrokeStyle(3, 0x333333);

        // Game name
        const nameText = this.add.text(-350, -20, game.name, {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            resolution: 2
        });

        // Prompt badge
        const promptBg = this.add.rectangle(250, -20, 100, 30, COLORS.secondary)
            .setStrokeStyle(2, 0x000000);
        const promptText = this.add.text(250, -20, game.prompt, {
            fontSize: '16px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            resolution: 2
        }).setOrigin(0.5);

        // Description
        const descText = this.add.text(-350, 5, game.description, {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#CCCCCC',
            resolution: 2
        });

        // Controls
        const controlsText = this.add.text(-350, 25, `Controls: ${game.controls}`, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#999999',
            resolution: 2
        });

        container.add([bg, nameText, promptBg, promptText, descText, controlsText]);

        // Make interactive
        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.selectedIndex = index;
                this.highlightButton(index);
            })
            .on('pointerdown', () => {
                this.launchGame(game.key);
            });

        // Store reference to background for highlighting
        container.setData('background', bg);

        // Don't add to scene here - it will be added to scrollContainer
        return container;
    }

    private createBackButton() {
        const backButton = this.add.container(80, GAME_HEIGHT - 50);

        const bg = this.add.rectangle(0, 0, 120, 40, 0x333333)
            .setStrokeStyle(2, 0x666666);

        const text = this.add.text(0, 0, '← BACK', {
            fontSize: '20px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            resolution: 2
        }).setOrigin(0.5);

        backButton.add([bg, text]);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x555555);
                this.tweens.add({
                    targets: backButton,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x333333);
                this.tweens.add({
                    targets: backButton,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            })
            .on('pointerdown', () => {
                this.scene.start('TitleScene');
            });
    }

    private setupKeyboardControls() {
        // Arrow keys for navigation
        this.input.keyboard?.on('keydown-UP', () => {
            if (this.gameButtons.length > 0) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
                this.highlightButton(this.selectedIndex);
                this.ensureButtonVisible(this.selectedIndex);
            }
        });

        this.input.keyboard?.on('keydown-DOWN', () => {
            if (this.gameButtons.length > 0) {
                this.selectedIndex = Math.min(this.gameButtons.length - 1, this.selectedIndex + 1);
                this.highlightButton(this.selectedIndex);
                this.ensureButtonVisible(this.selectedIndex);
            }
        });

        // Enter/Space to select
        this.input.keyboard?.on('keydown-ENTER', () => {
            if (this.gameButtons.length > 0) {
                this.launchGame(MICROGAMES[this.selectedIndex].key);
            }
        });

        this.input.keyboard?.on('keydown-SPACE', () => {
            if (this.gameButtons.length > 0) {
                this.launchGame(MICROGAMES[this.selectedIndex].key);
            }
        });

        // ESC to go back
        this.input.keyboard?.on('keydown-ESC', () => {
            this.scene.start('TitleScene');
        });

        // Page Up/Down for faster scrolling
        this.input.keyboard?.on('keydown-PAGE_UP', () => {
            this.scrollTo(this.scrollY - this.viewportHeight);
        });

        this.input.keyboard?.on('keydown-PAGE_DOWN', () => {
            this.scrollTo(this.scrollY + this.viewportHeight);
        });
    }

    private ensureButtonVisible(index: number) {
        if (this.gameButtons.length === 0 || index < 0 || index >= this.gameButtons.length) return;

        const button = this.gameButtons[index];
        const buttonY = button.y - 150; // Adjust for viewport offset
        const buttonTop = buttonY - 45; // Half button height
        const buttonBottom = buttonY + 45;

        if (buttonTop < this.scrollY) {
            // Scroll up to show button
            this.scrollTo(buttonTop);
        } else if (buttonBottom > this.scrollY + this.viewportHeight) {
            // Scroll down to show button  
            this.scrollTo(buttonBottom - this.viewportHeight);
        }
    }

    private highlightButton(index: number) {
        // Ensure we have valid buttons
        if (this.gameButtons.length === 0) return;

        // Clamp index to valid range
        index = Math.max(0, Math.min(index, this.gameButtons.length - 1));

        // Reset all buttons
        this.gameButtons.forEach((button, i) => {
            const bg = button.getData('background') as Phaser.GameObjects.Rectangle;

            // Safety check
            if (!bg || !bg.scene) return;

            if (i === index) {
                bg.setFillStyle(0x2a2a2a);
                bg.setStrokeStyle(3, COLORS.secondary);
                this.tweens.add({
                    targets: button,
                    x: GAME_WIDTH / 2 + 10,
                    duration: 200,
                    ease: 'Power2'
                });
            } else {
                bg.setFillStyle(0x1a1a1a);
                bg.setStrokeStyle(3, 0x333333);
                this.tweens.add({
                    targets: button,
                    x: GAME_WIDTH / 2,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });
    }

    private launchGame(gameKey: string) {
        // Create debug game state
        const debugState = {
            ...INITIAL_GAME_STATE,
            debugMode: true
        };

        // Flash effect
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xFFFFFF, 0);
        this.tweens.add({
            targets: flash,
            alpha: 1,
            duration: 200,
            yoyo: true,
            onComplete: () => {
                this.scene.start(gameKey, { gameState: debugState });
            }
        });
    }

    private createScrollIndicators() {
        // Up indicator
        this.scrollUpIndicator = this.add.container(GAME_WIDTH / 2, 140);
        const upBg = this.add.rectangle(0, 0, 60, 20, 0x000000, 0.7);
        const upArrow = this.add.text(0, 0, '▲', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            resolution: 2
        }).setOrigin(0.5);
        this.scrollUpIndicator.add([upBg, upArrow]);
        this.scrollUpIndicator.setVisible(false);

        // Down indicator
        this.scrollDownIndicator = this.add.container(GAME_WIDTH / 2, 540);
        const downBg = this.add.rectangle(0, 0, 60, 20, 0x000000, 0.7);
        const downArrow = this.add.text(0, 0, '▼', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            resolution: 2
        }).setOrigin(0.5);
        this.scrollDownIndicator.add([downBg, downArrow]);
        this.scrollDownIndicator.setVisible(false);

        // Add pulsing animation to indicators
        this.tweens.add({
            targets: [this.scrollUpIndicator, this.scrollDownIndicator],
            alpha: { from: 0.5, to: 1 },
            duration: 800,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private updateScrollIndicators() {
        this.scrollUpIndicator.setVisible(this.scrollY > 0);
        this.scrollDownIndicator.setVisible(this.scrollY < this.maxScrollY);
    }

    private setupMouseWheel() {
        this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _deltaX: number, deltaY: number, _deltaZ: number) => {
            this.scrollY -= deltaY * 0.5;
            this.constrainScroll();
        });
    }

    private constrainScroll() {
        this.scrollY = Phaser.Math.Clamp(this.scrollY, 0, this.maxScrollY);
        this.scrollContainer.y = -this.scrollY;
        this.updateScrollIndicators();
    }

    private scrollTo(newScrollY: number) {
        // Clamp scroll position
        this.scrollY = Phaser.Math.Clamp(newScrollY, 0, this.maxScrollY);

        // Update container position
        this.scrollContainer.y = -this.scrollY;

        // Update scroll indicators
        this.updateScrollIndicators();
    }
} 