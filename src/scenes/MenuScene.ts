import { Container, Text } from "pixi.js";
import { IScene } from "./IScene";
import { SceneManager } from "../SceneManager";
import { Button } from "../ui/Button";
import { AceOfShadows } from "./AceOfShadows";
import { AppConfig } from "@/types";
import { MagicWords } from "./MagicWords";
import { PhoenixFlame } from "./PhoenixFlame";

export class MenuScene implements IScene {
    public view = new Container();
    private appConfig!: AppConfig;
    private sm: SceneManager;

    constructor(appConfig: AppConfig, sm: SceneManager) {
        this.appConfig = appConfig;
        this.sm = sm;
    }

    async init(): Promise<void> {
        const title = new Text('In-Game Menu', { fill: 0x00ff88, fontFamily: 'monospace', fontSize: 28, fontWeight: 'bold' });
        title.anchor.set(0.5);
        title.position.set(this.appConfig.width / 2, 120);
        this.view.addChild(title);

        const b1 = new Button("Task 1: Ace of Shadows");
        const b2 = new Button("Task 2: Magic Words");
        const b3 = new Button("Task 3: Phoenix Flame");

        b1.position.set(this.appConfig.width / 2 - 110, 220);
        b2.position.set(this.appConfig.width / 2 - 110, 290);
        b3.position.set(this.appConfig.width / 2 - 110, 360);

        this.view.addChild(b1, b2, b3);

        b1.on("pointerup", async () => this.sm.changeScene(new AceOfShadows(this.appConfig, this.sm)));
        b2.on("pointerup", async () => this.sm.changeScene(new MagicWords(this.appConfig, this.sm)));
        b3.on("pointerup", async () => this.sm.changeScene(new PhoenixFlame(this.appConfig, this.sm)));
    }

    async destroy(): Promise<void> {
        this.view.destroy({ children: true });
    }
}
