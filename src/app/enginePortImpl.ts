import type { EngineCallDescriptorStamped, EngineResponse, InterviewQuestion } from “@/ui/engine/types”;
import { advanceAsync, GateBlockedError, PhaseVersionMismatchError } from “@/phaseEngine”;
import { checkpointNowPort } from “./checkpointNowPort”;
import { createPersistencePort } from “@/domainE/persistence”;

const persistence = createPersistencePort();
const SAVE_ID = “default”;
const BACKUP_SAVE_ID = “default_backup”;

type InMemory = {
save: any;
leagueState: any;
};

const mem: InMemory = { save: null, leagueState: null };

function hashString(input: string): number {
let h = 2166136261;
for (let i = 0; i < input.length; i++) {
h ^= input.charCodeAt(i);
h = Math.imul(h, 16777619);
}
return h >>> 0;
}

function deterministicPick<T>(seed: string, list: T[]): T {
return list[hashString(seed) % list.length];
}

function makeId(prefix: string, seed: string): string {
return `${prefix}_${hashString(seed).toString(16)}`;
}

/**

- CRITICAL FIX: Always create checkpoint before saving
- This ensures checksum integrity and prevents corruption
  */
  async function persistCurrent(withBackup = true): Promise<void> {
  try {
  // Step 1: Create checkpoint (generates valid checksum)
  console.log(’[PERSIST] Creating checkpoint…’);
  await persistence.createCheckpoint(SAVE_ID, mem.save, { appendCheckpointEvent: true });
  
  // Step 2: Save with valid checksum
  console.log(’[PERSIST] Saving to IndexedDB…’);
  await persistence.save(SAVE_ID, mem.save);
  
  // Step 3: Backup (optional)
  if (withBackup) {
  console.log(’[PERSIST] Creating backup…’);
  await persistence.save(BACKUP_SAVE_ID, mem.save);
  }
  
  console.log(’[PERSIST] ✅ Save completed successfully’);
  } catch (error) {
  console.error(’[PERSIST] ❌ Save failed:’, error);
  throw error;
  }
  }

function buildInitialSave(seedBase: string): any {
console.log(’[INIT] Building new save with seed:’, seedBase);

return {
meta: {
createdAt: new Date().toISOString(),
updatedAt: new Date().toISOString(),
checksum: null,
prevChecksum: null,
saveId: SAVE_ID
},
game: {
leagueId: “ugf”,
clock: { season: 2026, phase: “preseason_setup”, week: 0, day: 0 },
timeline: { tick: 0 }
},
world: {},
fog: {},
systems: {
phaseEngine: null,
staffMarket: { sessionsById: {}, hires: [] },
interviews: { pool: [], sessions: {}, history: [] },
phone: { threads: [], relationship: 50, interest: 50 },
contracts: { expiring: [] }
},
events: { log: [] },
rng: { masterSeed: `seed_${hashString(seedBase)}` },
uxState: { notices: [] }
};
}

function buildInitialLeagueState(save: any): any {
return {
phaseVersion: 0,
rng: { masterSeed: save.rng.masterSeed },
clock: { …save.game.clock },
user: { franchiseTeamId: null },
teams: [],
config: {
freeAgency: { totalWeeks: 3, daysPerWeek: 7, granularity: “WEEK” },
trainingCamp: { totalWeeks: 3 },
regularSeason: { totalWeeks: 17 },
draft: { totalPicks: 224 }
},
market: { pendingOffers: [], udfaWindowClosed: false },
draft: {
orderFinalized: false,
pickOwnershipLocked: false,
totalPicks: 224,
currentOverallPick: 1,
onClockTeamId: “”,
eligiblePlayerIds: [],
draftedPlayerIds: new Set<string>()
},
rosters: { allTeamsAtFinalSize: false, offseasonCutsComplete: false }
};
}

function baseCandidates(role: string) {
return [
{ name: “Alex Romero”, traits: [“QB-friendly”, “tempo control”], scheme: “Spread”, ego: 61, personality: “Measured” },
{ name: “Nolan Price”, traits: [“player dev”, “situational aggression”], scheme: “West Coast”, ego: 48, personality: “Teacher” },
{ name: “Sam Rourke”, traits: [“blitz packages”, “red zone focus”], scheme: “3-4 Hybrid”, ego: 73, personality: “Intense” },
{ name: “Kyle Benton”, traits: [“analytics”, “scripted drives”], scheme: “Air Raid”, ego: 55, personality: “Collaborative” },
{ name: “Brian Walsh”, traits: [“discipline”, “turnover margin”], scheme: “Ball Control”, ego: 66, personality: “Old School” },
{ name: “Devon Lake”, traits: [“adaptability”, “locker-room buy-in”], scheme: role === “OC” ? “RPO” : “4-2-5”, ego: 42, personality: “Players Coach” }
];
}

function deterministicCandidates(role: string, salt: string): any[] {
const master = `${role}:${salt}`;
const cands = baseCandidates(role);
const count = 3 + (hashString(master) % 3);
const chosen: any[] = [];

for (let i = 0; i < count; i++) {
const seed = `${master}:${i}`;
const base = deterministicPick(seed, cands);
const candidateId = makeId(“cand”, seed);

```
chosen.push({
  candidateId,
  role,
  coachName: base.name,
  traits: base.traits,
  scheme: base.scheme,
  ego: base.ego,
  personality: base.personality,
  salary: 800 + (hashString(seed) % 400),
  years: 3 + (hashString(seed + ":years") % 2),
  available: true
});
```

}

return chosen;
}

