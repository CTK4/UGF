import type { TableRegistry } from "@/data/TableRegistry";
import type { StaffState } from "@/services/staff";
import { computeTeamStaffEffects } from "@/services/staffEffects";

const CONSISTENCY_WEIGHT = 0.65;
const VOLATILITY_WEIGHT = 0.35;

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function gaussianLike01(s: string): number {
  // Deterministic "rough normal" in 0..1 by averaging 3 uniforms
  const a = hash01(`${s}:a`);
  const b = hash01(`${s}:b`);
  const c = hash01(`${s}:c`);
  return (a + b + c) / 3;
}

export function getOrInitTalent(save: any, playerId: string, baseOvrGuess = 70): any {
  const map = { ...(save.playerTalent ?? {}) } as Record<string, number>;
  if (Number.isFinite(map[playerId])) return save;

  // Talent is hidden. Anchor around baseOvrGuess with deterministic spread, cap 45..98.
  const u = gaussianLike01(`tal:${playerId}`);
  const spread = (u - 0.5) * 24; // ~-12..+12
  const talent = clamp(Math.round(baseOvrGuess + spread), 45, 98);
  map[playerId] = talent;
  return { ...save, playerTalent: map };
}

type PosGroup = "QB" | "WR" | "RB" | "OL" | "DL" | "LB" | "DB" | "TE" | "K" | "UNK";

function posGroup(posRaw: string): PosGroup {
  const pos = String(posRaw ?? "").toUpperCase();
  if (pos === "QB") return "QB";
  if (pos === "WR") return "WR";
  if (pos === "RB") return "RB";
  if (pos === "TE") return "TE";
  if (pos === "OT" || pos === "OG" || pos === "G" || pos === "T" || pos === "C") return "OL";
  if (pos === "DT" || pos === "DI" || pos === "DL" || pos === "DE" || pos === "EDGE") return "DL";
  if (pos === "LB" || pos === "MLB" || pos === "ILB" || pos === "OLB") return "LB";
  if (pos === "CB" || pos === "DB" || pos === "S" || pos === "FS" || pos === "SS") return "DB";
  if (pos === "K" || pos === "P" || pos === "LS") return "K";
  return "UNK";
}

function coachMultiplier(staff: StaffState | undefined, teamId: string, g: PosGroup): number {
  const fx = computeTeamStaffEffects(staff, teamId);
  const dev = (() => {
    if (g === "QB") return fx.devByPos?.QB ?? 0;
    if (g === "WR" || g === "RB" || g === "TE") return fx.devByPos?.["WR/RB"] ?? 0;
    if (g === "OL") return fx.devByPos?.OL ?? 0;
    if (g === "DL") return fx.devByPos?.DL ?? 0;
    if (g === "LB") return fx.devByPos?.LB ?? 0;
    if (g === "DB") return fx.devByPos?.DB ?? 0;
    return 0;
  })();

  // dev 0..3 => 0.95..1.08 (tight band)
  return clamp(0.95 + dev * 0.045, 0.90, 1.10);
}

function teamPerformanceProxy(staff: StaffState | undefined, teamId: string): number {
  const fx = computeTeamStaffEffects(staff, teamId);
  // -0.35..+0.35
  return clamp((fx.offenseBonus + fx.defenseBonus) / 20, -0.35, 0.35);
}

function snapsForGroup(g: PosGroup): number {
  // rough distribution so "confidence" can be derived later
  switch (g) {
    case "QB":
      return 62;
    case "WR":
    case "RB":
    case "TE":
      return 38;
    case "OL":
      return 65;
    case "DL":
      return 44;
    case "LB":
      return 40;
    case "DB":
      return 45;
    default:
      return 20;
  }
}

function gradeFromTalentWeek(talent: number, perfProxy: number, coachMul: number, weekSeed: string): number {
  // PFF-style: bounded 35..95; centered near ~60-80 for starters depending on talent
  const base = clamp(52 + (talent - 60) * 0.75, 35, 90);
  const noise = (gaussianLike01(weekSeed) - 0.5) * 10; // -5..+5 typical
  const perf = perfProxy * 12; // -4..+4
  const coached = (coachMul - 1) * 12; // -1..+1.2
  return clamp(Math.round(base + noise + perf + coached), 35, 95);
}

