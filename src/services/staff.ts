/**
 * League-wide staff model and deterministic coaching carousel.
 *
 * Determinism contract:
 * - All decisions derive from (seed, tick, ids, tables).
 * - Never use Math.random().
 */
import type { TableRegistry } from "@/data/TableRegistry";

export type StaffRole = "HC" | "OC" | "DC" | "QB_COACH" | "WR_RB" | "OL" | "DL" | "LB" | "DB" | "ASST" | "ST";
export type StaffPosition = "Owner" | "GM" | "Head Coach" | "Offensive Coordinator" | "Defensive Coordinator";

export type StaffMember = {
  id: string;
  name: string;
  position: StaffPosition;
  traits: string;
  rating: number; // 0..100 deterministic
  tier?: "Standard" | "Elite";
  scheme?: string;
  archetype?: string;
};

export type TeamStaff = { HC?: string; OC?: string; DC?: string; QB_COACH?: string; WR_RB?: string; OL?: string; DL?: string; LB?: string; DB?: string; ST?: string; ASST?: string };

export type StaffState = {
  staffById: Record<string, StaffMember>;
  teamStaff: Record<string, TeamStaff>; // teamId -> slots
  freeAgents: string[]; // staff ids
};

function stableString(x: unknown): string {
  return String(x ?? "").trim();
}

export function parseNameCell(cell: unknown): { name: string; traits: string } {
  const s = stableString(cell);
  const m = s.match(/^(.+?)\s*\((.*)\)\s*$/);
  if (!m) return { name: s, traits: "" };
  return { name: m[1].trim(), traits: m[2].trim() };
}

export function hashToUnit(seed: number, ...parts: Array<string | number>): number {
  const s = [seed, ...parts].join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned -> [0,1)
  return (h >>> 0) / 2 ** 32;
}

function ratingFor(seed: number, id: string, traits: string): number {
  // base in [35..85] plus trait bumps (deterministic)
  const base = 35 + Math.floor(hashToUnit(seed, "rating", id) * 51); // 35..85
  const t = traits.toLowerCase();
  const bump =
    (t.includes("leader") ? 4 : 0) +
    (t.includes("aggressive") ? 2 : 0) +
    (t.includes("discipl") ? 2 : 0) +
    (t.includes("vertical") ? 2 : 0) +
    (t.includes("zone") ? 2 : 0) +
    (t.includes("blitz") ? 2 : 0) +
    (t.includes("poor") ? -3 : 0) +
    (t.includes("conservative") ? -1 : 0);
  return Math.max(0, Math.min(100, base + bump));
}

function staffIdFromRow(row: Record<string, unknown>): string {
  const id = stableString(row["ID"]);
  return id ? `p:${id}` : "";
}

function buildPersonnelIndex(reg: TableRegistry): Map<string, StaffMember> {
  const tbl = reg.getTable("Personnel ID");
  const map = new Map<string, StaffMember>();
  for (const r of tbl) {
    const name = stableString(r["Name"]);
    const pos = stableString(r["Position"]) as StaffPosition;
    const traits = stableString(r["Archetype / Scheme / Traits"]);
    const id = staffIdFromRow(r) || `syn:${name}:${pos}`;
    map.set(`${name}::${pos}`, { id, name, position: pos, traits, rating: 50 });
  }
  return map;
}

function toRole(pos: StaffPosition): StaffRole | null {
  if (pos === "Head Coach") return "HC";
  if (pos === "Offensive Coordinator") return "OC";
  if (pos === "Defensive Coordinator") return "DC";
  return null;
}

