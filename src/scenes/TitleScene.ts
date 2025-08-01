import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, INITIAL_GAME_STATE, GameState } from '../GameConfig';
import { AudioManager } from '../AudioManager';

export default class TitleScene extends Phaser.Scene {
    private titleText!: Phaser.GameObjects.Text;
    private startButton!: Phaser.GameObjects.Container;
    private gameState: GameState;

    constructor() {
        super({ key: 'TitleScene' });
        this.gameState = { ...INITIAL_GAME_STATE };
    }

    create() {
        // Initialize and play title music
        const audioManager = AudioManager.getInstance(this);
        audioManager.playTitleMusic();

        // Handle browser autoplay policies - try to play music on first interaction
        let musicStarted = false;
        const tryPlayMusic = () => {
            if (!musicStarted) {
                audioManager.playTitleMusic();
                musicStarted = true;
            }
        };

        // Add various interaction listeners to ensure music plays
        this.input.on('pointerdown', tryPlayMusic);
        this.input.keyboard?.on('keydown', tryPlayMusic);

        // Create animated background
        this.createAnimatedBackground();

        // Create title
        this.createTitle();

        // Create start button
        this.createStartButton();

        // Create debug button
        this.createDebugButton();

        // Create blog button
        this.createBlogButton();

        // Create decorative elements
        this.createDecorations();

        // Add keyboard shortcut
        this.input.keyboard?.on('keydown-SPACE', () => this.startGame());

        // Add debug shortcut
        this.input.keyboard?.on('keydown-D', () => this.openDebugMenu());
    }

    private createAnimatedBackground() {
        // Create a bright, fun gradient background
        const graphics = this.add.graphics();

        // Draw a vibrant gradient using fun colors
        for (let i = 0; i < GAME_HEIGHT; i++) {
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                Phaser.Display.Color.ValueToColor(0xFF6EC7),  // Bright pink
                Phaser.Display.Color.ValueToColor(0x74D0F1),  // Sky blue
                GAME_HEIGHT,
                i
            );
            graphics.fillStyle(color.color);
            graphics.fillRect(0, i, GAME_WIDTH, 1);
        }

        // Create a repeating pattern texture
        const patternGraphics = this.make.graphics({});
        const patternSize = 60;

        // Draw fun pattern elements
        patternGraphics.fillStyle(0xFFE66D, 0.15); // Yellow circles
        patternGraphics.fillCircle(patternSize / 4, patternSize / 4, 12);
        patternGraphics.fillCircle(patternSize * 3 / 4, patternSize * 3 / 4, 12);

        patternGraphics.fillStyle(0x4ECDC4, 0.15); // Teal diamonds
        patternGraphics.fillTriangle(
            patternSize / 2, patternSize / 4 - 8,
            patternSize / 2 - 8, patternSize / 2,
            patternSize / 2 + 8, patternSize / 2
        );
        patternGraphics.fillTriangle(
            patternSize / 2, patternSize * 3 / 4 + 8,
            patternSize / 2 - 8, patternSize / 2,
            patternSize / 2 + 8, patternSize / 2
        );

        patternGraphics.fillStyle(0xFF6B6B, 0.1); // Red squares
        patternGraphics.fillRect(5, 5, 10, 10);
        patternGraphics.fillRect(patternSize - 15, patternSize - 15, 10, 10);

        // Generate texture from pattern
        patternGraphics.generateTexture('bgPattern', patternSize, patternSize);
        patternGraphics.destroy();

        // Create tiling sprite for the pattern
        const tilingSprite = this.add.tileSprite(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            GAME_WIDTH * 1.5,  // Make it wider for diagonal movement
            GAME_HEIGHT * 1.5, // Make it taller for diagonal movement
            'bgPattern'
        );
        tilingSprite.setAlpha(0.5);
        tilingSprite.setAngle(-15); // Slight angle for more dynamic feel

        // Animate the pattern movement
        this.tweens.add({
            targets: tilingSprite,
            tilePositionX: '+=100',
            tilePositionY: '+=100',
            duration: 10000,
            repeat: -1,
            ease: 'Linear'
        });

        // Add colorful floating bubbles/particles
        const particleConfig: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig = {
            x: { min: 0, max: GAME_WIDTH },
            y: GAME_HEIGHT + 20,
            lifespan: 8000,
            speedY: { min: -80, max: -40 },
            speedX: { min: -20, max: 20 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.7, end: 0 },
            frequency: 100,
            tint: [0xFF6EC7, 0xFFE66D, 0x4ECDC4, 0x95E1D3, 0xFF6B6B]
        };

        // Create bubble particles
        const bubbleGraphics = this.make.graphics({});
        bubbleGraphics.fillStyle(0xffffff);
        bubbleGraphics.fillCircle(8, 8, 8);
        bubbleGraphics.generateTexture('bubble', 16, 16);
        bubbleGraphics.destroy();

        this.add.particles(0, 0, 'bubble', particleConfig);