export function simulateWeeklyPff(reg: TableRegistry, save: any, staff: StaffState | undefined): any {
  const week = Number(save.week ?? 1);

  const roster = reg.getTable("Roster") as any[];
  const adds = (save.rosterAdditions ?? []) as any[];
  const allRows = [...roster, ...adds];

  const playerPff: Record<string, { rolling: number; last: number; snaps: number }> = { ...(save.playerPff ?? {}) };
  let nextSave = save;

  const teamIds = [...new Set(allRows.map((r) => String((r as any).Team ?? "").trim()).filter(Boolean))];

  // Initialize + compute player week grades
  const perTeamAgg: Record<string, { off: number[]; def: number[]; pass: number[]; run: number[] }> = {};

  for (const teamId of teamIds) {
    perTeamAgg[teamId] = { off: [], def: [], pass: [], run: [] };
    const perfProxy = teamPerformanceProxy(staff, teamId);
    const rows = allRows.filter((r) => String((r as any).Team ?? "").trim() === teamId);

    for (const r of rows) {
      const pid = String((r as any)["Player ID"] ?? "").trim();
      if (!pid) continue;

      const baseOvrGuess = Number((r as any).OVR ?? (r as any).Overall ?? 70);
      nextSave = getOrInitTalent(nextSave, pid, baseOvrGuess);

      const talent = Number((nextSave.playerTalent ?? {})[pid] ?? baseOvrGuess);
      const g = posGroup((r as any).POS ?? (r as any).Pos ?? "");
      const coachMul = coachMultiplier(staff, teamId, g);

      const last = gradeFromTalentWeek(talent, perfProxy, coachMul, `pff:${week}:${pid}`);
      const prior = playerPff[pid]?.rolling ?? last;

      // EWMA: early weeks adapt faster
      const alpha = clamp(0.35 - (week - 1) * 0.02, 0.18, 0.35);
      const rolling = clamp(Math.round(prior * (1 - alpha) + last * alpha), 35, 95);

      const snaps = snapsForGroup(g);

      playerPff[pid] = { rolling, last, snaps };

      // Aggregate into units
      if (g === "QB" || g === "WR" || g === "RB" || g === "TE" || g === "OL") perTeamAgg[teamId].off.push(rolling);
      if (g === "DL" || g === "LB" || g === "DB") perTeamAgg[teamId].def.push(rolling);

      // pass/run split (simple mapping)
      if (g === "QB" || g === "WR" || g === "TE" || g === "OL" || g === "DB" || g === "DL") perTeamAgg[teamId].pass.push(rolling);
      if (g === "RB" || g === "OL" || g === "DL" || g === "LB") perTeamAgg[teamId].run.push(rolling);
    }
  }

  // Compute unit grades (team ratings drivers)
  const unitPff: Record<string, { offense: number; defense: number; pass: number; run: number }> = { ...(nextSave.unitPff ?? {}) };

  function avg(xs: number[]): number {
    if (!xs.length) return 60;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  }

  for (const teamId of teamIds) {
    const agg = perTeamAgg[teamId];
    unitPff[teamId] = {
      offense: Math.round(avg(agg.off)),
      defense: Math.round(avg(agg.def)),
      pass: Math.round(avg(agg.pass)),
      run: Math.round(avg(agg.run)),
    };
  }

  return { ...nextSave, playerPff, unitPff };
}

export function teamRatingsFromPff(save: any, teamId: string): { offense: number; defense: number; overall: number } {
  const u = (save.unitPff ?? {})[teamId] ?? { offense: 60, defense: 60, pass: 60, run: 60 };
  const offense = Number(u.offense ?? 60);
  const defense = Number(u.defense ?? 60);
  const overall = Math.round((offense + defense) / 2);
  return { offense, defense, overall };
}
