import type { TableRegistry } from "@/data/TableRegistry";
import type { DraftState } from "@/ui/types";

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function letterFromScore(score: number): string {
  if (score >= 120) return "A+";
  if (score >= 90) return "A";
  if (score >= 60) return "A-";
  if (score >= 35) return "B+";
  if (score >= 15) return "B";
  if (score >= -5) return "B-";
  if (score >= -25) return "C+";
  if (score >= -45) return "C";
  if (score >= -65) return "C-";
  if (score >= -90) return "D";
  return "F";
}

export function computeDraftClassGrades(reg: TableRegistry, draft: DraftState): Record<string, { score: number; letter: string; summary: string }> {
  const dc = reg.getTable("2026 Draft Class") as any[];
  const byId = new Map<string, any>();
  for (const r of dc) byId.set(String(r["Player ID"] ?? "").trim(), r);

  const teamScores = new Map<string, number>();
  const teamNotes = new Map<string, Array<string>>();

  for (const p of Object.values(draft.results) as any[]) {
    const team = p.teamId;
    const row = byId.get(String(p.playerId ?? "").trim());
    const publicRank = toNum(row?.Rank ?? 999);
    const pickNo = toNum(p.pickNo);
    // Positive score for "steals" (rank better than slot), negative for reaches.
    const delta = (pickNo - publicRank);
    const contrib = Math.max(-25, Math.min(25, delta)); // clamp per pick for stability
    teamScores.set(team, (teamScores.get(team) ?? 0) + contrib);

    const name = String(row?.Name ?? p.playerId);
    const pos = String(row?.POS ?? "UNK");
    const tag = contrib >= 10 ? "STEAL" : contrib <= -10 ? "REACH" : "OK";
    const note = `${tag}: #${pickNo} ${name} (${pos})`;
    const arr = teamNotes.get(team) ?? [];
    arr.push(note);
    teamNotes.set(team, arr);
  }

  const out: Record<string, { score: number; letter: string; summary: string }> = {};
  for (const [team, score] of teamScores.entries()) {
    const letter = letterFromScore(score);
    const notes = (teamNotes.get(team) ?? []).slice(0, 3).join(" • ");
    out[team] = { score, letter, summary: notes || "No picks logged." };
  }
  return out;
}
