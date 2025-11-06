import { Container, Graphics, Text } from "pixi.js";

export class Button extends Container {
    private bg: Graphics;
    private label: Text;

    constructor(text: string, w = 220, h = 56) {
        super();

        if ("eventMode" in this) {
            this.eventMode = "static";
        } else {
            // @ts-ignore
            this.interactive = true;
        }
        // @ts-ignore
        this.cursor = "pointer";

        // --- Background
        this.bg = new Graphics();
        this.bg.lineStyle(2, 0x555555, 1);
        this.bg.beginFill(0x2c2c2c, 1);
        this.bg.drawRoundedRect(0, 0, w, h, 12);
        this.bg.endFill();
        this.addChild(this.bg);

        // --- Label
        this.label = new Text(text, { fill: 0xffffff, fontFamily: "sans-serif", fontSize: 18 },);
        this.label.anchor.set(0.5);
        this.label.position.set(w / 2, h / 2);
        this.addChild(this.label);

        // --- Simple hover/press effects
        this.on("pointerover", () => (this.bg.alpha = 0.95));
        this.on("pointerout", () => (this.bg.alpha = 1.0));
        this.on("pointerdown", () => (this.bg.alpha = 0.8));
        this.on("pointerup", () => (this.bg.alpha = 1.0));
    }

    setSize(w: number, h: number) {
        this.bg.clear();
        this.bg.lineStyle(2, 0x555555, 1);
        this.bg.beginFill(0x2c2c2c, 1);
        this.bg.drawRoundedRect(0, 0, w, h, 12);
        this.bg.endFill();
        this.label.position.set(w / 2, h / 2);
    }

    setText(v: string) {
        this.label.text = v;
    }
}
