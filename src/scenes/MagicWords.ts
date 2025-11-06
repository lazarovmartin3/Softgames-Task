import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { IScene } from "./IScene";
import { SceneManager } from "../SceneManager";
import { TopBar } from "../ui/TopBar";
import { AppConfig } from "@/types";
import { AssetLoader } from "../utils/AssetLoader";
import { MenuScene } from "./MenuScene";
import { ApiPayload } from "@/config";
import { Downloader } from "../server/Downloader";


type SpeakerPos = "left" | "right";

const MAX_BUBBLE_WIDTH = 640;
const PADDING = 16;
const GAP_Y = 18;
const AVATAR_SIZE = 64;
const FONT_SIZE = 20;

export class MagicWords implements IScene {
    public view = new Container();
    private topBar!: TopBar;
    private appConfig!: AppConfig;
    private destroyed = false;
    private timers = new Set<number>();
    private dialogueData!: ApiPayload;
    private yCursor = 80;
    private lineIndex = 0;

    constructor(appConfig: AppConfig, private sm: SceneManager) {
        this.appConfig = appConfig;
    }

    // ------------------- lifecycle -------------------

    async init(): Promise<void> {
        // UI bar
        this.view.sortableChildren = true;
        this.topBar = new TopBar("Task 2: Magic Words", this.appConfig.width);
        this.topBar.zIndex = 10_000;
        this.view.addChild(this.topBar);

        this.topBar.back.on("pointerup", () => {
            this.sm.changeScene(new MenuScene(this.appConfig, this.sm));
        });
        this.topBar.fullscreen.on("pointerup", () =>
            requestFullscreen(this.sm.application.view as HTMLCanvasElement)
        );
        this.dialogueData = Downloader.instance.getData();
        this.yCursor = 80;
        this.lineIndex = 0;
        this.playNextLine();
    }

    async destroy(): Promise<void> {
        this.destroyed = true;

        // clear pending timers
        for (const id of this.timers) clearTimeout(id);
        this.timers.clear();

        this.topBar?.back.off("pointerup");
        this.topBar?.fullscreen.off("pointerup");

        this.view.destroy({ children: true });
    }

    private playNextLine() {
        if (this.destroyed) return;
        const d = this.dialogueData;
        if (!d || this.lineIndex >= d.dialogue.length) return;

        const line = d.dialogue[this.lineIndex++];
        const pos: SpeakerPos =
            (d.avatars.find((a) => a.name === line.name)?.position as SpeakerPos) ?? "left";

        // Resolve textures from AssetLoader cache
        const assets = AssetLoader.getInstance().getAssets();
        const tex = (k: string): Texture | undefined =>
            (assets instanceof Map ? assets.get(k) : (assets as any)[k]) as Texture | undefined;

        const row = this.renderBubbleRow(
            line.name,
            line.text,
            pos,
            tex(`avatar:${line.name}`),
            (n) => tex(`emoji:${n}`)
        );

        row.position.y = this.yCursor;
        this.view.addChild(row);

        this.yCursor += row.height + GAP_Y;

        // schedule next line 1–2s later
        const delay = 1000 + Math.floor(Math.random() * 1000);
        const id = window.setTimeout(() => {
            this.timers.delete(id);
            this.playNextLine();
        }, delay);
        this.timers.add(id);
    }

