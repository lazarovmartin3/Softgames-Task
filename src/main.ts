import { AppConfig } from "./types";
import { GameApplication } from "./GameApplication";

const appConfig: AppConfig = {
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x01001e,
    resolution: window.devicePixelRatio || 1,
    antialias: true,
};

async function initGame() {
    try {
        const game = new GameApplication();
        await game.initialize(appConfig);

    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

// Start the game
initGame();