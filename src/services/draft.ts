import type { TableRegistry } from "@/data/TableRegistry";
import type { DraftProspectBelief, DraftProspectTruth, DraftState, DraftTeamProfile } from "@/ui/types";

export type DraftInitArgs = {
  reg: TableRegistry;
  seed: number;
  year: number;
  staff?: any;
  teamNeedAdjustments?: Record<string, Record<string, number>>;
};

function hash32(seed: number, ...parts: Array<string | number | undefined | null>): number {
  let h = 2166136261 >>> 0;
  const s = `${seed}|${parts.map((p) => String(p ?? "")).join("|")}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function unit(seed: number, ...parts: Array<string | number | undefined | null>): number {
  return (hash32(seed, ...parts) % 1_000_000) / 1_000_000;
}

function normal01(seed: number, ...parts: Array<string | number | undefined | null>): number {
  // Box-Muller from two deterministic uniforms
  const u1 = Math.max(1e-9, unit(seed, ...parts, "u1"));
  const u2 = Math.max(1e-9, unit(seed, ...parts, "u2"));
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function posGroup(pos: string): string {
  const p = String(pos ?? "").toUpperCase();
  if (p === "QB") return "QB";
  if (["EDGE", "DE", "OLB"].includes(p)) return "EDGE";
  if (["OT", "T"].includes(p)) return "OT";
  if (["CB"].includes(p)) return "CB";
  if (["WR"].includes(p)) return "WR";
  if (["DI", "DT", "IDL"].includes(p)) return "DI";
  if (["S", "FS", "SS"].includes(p)) return "S";
  if (["OG", "C", "G"].includes(p)) return "OGC";
  if (["LB", "ILB", "MLB"].includes(p)) return "LB";
  if (["TE"].includes(p)) return "TE";
  if (["RB", "HB"].includes(p)) return "RB";
  if (["K", "P", "LS"].includes(p)) return "K";
  return p || "UNK";
}

const POS_MULT: Record<string, number> = {
  QB: 1.55,
  EDGE: 1.25,
  OT: 1.2,
  CB: 1.18,
  WR: 1.12,
  DI: 1.05,
  S: 1.02,
  OGC: 0.98,
  LB: 0.95,
  TE: 0.92,
  RB: 0.75,
  K: 0.25,
};

function generateTruth(seed: number, prospect: any): DraftProspectTruth {
  const id = String(prospect["Player ID"]);
  const baseRank = Number(prospect.Rank ?? 200);
  // Higher rank => higher true ovr, but still noisy
  const base = clamp(92 - baseRank * 0.10, 55, 92);
  const ovr = clamp(Math.round(base + normal01(seed, "truth:ovr", id) * 4), 50, 95);
  const pot = clamp(Math.round(ovr + 3 + unit(seed, "truth:pot", id) * 10), 55, 99);

  const volatility = clamp(0.15 + unit(seed, "truth:vol", id) * 0.60, 0, 1);
  const durability = clamp(0.55 + unit(seed, "truth:dur", id) * 0.45, 0, 1);
  const mental = clamp(0.40 + unit(seed, "truth:ment", id) * 0.55, 0, 1);

  return { ovr, pot, volatility, durability, mental };
}

function teamProfile(seed: number, teamId: string): DraftTeamProfile {
  const aggression = clamp(0.20 + unit(seed, "team:agg", teamId) * 0.70, 0, 1);
  const riskTolerance = clamp(0.15 + unit(seed, "team:risk", teamId) * 0.80, 0, 1);
  const tradeFrequency = clamp(0.10 + unit(seed, "team:trade", teamId) * 0.60, 0, 1);
  return { aggression, riskTolerance, tradeFrequency };
}

function beliefFor(seed: number, teamId: string, prospect: any, truth: DraftProspectTruth, need: number): DraftProspectBelief {
  const id = String(prospect["Player ID"]);
  const variance = clamp(4 + unit(seed, "belief:var", teamId, id) * 10, 4, 14);

  const bias = (unit(seed, "belief:bias", teamId, id) - 0.5) * 3.0;
  const needBoost = (need - 0.5) * 6.0; // [-3..+3]
  const schemeFit = clamp(0.85 + unit(seed, "belief:fit", teamId, id) * 0.30, 0.85, 1.15);

  const est = truth.ovr + normal01(seed, "belief:noise", teamId, id) * variance + bias + needBoost + (schemeFit - 1) * 6;
  const grade = clamp(Math.round(est), 45, 99);

  const confidence = clamp(1 - variance / 18, 0.15, 0.95);

  const riskRoll = unit(seed, "belief:riskflag", teamId, id);
  const riskFlag =
    riskRoll < 0.06 ? "Medical concern" : riskRoll < 0.11 ? "Character concern" : riskRoll < 0.15 ? "Scheme fit concern" : undefined;

  return { grade, variance, confidence, schemeFit, riskFlag };
}

export function computeTeamNeeds(reg: TableRegistry, staff?: any, teamNeedAdjustments?: Record<string, Record<string, number>>): Record<string, Record<string, number>> {
  // Very simple: counts by position group; need = 1 - clamp(count/desired,0,1)
  const roster = reg.getTable("Roster") as any[];
  const desired: Record<string, number> = { QB: 3, WR: 10, RB: 5, TE: 5, OT: 6, OGC: 9, EDGE: 7, DI: 6, LB: 7, CB: 7, S: 6, K: 3 };
  const byTeam: Record<string, Record<string, number>> = {};

  for (const r of roster) {
    const teamId = String(r.Team ?? "").trim();
    if (!teamId) continue;
    const g = posGroup(String(r.Pos ?? r.Position ?? ""));
    byTeam[teamId] ??= {};
    byTeam[teamId][g] = (byTeam[teamId][g] ?? 0) + 1;
  }

  const out: Record<string, Record<string, number>> = {};
  for (const teamId of Object.keys(byTeam)) {
    out[teamId] = {};
    for (const g of Object.keys(desired)) {
      const c = byTeam[teamId][g] ?? 0;
      out[teamId][g] = clamp(1 - clamp(c / desired[g], 0, 1), 0, 1);
    }
  }
  return out;
}

export function initDraftState(args: DraftInitArgs): DraftState {
  const orderRows = args.reg.getTable("Draft Order") as any[];
  const order = orderRows.map((r) => ({
    pickNo: Number(r.Pick),
    teamId: String(r.Team ?? "").trim(),
    round: Number(r.Round ?? 1),
  }));

  const classRows = args.reg.getTable("2026 Draft Class") as any[];
  const available = classRows.map((r) => `p:${String(r["Player ID"])}`);

  const needs = computeTeamNeeds(args.reg, args.staff, args.teamNeedAdjustments);

  const teamProfiles: Record<string, DraftTeamProfile> = {};
  for (const o of order) teamProfiles[o.teamId] ??= teamProfile(args.seed, o.teamId);

  const truthById: Record<string, DraftProspectTruth> = {};
  for (const r of classRows) {
    const id = `p:${String(r["Player ID"])}`;
    truthById[id] = generateTruth(args.seed, r);
  }

  const beliefByTeam: Record<string, Record<string, DraftProspectBelief>> = {};
  const posById: Record<string, string> = {};
  for (const r of classRows) posById[`p:${String(r["Player ID"])}`] = posGroup(String(r.POS ?? ""));

  for (const teamId of Object.keys(teamProfiles)) {
    const map: Record<string, DraftProspectBelief> = {};
    for (const r of classRows) {
      const id = `p:${String(r["Player ID"])}`;
      const g = posById[id];
      const need = needs[teamId]?.[g] ?? 0.5;
      map[id] = beliefFor(args.seed, teamId, r, truthById[id], need);
    }
    beliefByTeam[teamId] = map;
  }

  return {
    year: args.year,
    currentPickIndex: 0,
    order,
    available,
    results: {},
    teamProfiles,
    truthById,
    beliefByTeam,
    user: {
      targets: {},
      comfortRange: {},
      noPick: {},
      riskTolerance: 0.5,
      positionalUrgency: {},
      longTermBias: 0.6,
    },
    news: [],
  };
}

export function bestPickForTeam(args: {
  reg: TableRegistry;
  draft: DraftState;
  teamId: string;
  franchiseTeamId: string;
  seed: number;
}): { playerId: string; note: string } {
  const classRows = args.reg.getTable("2026 Draft Class") as any[];
  const byId: Record<string, any> = {};
  for (const r of classRows) byId[`p:${String(r["Player ID"])}`] = r;

  const profile = args.draft.teamProfiles[args.teamId];
  const belief = args.draft.beliefByTeam[args.teamId] ?? {};
  const avail = args.draft.available;

  // filter disqualified
  const candidates = avail
    .map((id) => ({ id, r: byId[id], b: belief[id], t: args.draft.truthById[id] }))
    .filter((x) => x.r && x.b)
    .filter((x) => !x.b.noPick)
    .filter((x) => !(x.b.riskFlag && x.b.riskFlag === "Medical concern" && profile.riskTolerance < 0.35));

  // tiering by belief grade
  candidates.sort((a, b) => (b.b.grade - a.b.grade) || (a.id.localeCompare(b.id)));

  const top = candidates.slice(0, 12);
  if (!top.length) return { playerId: avail[0], note: "Fallback: first available." };

  // choose among top with bounded randomness influenced by aggression/risk
  const temp = top.map((c, i) => {
    const g = posGroup(String(c.r.POS ?? ""));
    const posW = POS_MULT[g] ?? 1.0;
    const riskPenalty = (c.t.volatility - 0.2) * (1 - profile.riskTolerance) * 10;
    const score = c.b.grade * posW - riskPenalty;
    return { ...c, score, i };
  });
  temp.sort((a, b) => b.score - a.score);

  const pickIndex = Math.floor(unit(args.seed, "cpu:pick", args.draft.currentPickIndex, args.teamId) * Math.min(4, temp.length));
  const chosen = temp[pickIndex] ?? temp[0];

  const note = `Selected ${String(chosen.r.Name ?? "")} (${String(chosen.r.POS ?? "")}) based on board grade and team model.`;
  return { playerId: chosen.id, note };
}

export function userAutoPick(args: {
  reg: TableRegistry;
  draft: DraftState;
  franchiseTeamId: string;
  seed: number;
}): { playerId: string; note: string } {
  const belief = args.draft.beliefByTeam[args.franchiseTeamId] ?? {};
  const classRows = args.reg.getTable("2026 Draft Class") as any[];
  const byId: Record<string, any> = {};
  for (const r of classRows) byId[`p:${String(r["Player ID"])}`] = r;

  const avail = args.draft.available.filter((id) => !args.draft.user.noPick[id]);
  const list = avail
    .map((id) => ({ id, r: byId[id], b: belief[id] }))
    .filter((x) => x.r && x.b)
    .sort((a, b) => (b.b.grade - a.b.grade) || a.id.localeCompare(b.id));

  const top = list.slice(0, 8);
  const pickIndex = Math.floor(unit(args.seed, "user:auto", args.draft.currentPickIndex) * Math.min(3, top.length));
  const chosen = top[pickIndex] ?? list[0];

  return { playerId: chosen.id, note: "Auto-pick used your board posture (estimated grade + limited randomness)." };
}

export function applyPick(args: {
  reg: TableRegistry;
  draft: DraftState;
  pickNo: number;
  teamId: string;
  playerId: string;
  note?: string;
}): DraftState {
  const nextAvail = args.draft.available.filter((id) => id !== args.playerId);
    const meta = prospectMeta(args.reg, args.playerId);
  const results = { ...args.draft.results, [args.pickNo]: { pickNo: args.pickNo, teamId: args.teamId, playerId: args.playerId, pos: meta?.pos ?? "UNK", note: args.note } };
  return { ...args.draft, available: nextAvail, results };
}

export function prospectMeta(reg: TableRegistry, playerId: string): { name: string; pos: string; tier: string; rank: number; college: string } | null {
  const classRows = reg.getTable("2026 Draft Class") as any[];
  const idNum = String(playerId).replace(/^p:/, "");
  const r = classRows.find((x) => String(x["Player ID"]) === idNum);
  if (!r) return null;
  return { name: String(r.Name ?? ""), pos: String(r.POS ?? ""), tier: String(r.DraftTier ?? ""), rank: Number(r.Rank ?? 999), college: String(r.College ?? "") };
}
