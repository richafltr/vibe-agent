# VibeWare Microgame Developer Guide

Welcome to VibeWare! This guide will help you create your own microgames for our WarioWare-style collection.

## Quick Start

All microgames extend the `BaseMicrogame` class, which handles common functionality like timers, scoring, and transitions.

### Basic Template

```typescript
import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class YourGame extends BaseMicrogame {
  constructor() {
    super({ key: 'YourGame' });
  }

  getPrompt(): string {
    return 'DO SOMETHING!';  // The instruction shown to players
  }

  getGameDuration(): number {
    return 5000;  // Duration in milliseconds
  }

  setupGame(): void {
    // Create your game objects here
    // This is called after the prompt is shown
  }

  setupControls(): void {
    // Set up input handlers (keyboard, mouse, etc.)
  }

  cleanupControls(): void {
    // Remove input handlers when game ends
    // IMPORTANT: Always clean up to prevent memory leaks
  }

  protected onGameUpdate(time: number, delta: number): void {
    // Optional: Add frame-by-frame update logic
    // Check win/lose conditions here
    // Note: This is only called after setupGame() completes
  }
}
```

## Core Concepts

### 1. Game Lifecycle

1. **init()** - Inherited from base, sets up game state
2. **create()** - Inherited from base, shows prompt then calls your methods
3. **setupGame()** - Your game visuals and objects
4. **setupControls()** - Your input handling
5. **update()** - Runs every frame, calls onGameUpdate()
6. **Game ends** - Timer expires or win/fail state set

### 2. Win/Lose States

Use these methods to set the game outcome:

```typescript
// Player succeeds
this.setWinState();

// Player fails
this.setFailState();
```

The base class handles scoring and life management automatically.

### 3. Properties Available

From `BaseMicrogame`, you have access to:

- `gameState` - Current score, lives, speed, etc.
- `timeRemaining` - Milliseconds left in the game
- `hasWon` - Whether player has won
- `hasFailed` - Whether player has failed
- `gameEnded` - Whether game has ended
- `gameReady` - Whether game setup is complete (automatically managed)

### 4. Helper Methods

```typescript
// Create a gradient background
this.createStandardBackground(topColor, bottomColor);

// Override for custom success feedback
protected showSuccessFeedback(): void {
  // Default shows "NICE!" - override for custom messages
}

// Override for custom failure feedback  
protected showFailureFeedback(): void {
  // Default shows "MISS!" - override for custom messages
}
```

## Complete Example: Dodge Game

Here's a full example of a dodging microgame:

```typescript
import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class DodgeGame extends BaseMicrogame {
  private player!: Phaser.GameObjects.Rectangle;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

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
    
    // Background
    this.createStandardBackground(0x2C1810, 0x8B4513);
    
    // Create player
    this.player = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 100, 40, 40, COLORS.primary);
    this.physics.add.existing(this.player);
    
    // Create projectiles group
    this.projectiles = this.physics.add.group();
    
    // Spawn projectiles periodically
    this.time.addEvent({
      delay: 500,
      callback: () => this.spawnProjectile(),
      repeat: -1
    });
    
    // Set up collision
    this.physics.add.overlap(this.player, this.projectiles, () => {
      this.setFailState();
    });
  }

  setupControls(): void {
    // Arrow keys
    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  cleanupControls(): void {
    // Cursor keys are automatically cleaned up
  }

  protected onGameUpdate(time: number, delta: number): void {
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
    
    // If time runs out without being hit, player wins
    if (this.timeRemaining <= 0 && !this.hasFailed) {
      this.setWinState();
    }
  }

  private spawnProjectile(): void {
    const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
    const projectile = this.add.circle(x, -20, 15, COLORS.danger);
    
    this.physics.add.existing(projectile);
    const body = projectile.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(200 + (100 * this.gameState.speed));
    
    this.projectiles.add(projectile);
  }
}
```

## Best Practices

### 1. Input Handling

Always clean up input handlers:

```typescript
setupControls(): void {
  this.input.on('pointermove', this.handleMouseMove, this);
}

cleanupControls(): void {
  this.input.off('pointermove', this.handleMouseMove, this);
}
```

### 2. Difficulty Scaling

Use `gameState.speed` to make games harder:

```typescript
const velocity = 100 + (50 * this.gameState.speed);
const spawnRate = 1000 - (200 * this.gameState.speed);
```

### 3. Visual Feedback

- Show immediate feedback when player succeeds/fails
- Use tweens for smooth animations
- Add particle effects for impact
- Camera shake for dramatic moments

### 4. Game Duration

- 3-5 seconds for most games
- Can be shorter (2s) for very simple games
- Can be longer (6-7s) for more complex games
- Consider speed multiplier for higher difficulties

## Adding Your Game

1. Create your game file in `src/scenes/microgames/`
2. Import it in `src/GameConfig.ts`
3. Add to the `MICROGAMES` array:

```typescript
export const MICROGAMES = [
  // ... existing games
  {
    scene: YourGame,
    name: 'Your Game',
    description: 'Brief description',
    controls: 'How to play',
    prompt: 'DO SOMETHING!'
  }
];
```

## Testing Your Game

1. Run the game: `npm run dev`
2. Press 'D' on the title screen for debug mode
3. Select your game from the list
4. Test multiple times for different scenarios

## Tips for Great Microgames

1. **Clear Objective**: Players should instantly understand what to do
2. **Simple Controls**: Use one input method (mouse OR keyboard, not both)
3. **Immediate Feedback**: Show when player succeeds or fails
4. **Visual Polish**: Add particles, tweens, and effects
5. **Fair Difficulty**: Should be possible but challenging

## Need Help?

Check out the existing games:
- `CatchGame.ts` - Mouse movement example
- `TypeGame.ts` - Keyboard input example

Happy game making! 🎮 