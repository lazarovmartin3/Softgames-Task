import { Application, Container } from "pixi.js";
import { FpsCounter } from "./utils/FpsCounter";
import { SceneManager } from "./SceneManager";
import { MenuScene } from "./scenes/MenuScene";
import { AppConfig, AssetManifest } from "./types";
import { AssetLoader } from "./utils/AssetLoader";
import { assetManifest } from "./config";

export class GameRenderer {
    private pixiApp!: Application;
    private config: AppConfig;
    private gameContainer: Container;
    private assetLoader: AssetLoader;

    constructor(config: AppConfig) {
        this.config = config;
        this.gameContainer = new Container();
        this.assetLoader = AssetLoader.getInstance();
    }

    public async init(canvas?: HTMLCanvasElement): Promise<void> {
        const resizeTarget: Window | HTMLElement = canvas?.parentElement ?? window;

        this.pixiApp = new Application({
            view: canvas,
            resizeTo: resizeTarget as any,
            autoDensity: true,
            backgroundColor: this.config.backgroundColor,
            resolution: this.config.resolution,
            antialias: this.config.antialias,
        });

        // @ts-ignore dev convenience
        (globalThis as any).__PIXI_APP__ = this.pixiApp;
        await this.assetLoader.init();
        await this.loadAssets(assetManifest);

        this.pixiApp.stage.addChild(this.gameContainer);

        const fps = new FpsCounter(this.pixiApp);
        fps.view.position.set(10, 6);
        this.pixiApp.stage.addChild(fps.view);

        const sceneManager = new SceneManager(this.pixiApp);
        await sceneManager.changeScene(new MenuScene(this.config, sceneManager));
    }

    public getWidth(): number {
        return this.config.width;
    }

    public getHeight(): number {
        return this.config.height;
    }

    public async loadAssets(
        manifest: AssetManifest[],
        onProgress?: (p01: number) => void,
    ): Promise<void> {
        const loader = this.assetLoader;

        // Try native progress forwarding if supported
        const maybeHasProgress =
            // @ts-ignore - feature detection
            typeof loader.loadAssets === 'function' && loader.loadAssets.length >= 2;

        if (maybeHasProgress) {
            // @ts-ignore - call with progress support if available
            await loader.loadAssets(manifest, (p: number) => onProgress?.(Math.max(0, Math.min(1, p))));
            onProgress?.(1);
            return;
        }

        // Fallback: emulate progress per-manifest item
        const total = manifest.length || 1;
        let done = 0;
        const tick = () => onProgress?.(Math.min(1, done / total));

        for (const m of manifest) {
            await loader.loadAssets([m]); // load one by one
            done++;
            tick();
        }
        onProgress?.(1);
    }

}