export function initStaffState(reg: TableRegistry, seed: number): StaffState {
  const idx = buildPersonnelIndex(reg);
  const teamPersonnel = reg.getTable("Team Personnel");
  const staffById: Record<string, StaffMember> = {};
  const teamStaff: Record<string, TeamStaff> = {};

  const assigned = new Set<string>();

  const ensureMember = (name: string, pos: StaffPosition, traits: string): StaffMember => {
    const key = `${name}::${pos}`;
    const existing = idx.get(key);
    const member: StaffMember = existing
      ? { ...existing, traits: existing.traits || traits }
      : { id: `syn:${name}:${pos}`, name, position: pos, traits, rating: 50 };
    member.rating = ratingFor(seed, member.id, member.traits);
    staffById[member.id] = member;
    return member;
  };

const ensureSlotCoach = (teamId: string, role: StaffRole, label: string): string => {
  const id = `syn:${teamId}:${role}`;
  if (staffById[id]) return id;
  const member: StaffMember = {
    id,
    name: `${teamId} ${label}`,
    position: "Head Coach",
    traits: "Synthetic placeholder",
    rating: ratingFor(seed, id, label),
    tier: "Standard",
    scheme: "",
    archetype: "",
  };
  staffById[id] = member;
  return id;
};

  for (const row of teamPersonnel) {
    const teamId = stableString(row["Team"]);
    if (!teamId) continue;

    const hc = parseNameCell(row["Head Coach (Archetype)"]);
    const oc = parseNameCell(row["Offensive Coordinator (Scheme)"]);
    const dc = parseNameCell(row["Defensive Coordinator (Scheme)"]);

    const hcM = ensureMember(hc.name, "Head Coach", hc.traits);
    const ocM = ensureMember(oc.name, "Offensive Coordinator", oc.traits);
    const dcM = ensureMember(dc.name, "Defensive Coordinator", dc.traits);

    teamStaff[teamId] = { HC: hcM.id, OC: ocM.id, DC: dcM.id };
    assigned.add(hcM.id);
    assigned.add(ocM.id);
    assigned.add(dcM.id);
  }

  // Free agents: all personnel coaches not assigned
  const personnel = reg.getTable("Personnel ID");
  for (const r of personnel) {
    const pos = stableString(r["Position"]) as StaffPosition;
    const role = toRole(pos);
    if (!role) continue;

    const name = stableString(r["Name"]);
    const traits = stableString(r["Archetype / Scheme / Traits"]);
    const id = staffIdFromRow(r) || `syn:${name}:${pos}`;
    const m = ensureMember(name, pos, traits);
    if (!assigned.has(m.id)) assigned.add(m.id); // prevent duplicates
  }

  const allCoachIds = Object.keys(staffById).filter((id) => {
    const p = staffById[id]?.position;
    return p === "Head Coach" || p === "Offensive Coordinator" || p === "Defensive Coordinator";
  });


// fill missing position-coach slots
for (const teamId of Object.keys(teamStaff)) {
  const s = teamStaff[teamId];
  s.WR_RB = s.WR_RB ?? ensureSlotCoach(teamId, "WR_RB", "WR/RB Coach");
  s.OL = s.OL ?? ensureSlotCoach(teamId, "OL", "OL Coach");
  s.DL = s.DL ?? ensureSlotCoach(teamId, "DL", "DL Coach");
  s.LB = s.LB ?? ensureSlotCoach(teamId, "LB", "LB Coach");
  s.DB = s.DB ?? ensureSlotCoach(teamId, "DB", "DB Coach");
  s.ST = s.ST ?? ensureSlotCoach(teamId, "ST", "ST Coordinator");
}

  const freeAgents = allCoachIds.filter((id) => {
    // assigned if present in any team slot
    for (const ts of Object.values(teamStaff)) {
      if (ts.HC === id || ts.OC === id || ts.DC === id) return false;
    }
    return true;
  });

  freeAgents.sort();

  return { staffById, teamStaff, freeAgents };
}

export type CoachingEvent =
  | {
      tick: number;
      type: "STAFF_POACHED";
      fromTeamId: string;
      toTeamId: string;
      staffId: string;
      fromRole: StaffRole;
      toRole: StaffRole;
    };

export function fireHeadCoach(state: StaffState, teamId: string): StaffState {
  const ts = state.teamStaff[teamId];
  if (!ts?.HC) return state;
  const firedId = ts.HC;
  const next: StaffState = {
    ...state,
    teamStaff: { ...state.teamStaff, [teamId]: { ...ts, HC: undefined } },
    freeAgents: [...state.freeAgents, firedId].sort(),
  };
  return next;
}

export function hireIntoRole(state: StaffState, teamId: string, role: StaffRole, staffId: string): StaffState {
  const next = { ...state, teamStaff: { ...state.teamStaff }, freeAgents: [...state.freeAgents] } as StaffState;

  // Remove from free agents if present
  next.freeAgents = next.freeAgents.filter((id) => id !== staffId);

  // If staff currently employed, vacate their old role
  for (const [t, slots] of Object.entries(next.teamStaff)) {
    const s = { ...slots };
    let changed = false;
    for (const r of ["HC", "OC", "DC"] as StaffRole[]) {
      if ((s as any)[r] === staffId) {
        (s as any)[r] = undefined;
        changed = true;
      }
    }
    if (changed) next.teamStaff[t] = s;
  }

  const current = next.teamStaff[teamId] ?? {};
  next.teamStaff[teamId] = { ...current, [role]: staffId };
  return next;
}

