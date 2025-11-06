import { Container, Graphics, Text } from "pixi.js";
import { Button } from "./Button";

export class TopBar extends Container {
    public back: Button;
    public fullscreen: Button;
    private bg: Graphics;
    private titleText: Text;

    constructor(title: string, width: number) {
        super();

        this.bg = new Graphics();
        this.bg.beginFill(0x000000, 1);
        this.bg.drawRect(0, 0, width, 64);
        this.bg.endFill();
        this.bg.alpha = 0.35;
        this.addChild(this.bg);

        this.titleText = new Text(title, { fill: 0xffffff, fontSize: 20, fontWeight: "bold" },);
        this.titleText.position.set(16, 20);
        this.addChild(this.titleText);

        this.back = new Button("Back", 120, 40);
        this.back.position.set(width - 260, 12);
        this.addChild(this.back);

        this.fullscreen = new Button("Fullscreen", 120, 40);
        this.fullscreen.position.set(width - 130, 12);
        this.addChild(this.fullscreen);
    }

    resize(width: number) {
        // either stretch:
        this.bg.width = width;

        // or (better): redraw exact width
        /*
        this.bg.clear();
        this.bg.beginFill(0x000000, 1);
        this.bg.drawRect(0, 0, width, 64);
        this.bg.endFill();
        this.bg.alpha = 0.35;
        */
        this.back.position.set(width - 260, 12);
        this.fullscreen.position.set(width - 130, 12);
    }
}
