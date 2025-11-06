import type { Application, Container } from "pixi.js";

type Opts = {
    app: Application;
    root: Container;         // the container you want to scale
    designWidth: number;
    designHeight: number;
    minScale?: number;
    maxScale?: number;
};

export function installResizeHandler(opts: Opts) {
    const { app, root, designWidth, designHeight, minScale = 0.5, maxScale = 3 } = opts;

    function onResize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        app.renderer.resize(vw, vh);

        const scale = Math.max(
            minScale,
            Math.min(maxScale, Math.min(vw / designWidth, vh / designHeight))
        );

        root.scale.set(scale);
        root.position.set(
            (vw - designWidth * scale) / 2,
            (vh - designHeight * scale) / 2
        );
    }

    window.addEventListener("resize", onResize);
    onResize(); // initial
}
