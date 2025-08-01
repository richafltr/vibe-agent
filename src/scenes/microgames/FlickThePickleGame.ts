import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class FlickThePickleGame extends BaseMicrogame {
    private jar!: Phaser.GameObjects.Ellipse;
    private pickle!: Phaser.GameObjects.Ellipse;
    private isFlicked: boolean = false;

    constructor() {
        super({ key: 'FlickThePickleGame' });
    }

    getPrompt(): string {
        return 'FLICK!';
    }

    getGameDuration(): number {
        return 4000;
    }

    setupGame(): void {
        this.createBackground();
        this.createJar();
        this.createPickle();

        this.tweens.add({
            targets: this.pickle,
            angle: { from: -30, to: 30 },
            duration: 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.inOut'
        });
    }

    setupControls(): void {
        this.input.on('pointerdown', this.flickPickle, this);
    }

    cleanupControls(): void {
        this.input.off('pointerdown', this.flickPickle, this);
    }

    resetGameState(): void {
        this.isFlicked = false;
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        if (!this.isFlicked && this.pickle.angle > 45) {
            this.setFailState();
        }
    }

    private createBackground() {
        this.createStandardBackground(0xD3F8E2, 0xACE7EF);
    }

    private createJar() {
        this.jar = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 120, 180, 0xFFFFFF);
        this.jar.setAlpha(0.2);

        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 130, 20, 0x964B00);
    }

    private createPickle() {
        this.pickle = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 30, 100, 0x4CAF50);
        this.pickle.setOrigin(0.5, 1);
    }

    private flickPickle(pointer: Phaser.Input.Pointer) {
        const dx = pointer.x - this.pickle.x;
        const dy = pointer.y - this.pickle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 50 && !this.isFlicked) {
            this.isFlicked = true;

            this.tweens.add({
                targets: this.pickle,
                y: '-=300',
                angle: { from: this.pickle.angle, to: this.pickle.angle - 360 },
                duration: 800,
                ease: 'Power2',
                onComplete: () => this.showSuccessAnimation()
            });
        }
    }

    private showSuccessAnimation() {
        this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, 150, 50, 0xFFD700)
            .setAlpha(0);

        this.tweens.add({
            targets: this.pickle,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 800,
            ease: 'Back.in',
            onComplete: () => {
                this.pickle.destroy();
                this.setWinState();
            }
        });

        this.tweens.add({
            targets: this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'YOU FLICKED IT!', {
                fontSize: '48px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 8
            }).setOrigin(0.5).setAlpha(0),
            alpha: 1,
            duration: 600,
            yoyo: true,
            onComplete: (_tween: any, targets: any[]) => targets[0].destroy()
        });
    }
}