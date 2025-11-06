import { Container, Sprite, Texture } from "pixi.js";
import { IScene } from "./IScene";
import { SceneManager } from "../SceneManager";
import { TopBar } from "../ui/TopBar";
import { Tween, Easing, Group } from "@tweenjs/tween.js";
import { AppConfig } from "@/types";
import { AssetLoader } from "../utils/AssetLoader";
import { MenuScene } from "./MenuScene";

type Stack = { container: Container; cards: Sprite[]; x: number; y: number };

const STACKS = 6;
const CARDS_TOTAL = 144;
const OVERLAP = 8;

export class AceOfShadows implements IScene {
    public view = new Container();
    private flyLayer = new Container();
    private stacks: Stack[] = [];
    private topBar!: TopBar;
    private intervalId?: number;
    private appConfig!: AppConfig;
    private tweenGroup = new Group();
    private tickerCb?: (dt: number) => void;
    private destroyed = false;
    private activeTweens = new Set<Tween<any>>();

    constructor(appConfig: AppConfig, private sm: SceneManager) {
        this.appConfig = appConfig;
    }

    async init(): Promise<void> {
        // Top bar (with Back + Fullscreen)
        this.topBar = new TopBar("Task 1: Ace of Shadows", this.appConfig.width);
        this.view.addChild(this.topBar);
        this.view.addChild(this.flyLayer);
        this.view.sortableChildren = true;
        this.flyLayer.sortableChildren = true;
        this.flyLayer.zIndex = 999;
        this.topBar.back.on("pointerup", () => {
            if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = undefined; }
            this.sm.changeScene(new MenuScene(this.appConfig, this.sm));
        });
        this.topBar.fullscreen.on("pointerup", () => requestFullscreen(this.sm.application.view as HTMLCanvasElement));

        // Create stacks (horizontally spread)
        const spacing = (this.appConfig.width - 160) / (STACKS - 1);
        for (let i = 0; i < STACKS; i++) {
            const c = new Container();
            c.sortableChildren = true;
            const x = 80 + i * spacing;
            const y = this.appConfig.height - 80;
            c.position.set(x, y);
            this.view.addChild(c);
            this.stacks.push({ container: c, cards: [], x, y });
        }

        const loader = AssetLoader.getInstance();
        const texA = loader.getAsset<Texture>("cardA");
        const texB = loader.getAsset<Texture>("cardB");
        const CARD_W = 110;
        const CARD_H = 160;
        const scaleA = Math.min(CARD_W / texA!.width, CARD_H / texA!.height);
        const scaleB = Math.min(CARD_W / texB!.width, CARD_H / texB!.height);

        const backs = [texA, texB] as const;
        const scales = [scaleA, scaleB] as const;
        const perStack = Math.floor(CARDS_TOTAL / STACKS);
        const remainder = CARDS_TOTAL % STACKS;

        let i = 0;
        for (let s = 0; s < STACKS; s++) {
            const count = perStack + (s < remainder ? 1 : 0);
            for (let j = 0; j < count; j++, i++) {
                const k = i & 1; // 0 or 1
                const spr = new Sprite(backs[k]!);
                spr.anchor.set(0.5);
                spr.scale.set(scales[k]);
                pushToStack(this.stacks[s], spr);
            }
        }

        this.layoutAll();

        this.intervalId = window.setInterval(() => this.moveRandomTopCard(), 1000);
        this.tickerCb = () => this.tweenGroup.update(performance.now());
        this.sm.application.ticker.add(this.tickerCb);
    }

    private layoutAll() {
        for (const s of this.stacks) {
            s.cards.forEach((card, idx) => {
                card.zIndex = idx;
                card.position.set(0, -idx * OVERLAP);
            });
        }
    }

    private moveRandomTopCard() {
        const nonEmpty = this.stacks
            .map((s, i) => ({ i, s }))
            .filter(x => x.s.cards.length > 0);

        if (nonEmpty.length <= 1) return;

        const fromI = nonEmpty[Math.floor(Math.random() * nonEmpty.length)].i;
        let toI = Math.floor(Math.random() * this.stacks.length);
        while (toI === fromI) toI = Math.floor(Math.random() * this.stacks.length);

        this.moveTopCard(fromI, toI);
    }

    private moveTopCard(fromIdx: number, toIdx: number) {
        if (this.destroyed || fromIdx === toIdx) return;

        const from = this.stacks[fromIdx];
        const to = this.stacks[toIdx];
        if (!from || !to || from.cards.length === 0) return;

        const card = from.cards.pop()!;
        const startGlobal = from.container.toGlobal(card.position, undefined, true);
        const startInScene = this.view.toLocal(startGlobal, undefined, undefined, true);

        this.flyLayer.addChild(card);
        card.position.copyFrom(startInScene);
        card.zIndex = 9999;

        const targetLocalTop = { x: 0, y: -to.cards.length * OVERLAP };
        const targetGlobal = to.container.toGlobal(targetLocalTop as any, undefined, true);
        const targetInScene = this.view.toLocal(targetGlobal, undefined, undefined, true);

        const tween = new Tween(card, this.tweenGroup)
            .to({ x: targetInScene.x, y: targetInScene.y, rotation: (Math.random() - 0.5) * 0.18 }, 2000)
            .easing(Easing.Cubic.InOut)
            .onComplete(() => {
                if (this.destroyed) return;
                const local = to.container.toLocal(card.position, this.view, undefined, true);
                to.container.addChild(card);
                card.position.copyFrom(local);
                card.rotation = 0;
                to.cards.push(card);
                this.layoutStack(from);
                this.layoutStack(to);
                this.activeTweens.delete(tween);
            })
            .onStop(() => {
                this.activeTweens.delete(tween);
            })
            .start();

        this.activeTweens.add(tween);
    }

    async destroy(): Promise<void> {
        this.destroyed = true;

        if (this.intervalId) clearInterval(this.intervalId);

        if (this.tickerCb) {
            this.sm.application.ticker.remove(this.tickerCb);
            this.tickerCb = undefined;
        }

        // Cancel all in-flight tweens and clear the group
        this.activeTweens.forEach(t => t.stop());
        this.activeTweens.clear();
        this.tweenGroup.removeAll();

        this.topBar?.back.off("pointerup");
        this.topBar?.fullscreen.off("pointerup");

        this.view.destroy({ children: true });
    }

    private layoutStack(stack: Stack) {
        stack.container.sortableChildren = true;
        stack.cards.forEach((c, idx) => {
            c.zIndex = idx;
            c.position.set(0, -idx * OVERLAP);
        });
    }
}

function pushToStack(stack: Stack, card: Sprite) {
    stack.cards.push(card);
    stack.container.addChild(card);
}

function requestFullscreen(canvas: HTMLCanvasElement) {
    const el: any = canvas;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el);
}
