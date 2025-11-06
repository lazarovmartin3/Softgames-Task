import { GameRenderer } from "./GameRenderer";
import { Downloader } from "./server/Downloader";
import { AppConfig } from "./types";


export class GameApplication {
    private renderer!: GameRenderer;
    private isInitialized = false;

    public async initialize(appConfig: AppConfig): Promise<void> {

        if (this.isInitialized) return;

        try {
            const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
            await Downloader.getInstance().init();
            this.renderer = new GameRenderer(appConfig);
            await this.renderer.init(canvas);

        }
        catch (error) {
            console.error("Error during GameApplication initialization:", error);
            throw error;
        }
    }

}