function sessionKey(role: string, week: number): string {
return `${role}:w${week}`;
}

async function ensureStaffMarketSession(role: string): Promise<void> {
const week = mem.save?.game?.clock?.week ?? 0;
const key = sessionKey(role, week);
const systems = mem.save?.systems ?? {};
const market = systems.staffMarket ?? { sessionsById: {}, hires: [] };

if (!market.sessionsById[key]) {
const salt = `${mem.save?.rng?.masterSeed ?? "default"}:${key}`;
const candidates = deterministicCandidates(role, salt);

```
market.sessionsById[key] = {
  role,
  week,
  candidates,
  refreshCount: 0
};

mem.save.systems.staffMarket = market;
await persistCurrent();
```

}
}

export async function initEngine(): Promise<EngineResponse> {
console.log(’[ENGINE] Initializing…’);

try {
const loaded = await persistence.load(SAVE_ID);
mem.save = loaded;
mem.leagueState = buildInitialLeagueState(loaded);
console.log(’[ENGINE] ✅ Loaded existing save’);

```
return {
  success: true,
  view: "HubScreen",
  snapshot: { save: mem.save, leagueState: mem.leagueState },
  notices: mem.save?.uxState?.notices ?? []
};
```

} catch (err: any) {
console.log(’[ENGINE] No existing save, creating new one…’);

```
const seedBase = `new_${Date.now()}`;
mem.save = buildInitialSave(seedBase);
mem.leagueState = buildInitialLeagueState(mem.save);

// CRITICAL: Must create checkpoint for new save
await persistCurrent();

console.log('[ENGINE] ✅ New save created');

return {
  success: true,
  view: "StartScreen",
  snapshot: { save: mem.save, leagueState: mem.leagueState },
  notices: []
};
```

}
}

export async function engineCall(desc: EngineCallDescriptorStamped): Promise<EngineResponse> {
console.log(’[ENGINE] Call:’, desc.type);

try {
const result = await handleEngineCall(desc);
return result;
} catch (error: any) {
console.error(’[ENGINE] ❌ Error:’, error);

```
return {
  success: false,
  error: error.message || 'Unknown error',
  view: "HubScreen",
  snapshot: { save: mem.save, leagueState: mem.leagueState },
  notices: [{
    id: `error_${Date.now()}`,
    message: `Error: ${error.message}`,
    severity: 'error'
  }]
};
```

}
}

async function handleEngineCall(desc: EngineCallDescriptorStamped): Promise<EngineResponse> {
const { type, payload } = desc;

switch (type) {
case “LOAD_STAFF_MARKET”: {
const role = payload?.role ?? “OC”;
await ensureStaffMarketSession(role);

```
  const week = mem.save.game.clock.week;
  const key = sessionKey(role, week);
  const session = mem.save.systems.staffMarket.sessionsById[key];
  
  return {
    success: true,
    view: "HireMarketScreen",
    snapshot: { save: mem.save, leagueState: mem.leagueState },
    data: { role, candidates: session.candidates },
    notices: []
  };
}

case "TRY_HIRE": {
  const { candidateId } = payload;
  await ensureStaffMarketSession(payload.role);
  
  const week = mem.save.game.clock.week;
  const key = sessionKey(payload.role, week);
  const session = mem.save.systems.staffMarket.sessionsById[key];
  const candidate = session.candidates.find((c: any) => c.candidateId === candidateId);
  
  if (!candidate) {
    throw new Error("Candidate not found");
  }
  
  if (!candidate.available) {
    throw new Error("Candidate no longer available");
  }
  
  return {
    success: true,
    view: "CandidateDetailScreen",
    snapshot: { save: mem.save, leagueState: mem.leagueState },
    data: { candidate },
    notices: []
  };
}

case "CONFIRM_HIRE": {
  const { candidateId, role } = payload;
  const week = mem.save.game.clock.week;
  const key = sessionKey(role, week);
  const session = mem.save.systems.staffMarket.sessionsById[key];
  const candidate = session.candidates.find((c: any) => c.candidateId === candidateId);
  
  if (!candidate || !candidate.available) {
    throw new Error("Cannot hire candidate");
  }
  
  // Mark as hired
  candidate.available = false;
  mem.save.systems.staffMarket.hires.push({
    candidateId,
    role,
    week,
    salary: candidate.salary,
    years: candidate.years
  });
  
  await persistCurrent();
  
  return {
    success: true,
    view: "HubScreen",
    snapshot: { save: mem.save, leagueState: mem.leagueState },
    notices: [{
      id: `hire_${Date.now()}`,
      message: `Hired ${candidate.coachName} as ${role}`,
      severity: 'success'
    }]
  };
}

case "ADVANCE_WEEK": {
  console.log('[ADVANCE] Advancing week...');
  
  mem.save.game.clock.week += 1;
  mem.save.game.timeline.tick += 1;
  
  await persistCurrent();
  
  return {
    success: true,
    view: "HubScreen",
    snapshot: { save: mem.save, leagueState: mem.leagueState },
    notices: [{
      id: `advance_${Date.now()}`,
      message: `Advanced to Week ${mem.save.game.clock.week}`,
      severity: 'info'
    }]
  };
}

default:
  console.warn('[ENGINE] Unknown action:', type);
  
  return {
    success: false,
    error: `Unknown action: ${type}`,
    view: "HubScreen",
    snapshot: { save: mem.save, leagueState: mem.leagueState },
    notices: []
  };
```

}
}

export const enginePort = {
init: initEngine,
call: engineCall
};
