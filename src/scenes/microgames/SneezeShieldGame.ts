import Phaser from 'phaser';
import BaseMicrogame from '../BaseMicrogame';
import { GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';

export default class SneezeShieldGame extends BaseMicrogame {
    private face!: Phaser.GameObjects.Ellipse;
    private nose!: Phaser.GameObjects.Ellipse;
    private tissue!: Phaser.GameObjects.Rectangle;
    private sneezeTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'SneezeShieldGame' });
    }

    getPrompt(): string {
        return 'BLOCK!';
    }

    getGameDuration(): number {
        return 4000; // 4 seconds
    }

    setupGame(): void {
        // Create face with a nose
        this.createFace();

        // Create tissue
        this.createTissue();

        // Start the sneeze countdown
        this.sneezeTimer = this.time.delayedCall(3000, () => this.triggerSneeze(), [], this);
    }

    setupControls(): void {
        this.input.on('pointermove', this.moveTissue, this);
    }

    cleanupControls(): void {
        this.input.off('pointermove', this.moveTissue, this);
        if (this.sneezeTimer) {
            this.sneezeTimer.remove();
        }
    }

    resetGameState(): void {
        // Reset sneezing state
    }

    private createFace() {
        // Create a humorous face with a big nose
        this.face = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2, 150, 200, 0xFFE4B2);
        this.nose = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 50, 70, 0xFFCC99);

        // Add eyes
        this.add.ellipse(GAME_WIDTH / 2 - 35, GAME_HEIGHT / 2 - 20, 25, 30, 0xFFFFFF);
        this.add.ellipse(GAME_WIDTH / 2 + 35, GAME_HEIGHT / 2 - 20, 25, 30, 0xFFFFFF);

        // Add pupils
        const leftPupil = this.add.circle(GAME_WIDTH / 2 - 35, GAME_HEIGHT / 2 - 20, 8, 0x000000);
        const rightPupil = this.add.circle(GAME_WIDTH / 2 + 35, GAME_HEIGHT / 2 - 20, 8, 0x000000);

        // Add eyebrows for expression
        const leftEyebrow = this.add.rectangle(GAME_WIDTH / 2 - 35, GAME_HEIGHT / 2 - 45, 30, 4, 0x8B4513);
        const rightEyebrow = this.add.rectangle(GAME_WIDTH / 2 + 35, GAME_HEIGHT / 2 - 45, 30, 4, 0x8B4513);

        // Add a worried mouth
        const mouth = this.add.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 30, 180, 0, false, 0xDD6666);
        mouth.setStrokeStyle(3, 0xDD6666);

        // Add twitch animation to the face
        this.tweens.add({
            targets: this.face,
            x: '+=10',
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add nervous eye movement
        this.tweens.add({
            targets: [leftPupil, rightPupil],
            x: '+=5',
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Eyebrow twitch for worried expression
        this.tweens.add({
            targets: [leftEyebrow, rightEyebrow],
            angle: { from: -5, to: 5 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    private createTissue() {
        // Create a tissue paper
        this.tissue = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 80, 40, 0xFFFFFF);
        this.tissue.setStrokeStyle(2, 0xDDDDDD);

        // Add physics to tissue
        this.physics.add.existing(this.tissue, true);
    }

    private moveTissue(pointer: Phaser.Input.Pointer) {
        this.tissue.x = Phaser.Math.Clamp(pointer.x, 40, GAME_WIDTH - 40);
        this.tissue.y = Phaser.Math.Clamp(pointer.y, 40, GAME_HEIGHT - 40);
    }

    private triggerSneeze() {
        // Check the position of the tissue
        if (this.tissue.getBounds().contains(this.nose.x, this.nose.y + 10)) {
            this.setWinState();
        } else {
            this.setFailState();
        }
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        // Optional: Additional frame-based logic
    }

    protected showSuccessFeedback(): void {
        const blockedText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'BLOCKED!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: blockedText,
            alpha: 1,
            scaleX: { from: 0, to: 1.2 },
            scaleY: { from: 0, to: 1.2 },
            duration: 300,
            ease: 'Back.out'
        });

        this.tweens.add({
            targets: blockedText,
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => blockedText.destroy()
        });

        // Create an animation of the face smiling when the sneeze is blocked
        this.tweens.add({
            targets: this.face,
            scale: 1.1,
            duration: 150,
            yoyo: true
        });
    }

    protected showFailureFeedback(): void {
        const splatText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'SPLAT!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FF0000',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: splatText,
            alpha: 1,
            scaleX: { from: 2, to: 1 },
            scaleY: { from: 2, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });

        // Create sneeze spray animation if the block fails
        // Create individual droplets manually
        for (let i = 0; i < 10; i++) {
            const droplet = this.add.circle(
                this.nose.x,
                this.nose.y + 10,
                Phaser.Math.Between(3, 6),
                0x00CCFF
            );

            const angle = Phaser.Math.Between(-30, 30);
            const speed = Phaser.Math.Between(200, 400);
            const vx = Math.sin(Phaser.Math.DegToRad(angle)) * speed;
            const vy = Math.cos(Phaser.Math.DegToRad(angle)) * speed;

            this.tweens.add({
                targets: droplet,
                x: droplet.x + vx * 0.5,
                y: droplet.y + vy * 0.5,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(200, 400),
                onComplete: () => droplet.destroy()
            });
        }

        // Fade out
        this.tweens.add({
            targets: splatText,
            alpha: 0,
            duration: 500,
            delay: 1500,
            onComplete: () => splatText.destroy()
        });

        // Camera shake to enhance the effect of missing the sneeze
        this.cameras.main.shake(200, 0.02);
    }
}
