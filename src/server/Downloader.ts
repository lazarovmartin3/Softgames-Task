import { ApiPayload } from "@/config";
import { AssetManifest } from "@/types";
import { AssetLoader } from "../utils/AssetLoader";


const URL = "https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords";

export class Downloader {
    public static instance: Downloader;
    private data!: ApiPayload;
    private apiManifest: AssetManifest[] = [];

    public static getInstance(): Downloader {
        if (!Downloader.instance) {
            Downloader.instance = new Downloader();
        }
        return Downloader.instance;
    }

    public async init(): Promise<void> {
        await this.fetchData();
    }

    private async fetchData(): Promise<void> {
        const res = await fetch(URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`MagicWords: HTTP ${res.status}`);
        this.data = await res.json() as ApiPayload;
        this.apiManifest = [
            ...this.data.emojies.map(e => ({ name: `emoji:${e.name}`, url: e.url, type: "image" as const })),
            ...this.data.avatars.map(a => ({ name: `avatar:${a.name}`, url: a.url, type: "image" as const })),
        ];
        await AssetLoader.getInstance().loadAssets(this.apiManifest);
    }

    getData(): ApiPayload {
        if (!this.data) throw new Error("Downloader not prepared. Call fetch() first.");
        return this.data;
    }
}