import Phaser from 'phaser';
import BaseMicrogame from '../BaseMicrogame';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../GameConfig';

interface Fruit {
    sprite: Phaser.GameObjects.Container;
    x: number;
    y: number;
    vx: number;
    vy: number;
    type: 'watermelon' | 'banana';
    sliced: boolean;
    rotation: number;
    rotationSpeed: number;
}

interface Particle {
    sprite: Phaser.GameObjects.Rectangle;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
}

export default class FruitSliceGame extends BaseMicrogame {
    private fruits: Fruit[] = [];
    private particles: Particle[] = [];
    private slashPoints: Phaser.Math.Vector2[] = [];
    private slashGraphics!: Phaser.GameObjects.Graphics;
    private fruitsSliced: number = 0;

    constructor() {
        super({ key: 'FruitSliceGame' });
    }

    getPrompt(): string {
        return 'SLICE!';
    }

    getGameDuration(): number {
        return 5000;
    }

    setupGame(): void {
        // Create atmospheric background
        this.createStandardBackground(0x87CEEB, 0xFFE5B4);

        // Create slash graphics
        this.slashGraphics = this.add.graphics();

        // Spawn initial fruits
        this.spawnFruit('watermelon');
        this.spawnFruit('banana');
        this.spawnFruit('watermelon');

        // Add instruction text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Move cursor over fruits to slice them!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
    }

    setupControls(): void {
        const input = this.input;
        if (!input) return;

        input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Always check for collisions on mouse movement
            this.checkSlashCollisions(pointer.x, pointer.y);

            // Add to slash trail for visual feedback
            this.slashPoints.push(new Phaser.Math.Vector2(pointer.x, pointer.y));

            // Keep trail short
            if (this.slashPoints.length > 10) {
                this.slashPoints.shift();
            }
        });
    }

    cleanupControls(): void {
        this.input.off('pointermove');
    }

    resetGameState(): void {
        this.fruitsSliced = 0;
        this.fruits = [];
        this.particles = [];
        this.slashPoints = [];
    }

    private spawnFruit(type: 'watermelon' | 'banana'): void {
        const container = this.add.container(
            Math.random() * (GAME_WIDTH - 100) + 50,
            GAME_HEIGHT - 50  // Start fruits higher up so they're visible sooner
        );

        // Create fruit shape
        if (type === 'watermelon') {
            const circle = this.add.circle(0, 0, 40, COLORS.primary);
            const inner = this.add.circle(0, 0, 35, 0x4CAF50);
            const flesh = this.add.circle(0, 0, 30, COLORS.primary);
            container.add([circle, inner, flesh]);

            // Add seeds
            for (let i = 0; i < 5; i++) {
                const angle = (Math.PI * 2 * i) / 5;
                const seed = this.add.circle(
                    Math.cos(angle) * 15,
                    Math.sin(angle) * 15,
                    3,
                    0x000000
                );
                container.add(seed);
            }
        } else {
            const banana = this.add.ellipse(0, 0, 80, 40, COLORS.tertiary);
            const shadow = this.add.ellipse(5, 0, 70, 35, 0xE6C200);
            container.add([banana, shadow]);
        }

        this.fruits.push({
            sprite: container,
            x: container.x,
            y: container.y,
            vx: (Math.random() - 0.5) * 2,  // Reduced horizontal speed
            vy: -18,  // Slightly reduced upward velocity
            type,
            sliced: false,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    private createJuiceParticles(x: number, y: number, color: number): void {
        for (let i = 0; i < 10; i++) {
            const angle = (Math.PI * 2 * i) / 10;
            const speed = 2 + Math.random() * 3;
            const particle = this.add.rectangle(x, y, 4, 4, color);

            this.particles.push({
                sprite: particle,
                x: particle.x,
                y: particle.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 50 + Math.random() * 20
            });
        }
    }

    private checkSlashCollisions(x: number, y: number): void {
        this.fruits.forEach(fruit => {
            if (!fruit.sliced) {
                const dx = x - fruit.x;
                const dy = y - fruit.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 70) {  // Increased collision radius for easier slicing
                    fruit.sliced = true;
                    fruit.sprite.destroy();
                    this.fruitsSliced++;

                    this.createJuiceParticles(
                        fruit.x,
                        fruit.y,
                        fruit.type === 'watermelon' ? COLORS.primary : COLORS.tertiary
                    );

                    if (this.fruitsSliced >= 3) {
                        this.setWinState();
                    }
                }
            }
        });
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        // Update fruits
        this.fruits.forEach(fruit => {
            if (!fruit.sliced) {
                fruit.vy += 0.3; // reduced gravity for longer air time
                fruit.x += fruit.vx;
                fruit.y += fruit.vy;
                fruit.rotation += fruit.rotationSpeed;
                fruit.sprite.setPosition(fruit.x, fruit.y);
                fruit.sprite.setRotation(fruit.rotation);

                // Check if fruit fell off screen
                if (fruit.y > GAME_HEIGHT + 100) {
                    this.setFailState();
                }
            }
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.vy += 0.2; // gravity
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.sprite.setPosition(particle.x, particle.y);
            particle.sprite.setAlpha(particle.life / 50);

            if (particle.life <= 0) {
                particle.sprite.destroy();
                return false;
            }
            return true;
        });

        // Draw slash trail
        if (this.slashPoints.length > 1) {
            this.slashGraphics.clear();
            this.slashGraphics.lineStyle(3, 0xFFFFFF, 0.8);
            this.slashGraphics.beginPath();
            this.slashGraphics.moveTo(this.slashPoints[0].x, this.slashPoints[0].y);

            for (let i = 1; i < this.slashPoints.length; i++) {
                this.slashGraphics.lineTo(this.slashPoints[i].x, this.slashPoints[i].y);
            }

            this.slashGraphics.strokePath();
        } else {
            this.slashGraphics.clear();
        }
    }
} 