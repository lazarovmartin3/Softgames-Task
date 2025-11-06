import { Application, Container, Text } from "pixi.js";

export class FpsCounter {
    public view: Container = new Container();
    private text: Text;
    private acc = 0;
    private frames = 0;

    constructor(app: Application) {
        this.text = new Text('FPS', { fill: 0x00ff88, fontFamily: 'monospace', fontSize: 16 });
        this.view.addChild(this.text);

        app.ticker.add(() => {
            this.acc += app.ticker.deltaMS;
            this.frames++;
            if (this.acc >= 1000) {
                const fps = Math.round((this.frames * 1000) / this.acc);
                this.text.text = `FPS: ${fps}`;
                this.acc = 0;
                this.frames = 0;
            }
        });
    }
}
