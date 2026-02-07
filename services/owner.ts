import type { TableRegistry } from "@/data/TableRegistry";

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function getOwnerConfidence(save: any, teamId: string, fallback = 70): number {
  const map = (save.ownerConfidence ?? {}) as Record<string, number>;
  const v = map[teamId];
  return Number.isFinite(v) ? clamp(v, 0, 100) : fallback;
}

export function setOwnerConfidence(save: any, teamId: string, value: number): any {
  const next = { ...(save.ownerConfidence ?? {}) };
  next[teamId] = clamp(value, 0, 100);
  return { ...save, ownerConfidence: next };
}

export function updateOwnerConfidenceWeekly(reg: TableRegistry, save: any, teamId: string): any {
  const cur = getOwnerConfidence(save, teamId, 70);

  // Cap stress: negative cap space reduces confidence quickly.
  const teamRow = (reg.getTable("Team Summary") as any[]).find((r) => String(r.Team ?? "").trim() === teamId);
  const baseCapSpace = toNum(teamRow?.["Cap Space"] ?? 0);
  const adj = (save.capAdjustments ?? {})[teamId] ?? { capHitsDelta: 0, deadCapDelta: 0 };
  const capSpace = baseCapSpace - toNum(adj.capHitsDelta);

  let delta = 0;
  if (capSpace < 0) {
    // -1 per $5M over, capped at -8 per week
    delta -= clamp(Math.ceil(Math.abs(capSpace) / 5_000_000), 1, 8);
  } else if (capSpace > 20_000_000) {
    delta += 1; // mild relief if healthy cap
  }

  // Staff budget: if negative or very low, owner gets annoyed.
  const staffBudgetM = toNum(save.staffBudgetM ?? 0);
  if (staffBudgetM < 0) delta -= 3;
  else if (staffBudgetM < 2) delta -= 1;

  // Draft bump: if draft grades exist, apply small lasting effect in draft week only.
  const wk = toNum(save.week ?? 1);
  if (wk <= 2) {
    const grade = (save.draft?.classGrades ?? {})[teamId];
    const score = toNum(grade?.score ?? 0);
    if (score > 80) delta += 2;
    if (score < 55 && score > 0) delta -= 2;
  }

  return setOwnerConfidence(save, teamId, cur + delta);
}
