import type { Application } from "pixi.js";
import type { IScene } from "./scenes/IScene";


export class SceneManager {
    private app: Application;
    private current?: IScene;

    constructor(app: Application) {
        this.app = app;
    }

    get stage() { return this.app.stage; }
    get application() { return this.app; }

    async changeScene(next: IScene) {
        if (this.current) {
            await this.current.destroy();
            this.app.stage.removeChild(this.current.view);
        }
        this.current = next;
        await next.init();
        this.app.stage.addChild(next.view);
    }
}