function bestCandidateForRole(state: StaffState, seed: number, tick: number, teamId: string, role: StaffRole): string | null {
  const candidates: string[] = [];

  // Free agents always eligible
  candidates.push(...state.freeAgents);

  // Coordinators can be poached to HC
  if (role === "HC") {
    for (const [t, slots] of Object.entries(state.teamStaff)) {
      if (t === teamId) continue;
      if (slots.OC) candidates.push(slots.OC);
      if (slots.DC) candidates.push(slots.DC);
    }
  }

  const uniq = Array.from(new Set(candidates));
  if (uniq.length === 0) return null;

  uniq.sort((a, b) => {
    const ra = state.staffById[a]?.rating ?? 0;
    const rb = state.staffById[b]?.rating ?? 0;
    if (rb !== ra) return rb - ra;
    const ta = hashToUnit(seed, "cand", tick, teamId, role, a);
    const tb = hashToUnit(seed, "cand", tick, teamId, role, b);
    if (tb !== ta) return tb - ta;
    return a.localeCompare(b);
  });

  return uniq[0] ?? null;
}

export type CarouselResult = {
  next: StaffState;
  events: CoachingEvent[];
  franchiseOcPoached?: { fromTeamId: string; toTeamId: string; staffId: string };
};

export function simulateCoachingCarousel(opts: {
  reg: TableRegistry;
  seed: number;
  tick: number;
  franchiseTeamId: string;
  state: StaffState;
}): CarouselResult {
  const { seed, tick, franchiseTeamId } = opts;
  let s = opts.state;
  const events: CoachingEvent[] = [];

  const beforeFranchise = s.teamStaff[franchiseTeamId]?.OC;

  const teamIds = Object.keys(s.teamStaff).sort();

  // Deterministic HC firings
  for (const teamId of teamIds) {
    const roll = hashToUnit(seed, "fireHC", tick, teamId);
    const threshold = teamId === franchiseTeamId ? 0.01 : 0.04;
    if (roll < threshold) s = fireHeadCoach(s, teamId);
  }

  // Fill vacant HCs, cascade limited
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const teamId of teamIds) {
      const slots = s.teamStaff[teamId] ?? {};
      if (slots.HC) continue;

      const cand = bestCandidateForRole(s, seed, tick, teamId, "HC");
      if (!cand) continue;

      const fromTeam = Object.entries(s.teamStaff).find(([, st]) => st.HC === cand || st.OC === cand || st.DC === cand)?.[0] ?? "";
      const fromRole: StaffRole =
        fromTeam && s.teamStaff[fromTeam]?.HC === cand ? "HC" : fromTeam && s.teamStaff[fromTeam]?.OC === cand ? "OC" : "DC";

      s = hireIntoRole(s, teamId, "HC", cand);
      changed = true;

      if (fromTeam && fromTeam !== teamId) {
        events.push({
          tick,
          type: "STAFF_POACHED",
          fromTeamId: fromTeam,
          toTeamId: teamId,
          staffId: cand,
          fromRole,
          toRole: "HC",
        });
      }
    }
    if (!changed) break;
  }

  const afterFranchise = s.teamStaff[franchiseTeamId]?.OC;

  let franchiseOcPoached: CarouselResult["franchiseOcPoached"];
  if (beforeFranchise && afterFranchise !== beforeFranchise) {
    // Find where they went (if anywhere)
    let toTeam = "";
    for (const [t, slots] of Object.entries(s.teamStaff)) {
      if (slots.HC === beforeFranchise || slots.OC === beforeFranchise || slots.DC === beforeFranchise) {
        toTeam = t;
        break;
      }
    }
    if (toTeam && toTeam !== franchiseTeamId) {
      franchiseOcPoached = { fromTeamId: franchiseTeamId, toTeamId: toTeam, staffId: beforeFranchise };
    }
  }

  return { next: s, events, franchiseOcPoached };
}
