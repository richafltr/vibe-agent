import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class ClickGame extends BaseMicrogame {
    private target!: Phaser.GameObjects.Rectangle;
    private particles?: Phaser.GameObjects.Particles.ParticleEmitter;

    constructor() {
        super({ key: 'ClickGame' });
    }

    getPrompt(): string {
        return 'CLICK!';
    }

    getGameDuration(): number {
        return 4000; // 4 seconds
    }

    setupGame(): void {
        this.createBackground();
        this.createTarget();
    }

    setupControls(): void {
        this.input.on('pointerdown', this.handleClick, this);
    }

    cleanupControls(): void {
        this.input.off('pointerdown', this.handleClick, this);
    }

    resetGameState(): void {
        // Clean up any particles
        if (this.particles) {
            this.particles.destroy();
            this.particles = undefined;
        }
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        // Game update logic here if needed
    }

    private createBackground() {
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);
    }

    private createTarget() {
        const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
        const y = Phaser.Math.Between(50, GAME_HEIGHT - 50);
        this.target = this.add.rectangle(x, y, 50, 50, COLORS.neon.yellow);
        this.target.setInteractive();
    }

    private handleClick(pointer: Phaser.Input.Pointer) {
        if (this.target.getBounds().contains(pointer.x, pointer.y)) {
            this.playWinAnimation();
            this.setWinState();
        } else {
            this.playFailAnimation(pointer.x, pointer.y);
            this.setFailState();
        }
    }

    private playWinAnimation() {
        const animations = [
            () => this.winConfetti(),
            () => this.winSpinAndGrow(),
            () => this.winRainbow(),
            () => this.winFireworks(),
            () => this.winBounce()
        ];

        // Pick a random animation
        const randomAnimation = Phaser.Math.RND.pick(animations);
        randomAnimation();
    }

    private playFailAnimation(x: number, y: number) {
        const animations = [
            () => this.failShake(),
            () => this.failSadFace(x, y),
            () => this.failNope(x, y),
            () => this.failTargetLaugh(),
            () => this.failExplode(x, y)
        ];

        // Pick a random animation
        const randomAnimation = Phaser.Math.RND.pick(animations);
        randomAnimation();
    }

    // Win animations
    private winConfetti() {
        const colors = [COLORS.neon.yellow, COLORS.neon.pink, COLORS.neon.cyan, COLORS.text];

        for (let i = 0; i < 20; i++) {
            const confetti = this.add.rectangle(
                this.target.x,
                this.target.y,
                Phaser.Math.Between(5, 15),
                Phaser.Math.Between(5, 15),
                Phaser.Math.RND.pick(colors)
            );

            this.tweens.add({
                targets: confetti,
                x: confetti.x + Phaser.Math.Between(-200, 200),
                y: confetti.y + Phaser.Math.Between(-200, 200),
                rotation: Phaser.Math.Between(0, 6),
                scale: 0,
                duration: 1000,
                ease: 'Power2',
                onComplete: () => confetti.destroy()
            });
        }
    }

    private winSpinAndGrow() {
        this.tweens.add({
            targets: this.target,
            rotation: Math.PI * 4,
            scale: 3,
            duration: 500,
            ease: 'Back.easeOut',
            yoyo: true
        });
    }

    private winRainbow() {
        const colors = [COLORS.neon.pink, COLORS.neon.cyan, COLORS.neon.yellow, COLORS.text];
        let colorIndex = 0;

        this.time.addEvent({
            delay: 100,
            callback: () => {
                this.target.setFillStyle(colors[colorIndex % colors.length]);
                colorIndex++;
            },
            repeat: 9
        });
    }

    private winFireworks() {
        for (let i = 0; i < 3; i++) {
            this.time.delayedCall(i * 200, () => {
                const x = this.target.x + Phaser.Math.Between(-50, 50);
                const y = this.target.y + Phaser.Math.Between(-50, 50);

                for (let j = 0; j < 8; j++) {
                    const spark = this.add.circle(x, y, 3, COLORS.neon.yellow);
                    const angle = (j / 8) * Math.PI * 2;

                    this.tweens.add({
                        targets: spark,
                        x: x + Math.cos(angle) * 100,
                        y: y + Math.sin(angle) * 100,
                        scale: 0,
                        duration: 800,
                        ease: 'Power2',
                        onComplete: () => spark.destroy()
                    });
                }
            });
        }
    }

    private winBounce() {
        this.tweens.add({
            targets: this.target,
            y: this.target.y - 100,
            duration: 300,
            ease: 'Power2',
            yoyo: true,
            repeat: 2
        });

        // Add happy eyes
        const leftEye = this.add.circle(this.target.x - 10, this.target.y - 10, 3, COLORS.background);
        const rightEye = this.add.circle(this.target.x + 10, this.target.y - 10, 3, COLORS.background);
        const smile = this.add.arc(this.target.x, this.target.y + 5, 15, 0, 180, false, COLORS.background);
        smile.setStrokeStyle(3, COLORS.background);

        this.time.delayedCall(1000, () => {
            leftEye.destroy();
            rightEye.destroy();
            smile.destroy();
        });
    }

    // Fail animations
    private failShake() {
        this.cameras.main.shake(300, 0.02);

        // Flash red
        const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xff0000, 0.3);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    private failSadFace(x: number, y: number) {
        const face = this.add.circle(x, y, 30, COLORS.neon.pink);
        const leftEye = this.add.text(x - 10, y - 10, 'x', { fontSize: '16px', color: '#000' });
        const rightEye = this.add.text(x + 5, y - 10, 'x', { fontSize: '16px', color: '#000' });
        const frown = this.add.arc(x, y + 15, 15, 180, 0, false, COLORS.background);
        frown.setStrokeStyle(3, COLORS.background);

        this.tweens.add({
            targets: [face, leftEye, rightEye, frown],
            scale: 2,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                face.destroy();
                leftEye.destroy();
                rightEye.destroy();
                frown.destroy();
            }
        });
    }

    private failNope(x: number, y: number) {
        const text = this.add.text(x, y, 'NOPE!', {
            fontSize: '32px',
            color: '#ff0000',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);

        this.tweens.add({
            targets: text,
            y: y - 50,
            scale: 1.5,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: text,
                    alpha: 0,
                    duration: 300,
                    onComplete: () => text.destroy()
                });
            }
        });
    }

    private failTargetLaugh() {
        // Make target "laugh" by shaking
        this.tweens.add({
            targets: this.target,
            x: this.target.x + 5,
            duration: 50,
            yoyo: true,
            repeat: 10,
            ease: 'Linear'
        });

        // Add "HA HA" text
        const ha1 = this.add.text(this.target.x - 30, this.target.y - 30, 'HA', {
            fontSize: '20px',
            color: '#ffff00',
            fontStyle: 'bold'
        });
        const ha2 = this.add.text(this.target.x + 10, this.target.y - 30, 'HA', {
            fontSize: '20px',
            color: '#ffff00',
            fontStyle: 'bold'
        });

        this.tweens.add({
            targets: [ha1, ha2],
            y: '-=20',
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                ha1.destroy();
                ha2.destroy();
            }
        });
    }

    private failExplode(x: number, y: number) {
        // Create explosion effect at click location
        const circle = this.add.circle(x, y, 10, 0xff0000);

        this.tweens.add({
            targets: circle,
            scale: 5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => circle.destroy()
        });

        // Add comic style text
        const pow = this.add.text(x, y - 20, 'MISS!', {
            fontSize: '24px',
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        });
        pow.setOrigin(0.5);
        pow.setRotation(Phaser.Math.Between(-0.3, 0.3));

        this.tweens.add({
            targets: pow,
            scale: 1.5,
            alpha: 0,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => pow.destroy()
        });
    }
}