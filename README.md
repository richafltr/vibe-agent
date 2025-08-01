# VibeWare - Microgame Madness!

A WarioWare-inspired collection of fast-paced microgames built with Phaser 3 and TypeScript.

## 🎮 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000`

## 🏗️ Project Structure

```
VibeWare/
├── src/
│   ├── scenes/
│   │   ├── TitleScene.ts      # Main menu with animations
│   │   ├── TransitionScene.ts # Between-game loading screen
│   │   └── microgames/        # Individual microgame scenes
│   ├── GameConfig.ts          # Game constants and configuration
│   └── main.ts               # Entry point
├── index.html
└── package.json
```

## 🎯 Current Features

- **Animated Title Screen**: Eye-catching menu with particle effects and animated UI elements
- **Transition Scene**: Shows lives remaining, score, speed indicator, and next game prompt
- **Responsive Design**: Scales to fit different screen sizes
- **Keyboard & Mouse Controls**: Space to start, click interactions

## 🎨 Visual Style

The game uses a vibrant color palette:
- Primary: Vibrant Red (#FF6B6B)
- Secondary: Teal (#4ECDC4)
- Tertiary: Yellow (#FFE66D)
- Quaternary: Mint (#95E1D3)

## 🕹️ Planned Microgames

1. **"Slice!"** - Mouse drag to slice falling fruits
2. **"Dodge!"** - WASD to avoid projectiles
3. **"Catch!"** - Mouse to catch falling eggs
4. **"Type!"** - Type the word shown before time runs out
5. **"Balance!"** - A/D keys to keep tightrope walker centered
6. **"Blow!"** - Hold mouse button to inflate balloon to perfect size
7. **"Match!"** - Click matching card pairs
8. **"Paint!"** - Click and drag to cover canvas
9. **"Honk!"** - Spacebar rapid tap for rubber duck
10. **"Rotate!"** - Q/E to align arrow to target angle
11. **"Count!"** - Press number key matching item count

## 🔧 Adding New Microgames

To add a new microgame:

1. Create a new scene file in `src/scenes/microgames/`
2. Extend `Phaser.Scene` and implement your game logic
3. Add the scene to the main game config
4. Add your game prompt to the transition scene rotation

Example microgame structure:
```typescript
export default class SliceGame extends Phaser.Scene {
  constructor() {
    super({ key: 'SliceGame' });
  }

  create() {
    // Initialize game
  }

  update() {
    // Game logic
  }
}
```

## 🚀 Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 📝 License

This project is open source and available under the ISC License. 