        // Add some animated floating shapes in the background
        for (let i = 0; i < 5; i++) {
            const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
            const y = Phaser.Math.Between(100, GAME_HEIGHT - 100);
            const size = Phaser.Math.Between(30, 60);
            const color = Phaser.Utils.Array.GetRandom([0xFFE66D, 0x4ECDC4, 0xFF6B6B, 0x95E1D3]);

            const floatingShape = this.add.circle(x, y, size, color, 0.1);

            // Float animation
            this.tweens.add({
                targets: floatingShape,
                y: y - 30,
                x: x + Phaser.Math.Between(-20, 20),
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // Pulse animation
            this.tweens.add({
                targets: floatingShape,
                scale: { from: 1, to: 1.2 },
                alpha: { from: 0.1, to: 0.2 },
                duration: Phaser.Math.Between(1500, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    private createTitle() {
        // Main title
        this.titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3, 'VIBEWARE', {
            fontSize: '72px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 0,
                fill: true
            },
            resolution: 2
        }).setOrigin(0.5);

        // Subtitle
        const subtitle = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 3 + 60, 'Microgame Madness!', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFE66D',
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 2
        }).setOrigin(0.5);

        // Title animations
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // Subtitle wiggle
        this.tweens.add({
            targets: subtitle,
            angle: { from: -2, to: 2 },
            duration: 500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createStartButton() {
        const buttonY = GAME_HEIGHT * 0.65;

        // Button container
        this.startButton = this.add.container(GAME_WIDTH / 2, buttonY);

        // Button background
        const buttonBg = this.add.rectangle(0, 0, 200, 60, COLORS.primary)
            .setStrokeStyle(4, 0x000000);

        // Button text
        const buttonText = this.add.text(0, 0, 'START!', {
            fontSize: '32px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
            resolution: 2
        }).setOrigin(0.5);

        this.startButton.add([buttonBg, buttonText]);

        // Make button interactive
        buttonBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                this.tweens.add({
                    targets: this.startButton,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100
                });
                buttonBg.setFillStyle(COLORS.tertiary);
            })
            .on('pointerout', () => {
                this.tweens.add({
                    targets: this.startButton,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
                buttonBg.setFillStyle(COLORS.primary);
            })
            .on('pointerdown', () => this.startGame());

        // Button idle animation
        this.tweens.add({
            targets: this.startButton,
            y: buttonY + 10,
            duration: 800,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createDebugButton() {
        const debugButton = this.add.container(GAME_WIDTH - 100, 50);

        const bg = this.add.rectangle(0, 0, 150, 40, 0x333333, 0.8)
            .setStrokeStyle(2, 0x00FF00);

        const text = this.add.text(0, 0, 'DEBUG [D]', {
            fontSize: '18px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#00FF00',
            resolution: 2
        }).setOrigin(0.5);

        debugButton.add([bg, text]);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x00FF00, 0.3);
                this.tweens.add({
                    targets: debugButton,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x333333, 0.8);
                this.tweens.add({
                    targets: debugButton,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            })
            .on('pointerdown', () => this.openDebugMenu());

        // Subtle pulse
        this.tweens.add({
            targets: text,
            alpha: { from: 0.7, to: 1 },
            duration: 1000,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createBlogButton() {
        const blogButton = this.add.container(100, 50);

        const bg = this.add.rectangle(0, 0, 130, 40, 0x4ECDC4, 0.8)
            .setStrokeStyle(2, 0xFFE66D);

        const text = this.add.text(0, 0, 'ABOUT', {
            fontSize: '18px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FFFFFF',
            resolution: 2
        }).setOrigin(0.5);

        blogButton.add([bg, text]);

        bg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0xFFE66D, 0.8);
                this.tweens.add({
                    targets: blogButton,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 100
                });
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x4ECDC4, 0.8);
                this.tweens.add({
                    targets: blogButton,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 100
                });
            })
            .on('pointerdown', () => {
                window.open('./blog.html', '_blank');
            });

        // Subtle pulse
        this.tweens.add({
            targets: bg,
            alpha: { from: 0.6, to: 0.9 },
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });
    }

    private createDecorations() {
        // Add some fun shapes around the screen
        const shapes = ['triangle', 'circle', 'square', 'star'];
        const colors = [COLORS.primary, COLORS.secondary, COLORS.tertiary, COLORS.quaternary];

        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
            const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
            const color = Phaser.Utils.Array.GetRandom(colors);
            const size = Phaser.Math.Between(20, 40);

            let shape: Phaser.GameObjects.Graphics = this.add.graphics();
            shape.fillStyle(color, 0.7);

            const shapeType = Phaser.Utils.Array.GetRandom(shapes);

            switch (shapeType) {
                case 'triangle':
                    shape.fillTriangle(x, y - size / 2, x - size / 2, y + size / 2, x + size / 2, y + size / 2);
                    break;
                case 'circle':
                    shape.fillCircle(x, y, size / 2);
                    break;
                case 'square':
                    shape.fillRect(x - size / 2, y - size / 2, size, size);
                    break;
                case 'star':
                    this.drawStar(shape, x, y, 5, size / 2, size / 4);
                    break;
            }

            // Animate the shapes
            this.tweens.add({
                targets: shape,
                angle: 360,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1
            });

            this.tweens.add({
                targets: shape,
                alpha: { from: 0.7, to: 0.3 },
                duration: Phaser.Math.Between(1000, 2000),
                yoyo: true,
                repeat: -1
            });
        }

        // Add instructions
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'Press SPACE or click START to begin!', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            resolution: 2
        }).setOrigin(0.5).setAlpha(0.8);
    }

    private drawStar(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        const step = Math.PI / spikes;

        graphics.beginPath();
        graphics.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            graphics.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            graphics.lineTo(x, y);
            rot += step;
        }

        graphics.lineTo(cx, cy - outerRadius);
        graphics.closePath();
        graphics.fillPath();
    }

    private startGame() {
        // Fade out music
        const audioManager = AudioManager.getInstance();
        audioManager.fadeOutMusic(300);

        // Add a zoom effect before transitioning
        this.tweens.add({
            targets: this.cameras.main,
            zoom: 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                this.scene.start('TransitionScene', { gameState: this.gameState });
            }
        });
    }

    private openDebugMenu() {
        // Fade out music
        const audioManager = AudioManager.getInstance();
        audioManager.fadeOutMusic(300);

        this.tweens.add({
            targets: this.cameras.main,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.scene.start('DebugMenuScene');
            }
        });
    }
} 