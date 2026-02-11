import type { SaveData } from "@/ui/types";

const SAVE_KEY = "ugf.save.v1";

export function loadLocalSave(): { save: SaveData | null; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: null, corrupted: false };
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed?.version !== 1 || !parsed?.gameState) return { save: null, corrupted: true };
    return { save: parsed, corrupted: false };
  } catch {
    return { save: null, corrupted: true };
  }
}

export function persistLocalSave(save: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function clearLocalSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
