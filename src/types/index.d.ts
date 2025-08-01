import * as BABYLON from '@babylonjs/core';

export interface EngineConfig {
    canvasId: string;
    width: number;
    height: number;
    antialiasing: boolean;
    preserveDrawingBuffer: boolean;
    stencil: boolean;
}

export interface MicrogameConfig {
    id: string;
    prompt: string;
    instruction: string;
    duration: number;
    backgroundColor: BABYLON.Color3;
    category: 'action' | 'timing' | 'precision' | 'memory' | 'speed';
    difficulty: 1 | 2 | 3;

    controls: {
        type: 'mouse' | 'keyboard' | 'both';
        mouse?: {
            click?: boolean;
            move?: boolean;
            drag?: boolean;
            wheel?: boolean;
        };
        keyboard?: string[];
    };

    assets?: {
        textures?: string[];
        sounds?: string[];
        models?: string[];
    };
}

export interface GameState {
    lives: number;
    score: number;
    currentStreak: number;
    gamesPlayed: number;
    highScore: number;
    unlockedGames: string[];
    settings: {
        soundEnabled: boolean;
        musicVolume: number;
        sfxVolume: number;
    };
}

export interface AssetManifest {
    textures: {
        [key: string]: {
            url: string;
            preload: boolean;
        }
    };
    sounds: {
        [key: string]: {
            url: string;
            preload: boolean;
            volume: number;
        }
    };
    fonts: {
        [key: string]: {
            url: string;
        }
    };
}

export interface TestSuite {
    unitTests: {
        gameState: string[];
        registry: string[];
        inputManager: string[];
    };
    integrationTests: {
        sceneTransitions: string[];
        gameLoop: string[];
        assetLoading: string[];
    };
    performanceTests: {
        fps: string[];
        memory: string[];
        loadTime: string[];
    };
}

export type MicrogameConstructor = new (engine: BABYLON.Engine, config?: MicrogameConfig) => any;

export const PERFORMANCE_TARGETS = {
    fps: 60,
    maxDrawCalls: 50,
    maxVertices: 10000,
    maxTextureMemory: 50 * 1024 * 1024, // 50MB
    loadTime: {
        scene: 500,      // ms
        microgame: 200,  // ms
        asset: 1000      // ms
    }
}; 