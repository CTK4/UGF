import { verifySaveOrThrow, computeEventHash, computeStateChecksum } from "./verifySave";

export type SaveId = string;
export type GameState = any;

export type CheckpointIntegrity = {
  checkpointId: string; // == stateHash
  stateHash: string;    // == meta.checksum
  prevHash: string | null;
  tick: number;
  lastEventHash: string | null;
};

export type CreateCheckpointOpts = { appendCheckpointEvent?: boolean };

export type PersistencePort = {
  load(saveId: SaveId): Promise<GameState>;
  createCheckpoint(saveId: SaveId, state: GameState, opts?: CreateCheckpointOpts): Promise<CheckpointIntegrity>;
  save(saveId: SaveId, state: GameState): Promise<void>;
};

type DbRowSaves = {
  saveId: string;
  createdAt: string;
  updatedAt: string;
  meta: any;
  gameSummary: any;
};

type DbRowBlob = {
  saveId: string;
  blobType: "game" | "world" | "fog" | "systems" | "events" | "rng" | "uxState";
  data: any;
};

const DB_NAME = "ugf_db";
const DB_VERSION = 1;
const STORE_SAVES = "saves";
const STORE_BLOBS = "save_blobs";

function nowIso(): string { return new Date().toISOString(); }

async function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SAVES)) {
        db.createObjectStore(STORE_SAVES, { keyPath: "saveId" });
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const os = db.createObjectStore(STORE_BLOBS, { keyPath: ["saveId", "blobType"] });
        os.createIndex("bySaveId", "saveId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function idbPut(db: IDBDatabase, store: string, value: any): Promise<void> {
  const tx = db.transaction(store, "readwrite");
  tx.objectStore(store).put(value);
  await txDone(tx);
}

async function idbGet<T>(db: IDBDatabase, store: string, key: any): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbGetAllBySaveId<T extends { saveId: string }>(db: IDBDatabase, store: string, saveId: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const os = tx.objectStore(store);
    const idx = os.index("bySaveId");
    const req = idx.getAll(saveId);
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

function getTick(state: any): number {
  const tick = state?.game?.timeline?.tick;
  if (typeof tick !== "number") throw new Error("state.game.timeline.tick missing/non-number");
  return tick;
}

function ensureWalClosed(state: any): void {
  const log: any[] = state?.events?.log ?? [];
  let openIndex = -1;
  for (let i = 0; i < log.length; i++) {
    const t = log[i]?.type;
    if (t === "EPOCH_BEGIN") openIndex = i;
    if (openIndex !== -1 && (t === "EPOCH_END" || t === "EPOCH_RECOVERED")) openIndex = -1;
  }
  if (openIndex !== -1) throw new Error(`WAL violation: open epoch at events.log[${openIndex}]`);
}

function newEventId(): string {
  return `evt_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function appendEvent(state: any, evt: any): void {
  state.events = state.events ?? {};
  state.events.log = state.events.log ?? [];
  state.events.log.push(evt);
}

async function rehashAllEvents(state: any): Promise<string | null> {
  const log: any[] = state?.events?.log ?? [];
  let last: string | null = null;
  for (let i = 0; i < log.length; i++) {
    const evt = log[i];
    evt.prevHash = i === 0 ? null : (log[i - 1]?.hash ?? null);
    evt.hash = await computeEventHash(evt);
    last = evt.hash ?? null;
  }
  return last;
}

export function createPersistencePort(): PersistencePort {
  return {
    async load(saveId: SaveId): Promise<GameState> {
      const db = await openDb();
      const head = await idbGet<DbRowSaves>(db, STORE_SAVES, saveId);
      if (!head) throw new Error(`Save not found: ${saveId}`);

      const blobs = await idbGetAllBySaveId<DbRowBlob>(db, STORE_BLOBS, saveId);
      const byType = new Map<DbRowBlob["blobType"], any>();
      for (const b of blobs) byType.set(b.blobType, b.data);

      const state: any = {
        meta: head.meta ?? {},
        game: byType.get("game") ?? null,
        world: byType.get("world") ?? null,
        fog: byType.get("fog") ?? null,
        systems: byType.get("systems") ?? null,
        events: byType.get("events") ?? null,
        rng: byType.get("rng") ?? null,
      };
      const ux = byType.get("uxState");
      if (ux) state.uxState = ux;

      await verifySaveOrThrow(state);
      return state;
    },

    async createCheckpoint(saveId: SaveId, state: GameState, opts?: CreateCheckpointOpts): Promise<CheckpointIntegrity> {
      ensureWalClosed(state);

      const tick = getTick(state);
      const appendCheckpointEvent = opts?.appendCheckpointEvent ?? true;

      if (appendCheckpointEvent) {
        appendEvent(state, {
          id: newEventId(),
          tick,
          type: "CHECKPOINT_SAVED",
          payload: { saveId },
          rng: null,
          prevHash: null,
          hash: null,
        });
      }

      const lastEventHash = await rehashAllEvents(state);

      state.meta = state.meta ?? {};
      const prevChecksum: string | null = state.meta.checksum ?? null;

      const newChecksum = await computeStateChecksum(state);

      state.meta.prevChecksum = prevChecksum;
      state.meta.checksum = newChecksum;
      state.meta.updatedAt = nowIso();
      state.meta.saveId = state.meta.saveId ?? saveId;

      await verifySaveOrThrow(state);

      return {
        checkpointId: newChecksum,
        stateHash: newChecksum,
        prevHash: prevChecksum,
        tick,
        lastEventHash,
      };
    },

    async save(saveId: SaveId, state: GameState): Promise<void> {
      await verifySaveOrThrow(state);

      const db = await openDb();

      const createdAt = state?.meta?.createdAt ?? nowIso();
      const updatedAt = state?.meta?.updatedAt ?? nowIso();

      const savesRow: DbRowSaves = {
        saveId,
        createdAt,
        updatedAt,
        meta: state.meta,
        gameSummary: {
          clock: state?.game?.clock ?? null,
          tick: state?.game?.timeline?.tick ?? null,
          leagueId: state?.game?.leagueId ?? null,
        },
      };

      await idbPut(db, STORE_SAVES, savesRow);

      const blobs: DbRowBlob[] = [
        { saveId, blobType: "game", data: state.game ?? null },
        { saveId, blobType: "world", data: state.world ?? null },
        { saveId, blobType: "fog", data: state.fog ?? null },
        { saveId, blobType: "systems", data: state.systems ?? null },
        { saveId, blobType: "events", data: state.events ?? null },
        { saveId, blobType: "rng", data: state.rng ?? null },
      ];

      if (state.uxState) blobs.push({ saveId, blobType: "uxState", data: state.uxState });

      for (const b of blobs) await idbPut(db, STORE_BLOBS, b);
    },
  };
}
