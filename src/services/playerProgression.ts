import type { TableRegistry } from "@/data/TableRegistry";
import type { StaffState } from "@/services/staff";
import { computeTeamStaffEffects } from "@/services/staffEffects";

export type PlayerDevState = { xp: number };

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

// Deterministic hash -> 0..1
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned
  return (h >>> 0) / 4294967295;
}

export function workEthic01(playerId: string): number {
  // Bias toward average; 0.25..0.95
  const u = hash01(`we:${playerId}`);
  const shaped = Math.pow(u, 0.65);
  return clamp(0.25 + shaped * 0.70, 0.25, 0.95);
}

export function volatility01(playerId: string): number {
  // 0.10..0.90
  const u = hash01(`vol:${playerId}`);
  return clamp(0.10 + u * 0.80, 0.10, 0.90);
}

function posGroup(posRaw: string): "QB" | "WR/RB" | "OL" | "DL" | "LB" | "DB" | null {
  const pos = String(posRaw ?? "").toUpperCase();
  if (pos === "QB") return "QB";
  if (pos === "WR" || pos === "RB") return "WR/RB";
  if (pos === "OT" || pos === "OG" || pos === "G" || pos === "T" || pos === "C") return "OL";
  if (pos === "DT" || pos === "DI" || pos === "DL" || pos === "DE" || pos === "EDGE") return "DL";
  if (pos === "LB" || pos === "MLB" || pos === "ILB" || pos === "OLB") return "LB";
  if (pos === "CB" || pos === "DB" || pos === "S" || pos === "FS" || pos === "SS") return "DB";
  return null;
}

export function derivedOverall(baseOvr: number, dev: PlayerDevState | undefined): number {
  const xp = dev?.xp ?? 0;
  // xp is hidden; map to smooth +/- range around base (no "upgrade points" feel).
  // At xp=0 => 0. Each ~25 xp ~ +1 OVR. Cap +/- 8.
  const delta = clamp(Math.round(xp / 25), -8, 8);
  return clamp(Math.round(baseOvr + delta), 40, 99);
}

export function applyWeeklyDevelopment(
  reg: TableRegistry,
  save: any,
  staff: StaffState | undefined
): any {
  const week = Number(save.week ?? 1);
  const devState: Record<string, PlayerDevState> = { ...(save.playerDevState ?? {}) };

  const roster = reg.getTable("Roster") as any[];
  const adds = (save.rosterAdditions ?? []) as any[];
  const allRows = [...roster, ...adds];

  // Simple on-field performance proxy (until sim exists):
  // - Team staff offense/defense bonuses represent structural quality
  // - Position coaches drive development speed
  // - Work ethic modulates consistency
  // - Volatility gives some noisy weeks (deterministic by week+player)
  const teams = [...new Set(allRows.map((r) => String((r as any).Team ?? "").trim()).filter(Boolean))];

  for (const teamId of teams) {
    const fx = computeTeamStaffEffects(staff, teamId);
    const perfProxy = clamp((fx.offenseBonus + fx.defenseBonus) / 20, -0.4, 0.4); // -0.4..0.4
    const rows = allRows.filter((r) => String((r as any).Team ?? "").trim() === teamId);

    for (const r of rows) {
      const pid = String((r as any)["Player ID"] ?? "").trim();
      if (!pid) continue;

      const baseOvr = Number((r as any).OVR ?? (r as any).Overall ?? 70);
      const group = posGroup((r as any).POS ?? (r as any).Pos ?? "");
      const coachDev = group ? Number(fx.devByPos?.[group] ?? 0) : 0; // 0..3

      const we = workEthic01(pid); // 0.25..0.95
      const vol = volatility01(pid); // 0.10..0.90
      const noise = (hash01(`wk:${week}:${pid}`) - 0.5) * 2; // -1..1 deterministic
      const weekSwing = noise * vol * 0.35; // bounded

      // Growth rate: higher for younger/low OVR (proxy). We don't have age reliably in tables; approximate from base OVR.
      const youthFactor = clamp((75 - baseOvr) / 30, 0.0, 1.0); // low OVR -> more room
      const coachFactor = 0.35 + coachDev * 0.25; // 0.35..1.10
      const perfFactor = 1.0 + perfProxy + weekSwing; // ~0.25..1.75 bounded by clamp later
      const ethicFactor = 0.65 + we * 0.60; // 0.80..1.22

      // XP delta per week (hidden)
      const xpDelta = clamp(1.0 + 3.0 * youthFactor, 1.0, 4.0) * coachFactor * perfFactor * ethicFactor;

      const cur = devState[pid] ?? { xp: 0 };
      // mild regression if no coaching support and perf bad
      const regress = coachDev === 0 && perfFactor < 0.85 ? -0.5 : 0;
      devState[pid] = { xp: clamp(cur.xp + xpDelta + regress, -150, 250) };
    }
  }

  return { ...save, playerDevState: devState };
}
