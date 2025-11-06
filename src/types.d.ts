export interface AppConfig {
    width: number;
    height: number;
    backgroundColor: number;
    resolution: number;
    antialias: boolean;
}

export interface AssetManifest {
    name: string;
    url: string;
    type: 'spine' | 'texture' | 'sound' | 'image' | 'spritesheet';
}