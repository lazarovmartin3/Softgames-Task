import type { Container } from "pixi.js";

export interface IScene {
    view: Container;
    init(): Promise<void>;
    destroy(): Promise<void>;
}
