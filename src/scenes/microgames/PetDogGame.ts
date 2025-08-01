import Phaser from 'phaser';
import BaseMicrogame from '../BaseMicrogame';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../../GameConfig';

interface Heart {
    sprite: Phaser.GameObjects.Text;
    x: number;
    y: number;
    vy: number;
    life: number;
}

export default class PetDogGame extends BaseMicrogame {
    private pettingProgress: number = 0;
    private hearts: Heart[] = [];
    private isSpacePressed: boolean = false;
    private dogSprite!: Phaser.GameObjects.Container;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private tail!: Phaser.GameObjects.Arc;
    private leftEye!: Phaser.GameObjects.Arc;
    private rightEye!: Phaser.GameObjects.Arc;
    private animationTime: number = 0;
    private isCelebrating: boolean = false;

    constructor() {
        super({ key: 'PetDogGame' });
    }

    getPrompt(): string {
        return 'PET!';
    }

    getGameDuration(): number {
        return 5000;
    }

    setupGame(): void {
        // Create sky background
        this.createStandardBackground(0x87CEEB, 0xFFE5B4);

        // Create progress bar
        this.add.rectangle(GAME_WIDTH / 2, 50, 400, 20, 0x333333);
        this.progressBar = this.add.rectangle(GAME_WIDTH / 2, 50, 0, 20, COLORS.success);

        // Create dog container
        this.dogSprite = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);

        // Dog body
        const body = this.add.ellipse(0, 50, 100, 80, 0xB5651D);
        const head = this.add.circle(0, 0, 45, 0xB5651D);

        // Dog ears
        const leftEar = this.add.ellipse(-30, -25, 36, 60, 0xA0541A);
        const rightEar = this.add.ellipse(30, -25, 36, 60, 0xA0541A);

        // Dog tail (will be animated)
        this.tail = this.add.arc(40, 60, 30, 0, 180, false, 0xA0541A);
        this.tail.setOrigin(0, 0.5);

        // Dog face
        const snout = this.add.ellipse(0, 20, 44, 30, 0xD4A574);
        const nose = this.add.ellipse(0, 15, 10, 8, 0x000000);

        // Eyes (stored for animation)
        this.leftEye = this.add.circle(-15, 0, 6, 0x000000);
        this.rightEye = this.add.circle(15, 0, 6, 0x000000);

        // Dog legs
        const frontLeftLeg = this.add.rectangle(-20, 80, 20, 40, 0xB5651D);
        const frontRightLeg = this.add.rectangle(20, 80, 20, 40, 0xB5651D);
        const backLeftLeg = this.add.rectangle(-20, 80, 20, 40, 0xA0541A);
        const backRightLeg = this.add.rectangle(20, 80, 20, 40, 0xA0541A);

        // Add all parts to container
        this.dogSprite.add([
            this.tail, body, head, leftEar, rightEar,
            frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg,
            snout, nose, this.leftEye, this.rightEye
        ]);

        // Add instruction text
        this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'Hold SPACEBAR to pet the dog!', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#000000'
        }).setOrigin(0.5);
    }

    setupControls(): void {
        const keyboard = this.input.keyboard;
        if (!keyboard) return;

        keyboard.on('keydown-SPACE', () => {
            if (!this.isSpacePressed) {
                this.isSpacePressed = true;
            }
        });

        keyboard.on('keyup-SPACE', () => {
            this.isSpacePressed = false;
            // Don't fail on key release - only fail when time runs out
        });
    }

    cleanupControls(): void {
        const keyboard = this.input.keyboard;
        if (!keyboard) return;
        keyboard.removeAllListeners();
    }

    resetGameState(): void {
        this.pettingProgress = 0;
        this.hearts = [];
        this.isSpacePressed = false;
        this.animationTime = 0;
        this.isCelebrating = false;
    }

    private addHeart(): void {
        const heart = this.add.text(
            this.dogSprite.x + (Math.random() * 100 - 50),
            this.dogSprite.y,
            '❤️',
            { fontSize: '32px' }
        );

        this.hearts.push({
            sprite: heart,
            x: heart.x,
            y: heart.y,
            vy: -2,
            life: 100
        });
    }

    protected onGameUpdate(time: number, delta: number): void {
        this.animationTime += delta;

        if (this.isCelebrating) {
            // Celebration animations!
            // Super fast tail wagging
            this.tail.setRotation(Math.sin(this.animationTime / 50) * 0.8);

            // Jumping and spinning
            const jumpHeight = Math.abs(Math.sin(this.animationTime / 300)) * 50;
            this.dogSprite.setY(GAME_HEIGHT / 2 - jumpHeight);
            this.dogSprite.setRotation(this.animationTime / 500);

            // Eyes squinting with joy
            this.leftEye.setScale(1.2, 0.3);
            this.rightEye.setScale(1.2, 0.3);

            // Spawn celebration hearts rapidly
            if (this.animationTime % 100 < 16) {
                // Create hearts in a circle around the dog
                const angle = Math.random() * Math.PI * 2;
                const distance = 80;
                const heart = this.add.text(
                    this.dogSprite.x + Math.cos(angle) * distance,
                    this.dogSprite.y + Math.sin(angle) * distance,
                    '❤️',
                    { fontSize: '40px' }
                );

                this.hearts.push({
                    sprite: heart,
                    x: heart.x,
                    y: heart.y,
                    vy: -3,
                    life: 120
                });
            }
        } else if (this.isSpacePressed && !this.hasWon) {
            // Update petting progress
            this.pettingProgress = Math.min(100, this.pettingProgress + 1 * this.gameState.speed);
            this.progressBar.setDisplaySize((this.pettingProgress / 100) * 400, 20);

            // Add hearts periodically
            if (time % 500 < 16) {
                this.addHeart();
            }

            // Happy animations
            // Tail wagging
            this.tail.setRotation(Math.sin(this.animationTime / 100) * 0.5);

            // Body wiggle and bounce
            this.dogSprite.setRotation(Math.sin(this.animationTime / 150) * 0.05);
            this.dogSprite.setY(GAME_HEIGHT / 2 + Math.sin(this.animationTime / 200) * 10);

            // Blinking eyes (close eyes periodically)
            const blinkCycle = this.animationTime % 2000;
            if (blinkCycle > 1800) {
                this.leftEye.setScale(1, 0.2);
                this.rightEye.setScale(1, 0.2);
            } else {
                this.leftEye.setScale(1, 1);
                this.rightEye.setScale(1, 1);
            }

            // Check win condition
            if (this.pettingProgress >= 100) {
                this.setWinState();
                this.isCelebrating = true;
            }
        } else {
            // Idle animations when not being pet
            // Slower tail movement
            this.tail.setRotation(Math.sin(this.animationTime / 300) * 0.2);

            // Reset position and rotation
            this.dogSprite.setRotation(0);
            this.dogSprite.setY(GAME_HEIGHT / 2);

            // Open eyes
            this.leftEye.setScale(1, 1);
            this.rightEye.setScale(1, 1);
        }

        // Update hearts
        this.hearts = this.hearts.filter(heart => {
            heart.y += heart.vy;
            heart.life -= 1;
            heart.sprite.setPosition(heart.x, heart.y);
            heart.sprite.setAlpha(heart.life / 100);

            if (heart.life <= 0) {
                heart.sprite.destroy();
                return false;
            }
            return true;
        });
    }
} 