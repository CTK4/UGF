import { createNewGameState } from "@/engine/reducer";
import type { SaveData } from "@/ui/types";
import { migrateSave } from "@/domainE/persistence/saveMigration";

const SAVE_KEY = "ugf.save.v1";

function makeFreshSave(): SaveData {
  return migrateSave({ version: 1, gameState: createNewGameState() });
}

function backupRawSave(raw: string): void {
  const backupKey = `ugf_save_backup_${Date.now()}`;
  localStorage.setItem(backupKey, raw);
}

export function loadLocalSave(): { save: SaveData | null; corrupted: boolean } {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return { save: null, corrupted: false };

  try {
    const parsed = JSON.parse(raw) as unknown;
    const migrated = migrateSave(parsed);
    return { save: migrated, corrupted: false };
  } catch {
    backupRawSave(raw);
    return { save: makeFreshSave(), corrupted: true };
  }
}

export function persistLocalSave(save: SaveData): void {
  const migrated = migrateSave(save);
  localStorage.setItem(SAVE_KEY, JSON.stringify(migrated));
}

export function clearLocalSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
