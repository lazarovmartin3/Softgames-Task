import { Container, ParticleContainer, Sprite, Texture, Ticker, BLEND_MODES } from "pixi.js";

type FlameOpts = {
    maxParticles?: number;      // default 10
    fps?: number;               // animation fps, default 24
    coneHalfAngleDeg?: number;  // lateral spread
    speedMin?: number;          // px/s
    speedMax?: number;          // px/s
    lifeMin?: number;           // ms
    lifeMax?: number;           // ms
    baseScaleMin?: number;
    baseScaleMax?: number;
};

type Particle = {
    spr: Sprite;
    life: number;       // ms lived
    maxLife: number;    // ms total life
    x: number;
    y: number;
    vx: number;         // px/ms
    vy: number;         // px/ms
    baseScale: number;
    frameAcc: number;   // ms accumulated for frame stepping
    frameIdx: number;
};

export class FlameParticles {
    public readonly container: ParticleContainer;

    private parts: Particle[] = [];
    private running = false;
    private lastTime = 0;
    private layer: Container;

    constructor(rootLayer: Container, private frames: Texture[], private ticker: Ticker, opts: FlameOpts = {}) {
        const { maxParticles = 10, } = opts;

        this.container = new ParticleContainer(maxParticles, {
            position: true,
            rotation: true,
            scale: true,
            alpha: true,
            uvs: false,
            vertices: false,
        });
        this.layer = new Container();
        this.layer.sortableChildren = true;
        rootLayer.addChild(this.layer);

        this.container.blendMode = BLEND_MODES.ADD;
        this.layer.addChild(this.container);

        // build sprites (≤ maxParticles) and initial particles
        for (let i = 0; i < maxParticles; i++) {
            const spr = new Sprite(this.frames[0]);
            spr.anchor.set(0.5);
            spr.visible = true;
            this.container.addChild(spr);
            this.parts.push({
                spr,
                life: 0,
                maxLife: 1000,
                x: 0, y: 0,
                vx: 0, vy: 0,
                baseScale: 1,
                frameAcc: 0,
                frameIdx: 0,
            });
            this.respawn(this.parts[i], /*stagger=*/ i * 60, opts);
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.ticker.add(this.update);
        for (const p of this.parts) {
            p.spr.alpha = Math.max(p.spr.alpha ?? 0, 0.001);
            p.spr.texture = this.frames[p.frameIdx] ?? this.frames[0];
        }
        this.update();
    }

    stop() {
        if (!this.running) return;
        this.running = false;
        this.ticker.remove(this.update);
    }

    clear() {
        for (const p of this.parts) {
            p.spr.visible = false;
        }
    }

    destroy() {
        this.stop();
        this.container.parent?.removeChild(this.container);
        this.container.destroy({ children: true });
        this.parts.length = 0;
    }

    // --- internals ---

    private update = () => {
        // if (!this.running) return;
        const now = performance.now();
        const dtMs = now - this.lastTime;
        this.lastTime = now;

        for (const p of this.parts) {
            // life
            p.life += dtMs;
            const t = Math.min(1, p.life / p.maxLife);

            // integrate
            // slight upward acceleration + little sideways jitter
            p.vy -= 0.0005 * dtMs;
            p.vx += (Math.random() * 0.001 - 0.0005) * dtMs;

            p.x += p.vx * dtMs;
            p.y += p.vy * dtMs;

            // scale/alpha over life
            const scale = p.baseScale * (0.7 + 0.7 * t);
            const speed = Math.hypot(p.vx, p.vy);
            const stretch = 1.0 + Math.min(0.6, speed * 12);
            const alpha = (1 - t) * (0.85 + 0.15 * Math.random());

            // advance animation frames at fps
            const fps = 24;
            p.frameAcc += dtMs;
            const frameDur = 1000 / fps;
            while (p.frameAcc >= frameDur) {
                p.frameAcc -= frameDur;
                p.frameIdx = (p.frameIdx + 1) % this.frames.length;
            }

            // apply to sprite
            p.spr.texture = this.frames[p.frameIdx];
            p.spr.position.set(p.x, p.y);
            p.spr.scale.set(scale * 0.8, scale * stretch);
            p.spr.alpha = alpha;
            p.spr.rotation += (Math.random() * 0.02 - 0.01);

            if (p.life >= p.maxLife) {
                this.respawn(p, 0);
            }
        }
    };

    private respawn(p: Particle, staggerMs = 0, opts: FlameOpts = {}) {
        const {
            coneHalfAngleDeg = 18,
            speedMin = 120,
            speedMax = 240,
            lifeMin = 700,
            lifeMax = 1200,
            baseScaleMin = 0.35,
            baseScaleMax = 0.6,
        } = opts;

        // spawn near base with tiny offset
        p.x = (Math.random() * 16 - 8);
        p.y = (Math.random() * 10 - 5);

        // velocity: mostly upward, angled within cone
        const baseAngle = -90 * (Math.PI / 180);
        const half = coneHalfAngleDeg * (Math.PI / 180);
        const ang = baseAngle + (Math.random() * 2 * half - half);
        const speed = (speedMin + Math.random() * (speedMax - speedMin)) / 1000; // px/ms
        p.vx = Math.cos(ang) * speed;
        p.vy = Math.sin(ang) * speed;

        p.baseScale = baseScaleMin + Math.random() * (baseScaleMax - baseScaleMin);
        p.maxLife = lifeMin + Math.random() * (lifeMax - lifeMin) + staggerMs;
        p.life = 0;
        p.frameAcc = 0;
        p.frameIdx = (Math.random() * this.frames.length) | 0;

        // initial apply
        p.spr.texture = this.frames[p.frameIdx];
        p.spr.position.set(p.x, p.y);
        p.spr.scale.set(p.baseScale);
        p.spr.alpha = 0.001;
        p.spr.rotation = 0;
    }

    public getContainer(): Container {
        return this.layer;
    }
}
