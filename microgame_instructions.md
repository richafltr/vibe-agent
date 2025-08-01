# Microgame Implementation Instructions

You are tasked with creating a new microgame for VibeWare. Each microgame is a quick 3-5 second challenge.

## Required Implementation

Create a TypeScript class that extends BaseMicrogame with these exact methods:

```typescript
import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../../GameConfig';
import BaseMicrogame from '../BaseMicrogame';

export default class YourGameName extends BaseMicrogame {
    // Add private properties for your game objects here
    
    constructor() {
        super({ key: 'YourGameName' }); // MUST match class name exactly
    }

    getPrompt(): string {
        return 'ACTION!'; // 1-2 words ending with !
    }

    getGameDuration(): number {
        return 5000; // 3000-5000ms typical
    }

    setupGame(): void {
        // Create all visual elements and game objects
        // Enable physics if needed: this.physics.world.gravity.y = 300;
    }

    setupControls(): void {
        // Set up ALL input handlers
    }

    cleanupControls(): void {
        // MUST remove ALL event listeners
    }

    protected onGameUpdate(time: number, delta: number): void {
        // Optional: Game logic that runs each frame
        // Call this.setWinState() or this.setFailState()
    }
}
```

## Key Requirements

1. **Class name MUST match the key** passed to super()
2. **Must call either setWinState() or setFailState()** based on game outcome
3. **All event listeners MUST be removed** in cleanupControls()
4. **Use GAME_WIDTH (800) and GAME_HEIGHT (600)** for positioning
5. **Simple, single objective** that's immediately clear

## Common Patterns

### Mouse Control
```typescript
setupControls(): void {
    this.input.on('pointermove', this.handleMouseMove, this);
}
cleanupControls(): void {
    this.input.off('pointermove', this.handleMouseMove, this);
}
```

### Keyboard Control
```typescript
private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
setupControls(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
}
```

### Physics Objects
```typescript
setupGame(): void {
    this.physics.world.gravity.y = 300;
    const obj = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(obj);
}
```

## DO NOT:
- Create your own timer (BaseMicrogame handles this)
- Manage score/lives (BaseMicrogame handles this)
- Transition scenes (BaseMicrogame handles this)
- Use hard-coded positions (use GAME_WIDTH/HEIGHT)
- Create complex multi-step objectives 