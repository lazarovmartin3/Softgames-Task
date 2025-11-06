import { Container, Spritesheet, Texture } from "pixi.js";
import { IScene } from "./IScene";
import { TopBar } from "../ui/TopBar";
import { SceneManager } from "../SceneManager";
import { AppConfig } from "@/types";
import { MenuScene } from "./MenuScene";
import { FlameParticles } from "../utils/FlameParticles";
import { AssetLoader } from "../utils/AssetLoader";

export class PhoenixFlame implements IScene {
    public view = new Container();
    private topBar!: TopBar;
    private emitter?: FlameParticles;

    constructor(private appConfig: AppConfig, private sm: SceneManager) { }

    async init(): Promise<void> {
        this.topBar = new TopBar("Task 3: Phoenix Flame", this.appConfig.width);
        this.view.addChild(this.topBar);
        this.topBar.back.on("pointerup", () => this.sm.changeScene(new MenuScene(this.appConfig, this.sm)));
        this.topBar.fullscreen.on("pointerup", () => requestFullscreen(this.sm.application.view as HTMLCanvasElement));

        // layer centered near bottom
        // const root = new Container();
        // root.position.set(this.appConfig.width / 2, this.appConfig.height * 0.7);
        // this.view.addChild(root);

        const sheet = AssetLoader.getInstance().getAsset<Spritesheet>("flame");
        if (!sheet) {
            console.error("Flame spritesheet not loaded. Ensure manifest has { name:'flame', type:'spritesheet'}");
            return;
        }
        const frames = this.collectFrames(sheet, /^FLAME_\d+\.png$/i);

        this.emitter = new FlameParticles(this.view, frames, this.sm.application.ticker, {
            maxParticles: 10,
            fps: 24,
            coneHalfAngleDeg: 18,
            speedMin: 140,
            speedMax: 260,
            lifeMin: 700,
            lifeMax: 1200,
            baseScaleMin: 0.35,
            baseScaleMax: 0.65,
        });

        // optional glow
        // const bloom = new AdvancedBloomFilter({ threshold: 0.25, bloomScale: 1.0, brightness: 1.05, blur: 2, quality: 3 });
        // root.filters = [bloom];
        this.emitter.getContainer().position.set(this.appConfig.width / 2, this.appConfig.height * 0.75);

        this.emitter.start();
    }

    async destroy(): Promise<void> {
        this.emitter?.destroy();
        this.topBar?.back.off("pointerup");
        this.topBar?.fullscreen.off("pointerup");
        this.view.destroy({ children: true });
    }

    private collectFrames(sheet: Spritesheet, regex: RegExp): Texture[] {
        return Object.keys(sheet.textures)
            .filter((k) => regex.test(k))
            .sort((a, b) => {
                const na = parseInt(a.match(/(\d+)/)?.[1] ?? "0", 10);
                const nb = parseInt(b.match(/(\d+)/)?.[1] ?? "0", 10);
                return na - nb;
            })
            .map((k) => sheet.textures[k]!);
    }
}

function requestFullscreen(canvas: HTMLCanvasElement) {
    const el: any = canvas;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el);
}