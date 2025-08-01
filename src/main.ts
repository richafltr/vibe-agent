import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './GameConfig';
import PreloadScene from './scenes/PreloadScene';
import TitleScene from './scenes/TitleScene';
import TransitionScene from './scenes/TransitionScene';
import DebugMenuScene from './scenes/DebugMenuScene';
import { MICROGAME_SCENES } from './scenes/microgames/registry';

import posthog from 'posthog-js'

posthog.init('phc_QhLKPSB0O4abQdeGvzxhvzmOAycwAH0aZKik6QaTyOw',
    {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'identified_only' // or 'always' to create profiles for anonymous users as well
    }
)

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.WEBGL,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#2C3E50',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: false,
        antialias: true,
        antialiasGL: true,
        mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
        roundPixels: false,
        transparent: false,
        clearBeforeRender: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'high-performance',
        batchSize: 4096,
        desynchronized: false
    },
    scene: [
        PreloadScene,
        TitleScene,
        TransitionScene,
        DebugMenuScene,
        ...MICROGAME_SCENES
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 300 },
            debug: false
        }
    }
};

new Phaser.Game(config); 