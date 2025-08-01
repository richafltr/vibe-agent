import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class DodgeGame extends BaseMicrogame {
    private player!: Phaser.GameObjects.Rectangle;
    private playerShadow!: Phaser.GameObjects.Ellipse;
    private leftEye!: Phaser.GameObjects.Arc;
    private rightEye!: Phaser.GameObjects.Arc;
    private leftPupil!: Phaser.GameObjects.Arc;
    private rightPupil!: Phaser.GameObjects.Arc;
    private projectiles!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private projectileTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'DodgeGame' });
    }

    getPrompt(): string {
        return 'DODGE!';
    }

    getGameDuration(): number {
        return 4000; // 4 seconds
    }

    setupGame(): void {
        // Enable physics
        this.physics.world.gravity.y = 0;

        // Create background
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87CEEB); // Sky blue

        // Create ground (visual only)
        this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 20, GAME_WIDTH, 40, 0x654321);

        // Add danger warning at top
        const warningText = this.add.text(GAME_WIDTH / 2, 50, '⚠️ INCOMING! ⚠️', {
            fontSize: '24px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#FF6600',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Make warning text pulse
        this.tweens.add({
            targets: warningText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Create player shadow
        this.playerShadow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 85, 50, 20, 0x000000, 0.3);

        // Create player
        this.player = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 100, 40, 40, COLORS.primary);
        this.physics.add.existing(this.player);
        const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
        playerBody.setCollideWorldBounds(true);

        // Add eyes to player
        this.leftEye = this.add.circle(this.player.x - 8, this.player.y - 8, 4, 0xFFFFFF);
        this.rightEye = this.add.circle(this.player.x + 8, this.player.y - 8, 4, 0xFFFFFF);
        this.leftPupil = this.add.circle(this.player.x - 8, this.player.y - 8, 2, 0x000000);
        this.rightPupil = this.add.circle(this.player.x + 8, this.player.y - 8, 2, 0x000000);

        // Create projectiles group
        this.projectiles = this.physics.add.group();

        // Start spawning projectiles immediately
        this.spawnProjectile(); // Spawn first projectile immediately

        // Spawn projectiles periodically (more frequently for excitement)
        const spawnDelay = Math.max(200, 400 - (50 * Math.min(this.gameState.speed, 3)));
        this.projectileTimer = this.time.addEvent({
            delay: spawnDelay,
            callback: () => this.spawnProjectile(),
            repeat: -1
        });

        // Set up collision
        this.physics.add.overlap(this.player, this.projectiles, () => {
            this.handleHit();
        });
    }

    setupControls(): void {
        // Arrow keys
        this.cursors = this.input.keyboard!.createCursorKeys();
    }

    cleanupControls(): void {
        // Cursor keys are automatically cleaned up
        // But we should stop the projectile spawner
        if (this.projectileTimer) {
            this.projectileTimer.remove();
        }
    }

    resetGameState(): void {
        // No persistent state to reset
    }

    protected onGameUpdate(_time: number, _delta: number): void {
        if (this.hasFailed || this.gameEnded) return;

        // Move player
        const body = this.player.body as Phaser.Physics.Arcade.Body;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-300);
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(300);
        } else {
            body.setVelocityX(0);
        }

        // Keep player in bounds
        this.player.x = Phaser.Math.Clamp(this.player.x, 20, GAME_WIDTH - 20);

        // Update shadow position
        this.playerShadow.x = this.player.x;

        // Update eye positions
        this.leftEye.x = this.player.x - 8;
        this.leftEye.y = this.player.y - 8;
        this.rightEye.x = this.player.x + 8;
        this.rightEye.y = this.player.y - 8;

        // Find nearest projectile
        let nearestProjectile: any = null;
        let nearestDistance = Infinity;

        this.projectiles.children.entries.forEach((projectile: any) => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                projectile.x, projectile.y
            );
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestProjectile = projectile;
            }
        });

        // Make pupils look at nearest projectile
        if (nearestProjectile) {
            const angle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                nearestProjectile.x, nearestProjectile.y
            );

            const pupilOffset = 1.5;
            this.leftPupil.x = this.leftEye.x + Math.cos(angle) * pupilOffset;
            this.leftPupil.y = this.leftEye.y + Math.sin(angle) * pupilOffset;
            this.rightPupil.x = this.rightEye.x + Math.cos(angle) * pupilOffset;
            this.rightPupil.y = this.rightEye.y + Math.sin(angle) * pupilOffset;
        } else {
            // Look straight ahead if no projectiles
            this.leftPupil.x = this.leftEye.x;
            this.leftPupil.y = this.leftEye.y;
            this.rightPupil.x = this.rightEye.x;
            this.rightPupil.y = this.rightEye.y;
        }

        // Clean up projectiles that are off screen
        this.projectiles.children.entries.forEach((projectile: any) => {
            if (projectile.y > GAME_HEIGHT - 40) {
                // Create ground impact effect
                for (let i = 0; i < 5; i++) {
                    const particle = this.add.circle(
                        projectile.x + Phaser.Math.Between(-10, 10),
                        GAME_HEIGHT - 40,
                        Phaser.Math.Between(2, 5),
                        projectile.fillColor
                    );

                    this.tweens.add({
                        targets: particle,
                        y: particle.y - Phaser.Math.Between(20, 40),
                        x: particle.x + Phaser.Math.Between(-20, 20),
                        alpha: 0,
                        scale: 0,
                        duration: 400,
                        ease: 'Quad.out',
                        onComplete: () => particle.destroy()
                    });
                }

                this.projectiles.remove(projectile);
                projectile.destroy();
            }
        });

        // If time runs out without being hit, player wins
        if (this.timeRemaining <= 100 && !this.hasFailed && !this.hasWon) {
            this.setWinState();
        }
    }

    private spawnProjectile(): void {
        // Don't spawn if game has already ended
        if (this.gameEnded) return;

        const x = Phaser.Math.Between(50, GAME_WIDTH - 50);

        // Create different types of projectiles for variety
        const projectileType = Phaser.Math.Between(0, 2);
        let projectile: Phaser.GameObjects.Arc;
        let size = 15;
        let speed = 250 + (50 * this.gameState.speed);

        switch (projectileType) {
            case 0: // Regular fireball
                projectile = this.add.circle(x, -20, size, COLORS.danger);
                break;
            case 1: // Blue ice shard (slightly faster)
                projectile = this.add.circle(x, -20, size - 3, 0x00CCFF);
                speed += 50;
                break;
            case 2: // Large meteor (slower but bigger)
                size = 25;
                projectile = this.add.circle(x, -20, size, 0x8B4513);
                speed -= 50;
                break;
            default:
                projectile = this.add.circle(x, -20, size, COLORS.danger);
        }

        this.physics.add.existing(projectile);
        this.projectiles.add(projectile);

        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocityY(speed);
        body.setCircle(size);

        // Add glow effect
        const glow = this.add.circle(x, -20, size + 5, projectile.fillColor, 0.3);

        // Add a fiery trail effect that follows the projectile
        const trail1 = this.add.circle(x, -25, size * 0.7, projectile.fillColor, 0.5);
        const trail2 = this.add.circle(x, -30, size * 0.4, 0xFFFF00, 0.3);

        // Make trail and glow follow projectile
        this.tweens.add({
            targets: [trail1, trail2, glow],
            y: projectile.y,
            duration: 100,
            repeat: -1,
            onUpdate: () => {
                trail1.y = projectile.y - 5;
                trail2.y = projectile.y - 10;
                trail1.x = projectile.x;
                trail2.x = projectile.x;
                glow.x = projectile.x;
                glow.y = projectile.y;
            }
        });

        // Add slight wobble to projectile
        const wobbleAmount = projectileType === 2 ? 10 : 20; // Meteors wobble less
        this.tweens.add({
            targets: projectile,
            x: x + Phaser.Math.Between(-wobbleAmount, wobbleAmount),
            duration: 500,
            ease: 'Sine.inOut',
            yoyo: true,
            repeat: -1
        });

        // Clean up trail when projectile is destroyed
        projectile.on('destroy', () => {
            trail1.destroy();
            trail2.destroy();
            glow.destroy();
        });
    }

    private handleHit(): void {
        if (!this.hasFailed) {
            this.setFailState();

            // Make player flash red
            this.player.setFillStyle(COLORS.danger);

            // Explosion effect
            for (let i = 0; i < 10; i++) {
                const particle = this.add.circle(
                    this.player.x + Phaser.Math.Between(-20, 20),
                    this.player.y + Phaser.Math.Between(-20, 20),
                    Phaser.Math.Between(3, 8),
                    Phaser.Utils.Array.GetRandom([COLORS.danger, 0xFF6600, 0xFFFF00])
                );

                this.tweens.add({
                    targets: particle,
                    x: particle.x + Phaser.Math.Between(-50, 50),
                    y: particle.y + Phaser.Math.Between(-50, 50),
                    alpha: 0,
                    scale: 0,
                    duration: 500,
                    onComplete: () => particle.destroy()
                });
            }
        }
    }

    protected showSuccessFeedback(): void {
        const successText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'SURVIVED!', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        // Victory jump
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 50,
            duration: 300,
            ease: 'Quad.out',
            yoyo: true
        });

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

    protected showFailureFeedback(): void {
        const failText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'OUCH!', {
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

        // Fade out
        this.tweens.add({
            targets: failText,
            alpha: 0,
            duration: 500,
            delay: 1000,
            onComplete: () => failText.destroy()
        });

        // Camera shake
        this.cameras.main.shake(300, 0.03);
    }
} 