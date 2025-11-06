# Softgames Test — PixiJS + TypeScript

A small demo project built with **PixiJS** and **TypeScript**, featuring three self-contained tasks/scenes:

- **Ace of Shadows**
- **Magic Words**
- **Phoenix Flame**

The app uses **Vite** for fast dev builds, an `AssetLoader` helper for assets, and a simple `SceneManager` to swap scenes.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 16
- **npm**

### Install & Run (dev)
```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

### Production Build
```bash
npm run build
npm run preview   # serve the production build locally
```

---

## 🧭 Project Structure

```
.
├─ public/
│  └─ assets/                # spritesheets, images (static)
├─ src/
│  ├─ main.ts                # app entry
│  ├─ GameApplication.ts     # bootstraps the app (GameApplication)
│  ├─ GameRenderer.ts        # PIXI app & scene loader (GameRenderer)
│  ├─ SceneManager.ts        # scene switching
│  ├─ config.ts              # asset manifest & URL helpers
│  ├─ scenes/
│  │  ├─ IScene.ts
│  │  ├─ MenuScene.ts
│  │  ├─ AceOfShadows.ts
│  │  ├─ MagicWords.ts
│  │  └─ PhoenixFlame.ts
│  ├─ ui/
│  │  ├─ Button.ts
│  │  └─ TopBar.ts
│  ├─ utils/
│  │  ├─ AssetLoader.ts      # asset helper (AssetLoader)
│  │  ├─ FlameParticles.ts
│  │  ├─ FpsCounter.ts
│  │  └─ Resize.ts
│  └─ types.d.ts             # AppConfig etc.
├─ index.html                # app shell
├─ style/
│  ├─ main.css
│  └─ menu.css
├─ package.json              # scripts & dependencies
├─ vite.config.ts
└─ package.sh                # simple packaging script
```

---

## 🧩 Scenes

Each scene is a plain class implementing **`IScene`** and is managed by **`SceneManager`**:

- `MenuScene` – simple scene selector
- `AceOfShadows`, `MagicWords`, `PhoenixFlame` – the three tasks

Add a new scene by:
1. Creating `src/scenes/MyScene.ts` that implements `IScene`.
2. Registering/switching it via `SceneManager`.

---

## 🖼️ Assets

- **Where**: put static files under `public/assets/`.
- **Manifest**: add items to `src/config.ts` (used by `AssetLoader`).
- **Loading**: `AssetLoader.performAssetLoad(...)` handles spritesheets/spine/images.

> Note: Remote dialogue/assets are fetched by a **Downloader** from a mock API **before** renderer initialization.

---

## ⚙️ Configuration & Sizing

- **Canvas sizing / resolution**: tweak in `src/main.ts`.
- Or adjust **`AppConfig`** in `src/types.d.ts`.

---

## 📜 Scripts

Common scripts in `package.json`:

- `dev` – start Vite dev server
- `build` – production build
- `preview` – preview the production build locally

Packaging helper:
```bash
./package.sh
```

---

## 🧰 Troubleshooting

- **CORS or missing images**  
  Ensure files exist under `public/assets/` and paths in `src/config.ts` are correct.

- **PIXI spritesheet/spine load failures**  
  Check `AssetLoader.performAssetLoad` and your `assetManifest` entries in `src/config.ts`.

- **Sizing issues / blurry rendering**  
  Revisit canvas sizing/resolution in `src/main.ts` or `AppConfig` in `src/types.d.ts`.

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feat/my-change`
2. Commit: `git commit -m "feat: describe change"`
3. Push: `git push origin feat/my-change`
4. Open a PR

---

## 📄 License

Add your license of choice here (e.g., MIT). If proprietary, note the usage restrictions.

---

### Notes

- Keep scene logic self-contained: input, update loop, and draw lifecycle in each `IScene` implementation.
- Keep assets referenced only via the manifest to avoid brittle hard-coded paths.
