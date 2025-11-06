import { AssetManifest } from '@/types';
import { Assets, Texture } from "pixi.js";

export class AssetLoader {
    private static instance: AssetLoader;
    private loadedAssets: Map<string, any> = new Map();
    private loadingPromises: Map<string, Promise<any>> = new Map();
    private isInitialized: boolean = false;

    public static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    /**
     * Initialize the asset loader
     */
    public async init(): Promise<void> {
        return this.initialize();
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize PIXI Assets
            await Assets.init();

            // Add spine support to Assets loader
            // This should be automatically done by importing 'pixi-spine'

            this.setInitialized(true);
            console.log('AssetLoader initialized successfully');
        } catch (error) {
            console.error('Failed to initialize AssetLoader:', error);
            throw error;
        }
    }

    public destroy(): void {
        this.clearAssets();
        this.setInitialized(false);
        console.log('AssetLoader destroyed');
    }

    /**
     * Load assets from manifest
     */
    public async loadAssets(manifest: AssetManifest[]): Promise<void> {
        console.log(`Loading ${manifest.length} assets...`);

        const loadPromises = manifest.map(asset => this.loadAsset(asset));

        try {
            await Promise.all(loadPromises);
            console.log('All assets loaded successfully');
        } catch (error) {
            console.error('Failed to load assets:', error);
            throw error;
        }
    }

    /**
     * Load a single asset
     */
    public async loadAsset(manifest: AssetManifest): Promise<any> {
        if (this.loadedAssets.has(manifest.name)) {
            return this.loadedAssets.get(manifest.name);
        }

        if (this.loadingPromises.has(manifest.name)) {
            return this.loadingPromises.get(manifest.name);
        }

        const loadPromise = this.performAssetLoad(manifest);
        this.loadingPromises.set(manifest.name, loadPromise);

        try {
            const asset = await loadPromise;
            this.loadedAssets.set(manifest.name, asset);
            this.loadingPromises.delete(manifest.name);
            console.log(`Asset "${manifest.name}" loaded successfully`);
            return asset;
        } catch (error) {
            this.loadingPromises.delete(manifest.name);
            console.error(`Failed to load asset "${manifest.name}":`, error);
            throw error;
        }
    }

    /**
     * Perform the actual asset loading
     */
    private async performAssetLoad(manifest: AssetManifest): Promise<any> {
        console.log(`Loading asset: ${manifest.name} from ${manifest.url}`);

        try {
            switch (manifest.type) {
                case 'spine':
                    // Ensure the Spine atlas is provided via metadata. Default to same path with .atlas
                    {
                        const atlasUrl = manifest.url.replace(/\.json$/i, '.atlas');
                        // Add with alias so we can attach metadata
                        await Assets.add({
                            alias: manifest.name,
                            src: manifest.url,
                            data: { metadata: { spineAtlasFile: atlasUrl } },
                        });
                        const spineData = await Assets.load(manifest.name);
                        console.log(`Spine asset loaded:`, spineData);
                        return spineData;
                    }
                case 'image':
                case 'texture': {
                    try {
                        let tex = await Assets.load<Texture>(manifest.url);
                        if (!tex) {
                            tex = await this.loadTextureViaFetch(manifest.url);
                        }
                        return tex;
                    } catch (e) {
                        const tex = await this.loadTextureViaFetch(manifest.url);
                        return tex;
                    }
                }
                // return await Assets.load(manifest.url);
                case 'sound':
                    return await Assets.load(manifest.url);
                // case 'image':
                //     return await Assets.load(manifest.url);
                case 'spritesheet':
                    return await Assets.load(manifest.url);
                default:
                    throw new Error(`Unsupported asset type: ${manifest.type}`);
            }
        } catch (error) {
            console.error(`Error in performAssetLoad for ${manifest.name}:`, error);
            throw error;
        }
    }

    private async loadTextureViaFetch(url: string): Promise<Texture> {
        const res = await fetch(url, { mode: "cors", cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const blob = await res.blob();
        const bitmap = await createImageBitmap(blob);
        return Texture.from(bitmap);
    }

    /**
     * Get a loaded asset
     */
    public getAsset<T = any>(name: string): T | null {
        return this.loadedAssets.get(name) || null;
    }

    public getAssets(): Map<string, any> {
        return new Map(this.loadedAssets);
    }

    /**
     * Check if an asset is loaded
     */
    public hasAsset(name: string): boolean {
        return this.loadedAssets.has(name);
    }

    /**
     * Get all loaded assets
     */
    public getAllAssets(): Map<string, any> {
        return new Map(this.loadedAssets);
    }

    /**
     * Clear all loaded assets
     */
    public clearAssets(): void {
        this.loadedAssets.clear();
        this.loadingPromises.clear();
        console.log('All assets cleared');
    }

    /**
     * Get loading progress
     */
    public getLoadingProgress(): number {
        const totalAssets = this.loadedAssets.size + this.loadingPromises.size;
        if (totalAssets === 0) return 1;
        return this.loadedAssets.size / totalAssets;
    }

    private setInitialized(status: boolean): void {
        this.isInitialized = status;
    }
}