    // ------------------- rendering -------------------
    /**
     * One chat row: avatar + bubble with inline emojis
     */
    private renderBubbleRow(
        speaker: string,
        raw: string,
        pos: SpeakerPos,
        avatarTex?: Texture,
        emojiResolver?: (name: string) => Texture | undefined
    ): Container {
        const row = new Container();

        // Avatar
        const avatar = avatarTex ? new Sprite(avatarTex) : undefined;
        if (avatar) {
            avatar.anchor.set(0.5);
            const s = Math.min(AVATAR_SIZE / avatar.width, AVATAR_SIZE / avatar.height);
            avatar.scale.set(s);
            avatar.y = AVATAR_SIZE / 2 + 8;
            row.addChild(avatar);
        }

        // Bubble (background + content)
        const bubble = new Container();
        const bg = new Graphics();
        bubble.addChild(bg);

        const content = new Container();
        bubble.addChild(content);

        // Speaker label
        const who = new Text(speaker, { fill: 0x8ad1ff, fontSize: 14, fontFamily: "sans-serif", fontWeight: "bold" });
        content.addChild(who);

        // Rich text with inline emojis
        const textStartY = who.height + 6;
        const { w: cw, h: ch } = this.layoutRichText(
            content,
            raw,
            { fill: 0xffffff, fontFamily: "sans-serif", fontSize: FONT_SIZE, lineHeight: Math.round(FONT_SIZE * 1.3) },
            MAX_BUBBLE_WIDTH,
            textStartY,
            emojiResolver
        );

        who.position.set(0, 0);

        // Bubble background
        const bw = Math.max(who.width, cw) + PADDING * 2;
        const bh = ch + who.height + PADDING * 2 + 6;
        const radius = 14;

        bg.clear();
        bg.beginFill(0x26282b, 1);
        bg.drawRoundedRect(0, 0, bw, bh, radius);
        bg.endFill();
        bg.lineStyle(2, 0x3a3d42, 1);
        bg.drawRoundedRect(0, 0, bw, bh, radius);

        // Content padding
        content.position.set(PADDING, PADDING);

        // Row layout
        const totalH = Math.max(bh, AVATAR_SIZE + 16);
        const gapX = 12;

        if (pos === "left") {
            if (avatar) avatar.x = AVATAR_SIZE / 2;
            bubble.x = (avatar ? AVATAR_SIZE + gapX : 0);
            row.addChild(bubble);
            // left tail
            const tail = new Graphics();
            tail.beginFill(0x26282b, 1);
            tail.moveTo(bubble.x, bubble.y + 20);
            tail.lineTo(bubble.x - 8, bubble.y + 28);
            tail.lineTo(bubble.x, bubble.y + 36);
            tail.endFill();
            row.addChild(tail);
        } else {
            bubble.x = 0;
            row.addChild(bubble);
            if (avatar) avatar.x = bubble.width + gapX + AVATAR_SIZE / 2;
            // right tail
            const tail = new Graphics();
            const bx = bubble.x + bw;
            tail.beginFill(0x26282b, 1);
            tail.moveTo(bx, bubble.y + 20);
            tail.lineTo(bx + 8, bubble.y + 28);
            tail.lineTo(bx, bubble.y + 36);
            tail.endFill();
            row.addChild(tail);
        }
        bubble.y = (totalH - bh) / 2;

        return row;
    }

    /**
     * Lay out text with inline emoji tokens {name}, wrapping to maxW.
     */
    private layoutRichText(
        parent: Container,
        raw: string,
        textStyle: Partial<Text["style"]> & { fontSize: number; lineHeight?: number },
        maxW: number,
        startY: number,
        emojiResolver?: (name: string) => Texture | undefined
    ): { w: number; h: number } {
        const tokens = tokenize(raw);
        const lineH = textStyle.lineHeight ?? Math.round(textStyle.fontSize * 1.3);

        let x = 0;
        let y = startY;
        let maxLineW = 0;

        const placeWord = (word: string) => {
            const tmp = new Text(word, textStyle);
            if (x + tmp.width > maxW && x !== 0) { x = 0; y += lineH; }
            tmp.position.set(x, y);
            parent.addChild(tmp);
            x += tmp.width;
            maxLineW = Math.max(maxLineW, x);
        };

        const placeSpace = () => {
            const space = new Text(" ", textStyle);
            if (x + space.width > maxW && x !== 0) { x = 0; y += lineH; }
            else x += space.width;
            // no need to add a Text node for plain spaces; we can skip adding to parent for perf
            maxLineW = Math.max(maxLineW, x);
        };

        const placeEmoji = (name: string) => {
            const tex = emojiResolver?.(name);
            if (!tex) { placeWord(`{${name}}`); return; }
            // scale to fit line box
            const s = Math.min(lineH / tex.height, lineH / tex.width) * 0.9;
            const w = tex.width * s;
            if (x + w > maxW && x !== 0) { x = 0; y += lineH; }
            const sp = new Sprite(tex);
            sp.scale.set(s);
            sp.position.set(x, y + (lineH - sp.height) / 2);
            parent.addChild(sp);
            x += w;
            maxLineW = Math.max(maxLineW, x);
        };

        for (const t of tokens) {
            if (t.type === "text") {
                const parts = t.value.split(/(\s+)/);
                for (const p of parts) {
                    if (p === "") continue;
                    if (p.trim() === "") placeSpace();
                    else placeWord(p);
                }
            } else {
                placeEmoji(t.name);
            }
        }

        const totalH = y - startY + lineH;
        return { w: maxLineW, h: totalH };
    }
}

// ------------------- small helpers -------------------

function tokenize(raw: string): Array<{ type: "text"; value: string } | { type: "emoji"; name: string }> {
    const out: Array<{ type: "text"; value: string } | { type: "emoji"; name: string }> = [];
    const re = /\{([a-zA-Z0-9_]+)\}/g;
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
        if (m.index > last) out.push({ type: "text", value: raw.slice(last, m.index) });
        out.push({ type: "emoji", name: m[1] });
        last = re.lastIndex;
    }
    if (last < raw.length) out.push({ type: "text", value: raw.slice(last) });
    return out;
}

function requestFullscreen(canvas: HTMLCanvasElement) {
    const el: any = canvas;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) req.call(el);
}