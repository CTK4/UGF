import type { TableRegistry } from "@/data/TableRegistry";
import type { DraftPickResult } from "@/ui/types";

type Beat = { kind: "RUN" | "STEAL" | "REACH" | "SLIDE"; text: string };

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function byId(reg: TableRegistry): Map<string, any> {
  const dc = reg.getTable("2026 Draft Class") as any[];
  const m = new Map<string, any>();
  for (const r of dc) m.set(String(r["Player ID"] ?? "").trim(), r);
  return m;
}

export function computeDraftBeats(reg: TableRegistry, results: DraftPickResult[], newPickNo: number): Beat[] {
  const idMap = byId(reg);
  const sorted = [...results].sort((a, b) => a.pickNo - b.pickNo);

  const p = sorted.find((x) => x.pickNo === newPickNo);
  if (!p) return [];

  const row = idMap.get(String(p.playerId).trim());
  const name = String(row?.Name ?? p.playerId);
  const pos = String(row?.POS ?? p.pos ?? "UNK");
  const rank = Number(row?.Rank ?? 999);
  const delta = p.pickNo - rank;

  const beats: Beat[] = [];

  if (delta >= 12) beats.push({ kind: "STEAL", text: `STEAL: ${p.teamId} lands ${name} (${pos}) at #${p.pickNo} (ranked ~${rank}).` });
  if (delta <= -12) beats.push({ kind: "REACH", text: `REACH: ${p.teamId} takes ${name} (${pos}) at #${p.pickNo} (ranked ~${rank}).` });

  // Run detection: last 6 picks, if >=3 same pos
  const window = sorted.filter((x) => x.pickNo <= p.pickNo).slice(-6);
  const counts = new Map<string, number>();
  for (const w of window) {
    const rw = idMap.get(String(w.playerId).trim());
    const pw = String(rw?.POS ?? w.pos ?? "UNK");
    counts.set(pw, (counts.get(pw) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 3) {
    beats.push({ kind: "RUN", text: `POS RUN: ${top[0]}s are flying off the board (${top[1]} of the last 6 picks).` });
  }

  // Slide detection: if a top-20 rank goes after pick 35, note slide
  if (rank <= 20 && p.pickNo >= 35) {
    beats.push({ kind: "SLIDE", text: `SLIDE: ${name} (${pos}) fell to #${p.pickNo} despite a top-${rank} grade on some boards.` });
  }

  // Deduplicate by kind
  const uniq = new Map<string, Beat>();
  for (const b of beats) uniq.set(b.kind, b);
  return [...uniq.values()];
}

export function applyNeedAdjustment(save: any, teamId: string, pos: string): any {
  const p = String(pos ?? "UNK").toUpperCase();
  const nextAll = { ...(save.teamNeedAdjustments ?? {}) };
  const cur = { ...(nextAll[teamId] ?? {}) };
  cur[p] = clamp((cur[p] ?? 0) - 1, -10, 10);
  nextAll[teamId] = cur;
  return { ...save, teamNeedAdjustments: nextAll };
}

export function addRight(save: any, teamId: string, playerId: string): any {
  const next = { ...(save.rightsOwned ?? {}) };
  const list = new Set(next[teamId] ?? []);
  list.add(String(playerId));
  next[teamId] = [...list];
  return { ...save, rightsOwned: next };
}
