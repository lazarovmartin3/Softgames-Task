import { AssetManifest } from "./types";

export function getBaseUrl(): string {
    // In dev it's '/', in build with base:'' it's '' (empty)
    let b = (import.meta as any).env?.BASE_URL ?? "/";
    // normalize to either '' or 'xxx/'
    if (b !== "" && !b.endsWith("/")) b += "/";
    if (b === "/") b = ""; // treat '/' like relative
    return b;
}

const BASE = getBaseUrl();

export const assetManifest: AssetManifest[] = [
    { name: "cardA", url: `${BASE}assets/card_a.png`, type: "image", },
    { name: "cardB", url: `${BASE}assets/card_b.png`, type: "image", },
    { name: "flame", url: "assets/flame_spritesheet.json", type: "spritesheet" },
];

export type ApiDialogue = { name: string; text: string };
export type ApiEmoji = { name: string; url: string };
export type ApiAvatar = { name: string; url: string; position: "left" | "right" };
export type ApiPayload = { dialogue: ApiDialogue[]; emojies: ApiEmoji[]; avatars: ApiAvatar[] };