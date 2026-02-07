import type { TableRegistry } from "@/data/TableRegistry";
import type { StaffState } from "@/services/staff";
import { computeTeamStaffEffects } from "@/services/staffEffects";

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

function normalish(seed: string): number {
  // -1..1 deterministic approx normal
  const a = hash01(`${seed}:a`);
  const b = hash01(`${seed}:b`);
  const c = hash01(`${seed}:c`);
  const z = (a + b + c) / 3;
  return (z - 0.5) * 2;
}

function posGroup(posRaw: string): "QB" | "WR/RB" | "OL" | "DL" | "LB" | "DB" | "GEN" {
  const pos = String(posRaw ?? "").toUpperCase();
  if (pos === "QB") return "QB";
  if (pos === "WR" || pos === "RB" || pos === "TE") return "WR/RB";
  if (pos === "OT" || pos === "OG" || pos === "G" || pos === "T" || pos === "C") return "OL";
  if (pos === "DT" || pos === "DI" || pos === "DL" || pos === "DE" || pos === "EDGE") return "DL";
  if (pos === "LB" || pos === "MLB" || pos === "ILB" || pos === "OLB") return "LB";
  if (pos === "CB" || pos === "DB" || pos === "S" || pos === "FS" || pos === "SS") return "DB";
  return "GEN";
}

function scoutQuality01(staff: StaffState | undefined, teamId: string, group: string): number {
  const fx = computeTeamStaffEffects(staff, teamId);
  const dev =
    group === "QB" ? fx.devByPos?.QB ?? 0 :
    group === "WR/RB" ? fx.devByPos?.["WR/RB"] ?? 0 :
    group === "OL" ? fx.devByPos?.OL ?? 0 :
    group === "DL" ? fx.devByPos?.DL ?? 0 :
    group === "LB" ? fx.devByPos?.LB ?? 0 :
    group === "DB" ? fx.devByPos?.DB ?? 0 :
    1;

  // dev 0..3 => 0.35..0.75 base skill
  return clamp(0.35 + dev * 0.13, 0.25, 0.85);
}

export function ensureScoutingReport(
  save: any,
  teamId: string,
  playerId: string,
  trueTalent: number,
  posGroupKey: string,
  staff: StaffState | undefined
): any {
  const scouting = save.scouting ?? { reportsByTeam: {} };
  const reportsByTeam = { ...(scouting.reportsByTeam ?? {}) };
  const teamReports = { ...(reportsByTeam[teamId] ?? {}) };

  if (teamReports[playerId]) return { ...save, scouting: { reportsByTeam } };

  // Initial sigma depends on scout quality
  const q = scoutQuality01(staff, teamId, posGroupKey); // higher => tighter
  const sigma0 = clamp(18 - q * 12, 6, 16); // 6..16

  // Initial estimate is noisy but centered on truth.
  const noise = normalish(`scout:init:${teamId}:${playerId}`) * sigma0;
  const est0 = clamp(Math.round(trueTalent + noise), 40, 99);

  teamReports[playerId] = { est: est0, sigma: sigma0, seenWeeks: 0 };
  reportsByTeam[teamId] = teamReports;

  return { ...save, scouting: { reportsByTeam } };
}

export function updateWeeklyScouting(reg: TableRegistry, save: any, teamId: string, staff: StaffState | undefined): any {
  const roster = reg.getTable("Roster") as any[];
  const adds = (save.rosterAdditions ?? []) as any[];
  const allRows = [...roster, ...adds].filter((r) => String((r as any).Team ?? "").trim() === teamId);

  const talent = (save.playerTalent ?? {}) as Record<string, number>;
  let next = save;

  for (const r of allRows) {
    const pid = String((r as any)["Player ID"] ?? "").trim();
    if (!pid) continue;

    const trueTalent = Number(talent[pid] ?? 70);
    const group = posGroup((r as any).POS ?? (r as any).Pos ?? "");
    next = ensureScoutingReport(next, teamId, pid, trueTalent, group, staff);

    const rep = (((next.scouting ?? {}).reportsByTeam ?? {})[teamId] ?? {}) as any;
    const cur = rep[pid];
    if (!cur) continue;

    const q = scoutQuality01(staff, teamId, group);
    // sigma shrinks with exposure; better staff => faster shrink; floor at 3.
    const shrink = clamp(0.6 + q * 0.7, 0.7, 1.2); // 0.7..1.2 points per week
    const sigma = clamp(cur.sigma - shrink, 3, 20);

    // est nudges toward truth slowly as sigma shrinks (deterministic step)
    const pull = clamp((cur.est - trueTalent) * 0.12, -2.0, 2.0);
    const est = clamp(Math.round(cur.est - pull), 40, 99);

    rep[pid] = { est, sigma, seenWeeks: (cur.seenWeeks ?? 0) + 1 };
    ((next.scouting ?? {}).reportsByTeam ?? {})[teamId] = rep;
  }

  return next;
}

export function getScoutedTalent(save: any, teamId: string, playerId: string, fallback: number): { est: number; sigma: number; confidence: number } {
  const rep = (((save.scouting ?? {}).reportsByTeam ?? {})[teamId] ?? {})[playerId];
  if (!rep) return { est: fallback, sigma: 18, confidence: 0.0 };
  const sigma = Number(rep.sigma ?? 18);
  const confidence = clamp(1 - sigma / 18, 0, 1);
  return { est: Number(rep.est ?? fallback), sigma, confidence };
}

export function investScout(save: any, teamId: string, playerId: string, sigmaDrop = 3): any {
  const scouting = save.scouting ?? { reportsByTeam: {} };
  const reportsByTeam = { ...(scouting.reportsByTeam ?? {}) };
  const teamReports = { ...(reportsByTeam[teamId] ?? {}) };
  const rep = teamReports[playerId];
  if (!rep) return save;

  const sigma = clamp(Number(rep.sigma ?? 18) - sigmaDrop, 2, 20);
  const est = clamp(Number(rep.est ?? 70), 40, 99);
  teamReports[playerId] = { ...rep, sigma, est, seenWeeks: (rep.seenWeeks ?? 0) + 1 };
  reportsByTeam[teamId] = teamReports;
  return { ...save, scouting: { reportsByTeam } };
}
