export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export interface GameState {
    lives: number;
    score: number;
    currentGame: number;
    speed: number;
    gamesCompleted: number;
    debugMode?: boolean;
    previousGameKey?: string;
    recentGames?: string[];  // Track recently played games
}

export interface MicrogameInfo {
    key: string;
    name: string;
    prompt: string;
    description: string;
    controls: string;
}

// Import microgame metadata from registry
import { MICROGAME_METADATA } from './scenes/microgames/registry';

export const MICROGAMES: MicrogameInfo[] = MICROGAME_METADATA;

export const COLORS = {
    // Main palette
    primary: 0xFF6B6B,     // Vibrant Red
    secondary: 0x4ECDC4,   // Teal
    tertiary: 0xFFE66D,    // Yellow
    quaternary: 0x95E1D3,  // Mint

    // UI colors
    background: 0x2C3E50,  // Dark Blue
    text: 0xFFFFFF,        // White
    textDark: 0x34495E,    // Dark Gray
    success: 0x2ECC71,     // Green
    danger: 0xE74C3C,      // Red
    warning: 0xF39C12,     // Orange

    // Fun colors for microgames
    neon: {
        pink: 0xFF00FF,
        cyan: 0x00FFFF,
        green: 0x00FF00,
        yellow: 0xFFFF00,
        purple: 0x9D00FF
    }
};

export const INITIAL_GAME_STATE: GameState = {
    lives: 4,
    score: 0,
    currentGame: 0,
    speed: 1,
    gamesCompleted: 0,
    debugMode: false,
    previousGameKey: undefined,
    recentGames: []
}; 