import draftClass from "@/data/generated/draftClass.json";
import type { ProspectDiscovery, Task } from "@/engine/gameState";

type DraftState = {
  discovered: Record<string, ProspectDiscovery>;
  watchlist: string[];
};

type DraftProspectRow = {
  [key: string]: unknown;
  "Player ID"?: string | number;
  Name?: string;
  POS?: string;
  College?: string;
  Rank?: number;
};

const LEVEL_BLURBS = [
  "Initial measurables and baseline athletic profile logged.",
  "Tape check complete with schematic fit notes from regional scouts.",
  "Cross-check complete with leadership and projection confidence update.",
];

function toProspectId(row: DraftProspectRow): string {
  return String(row["Player ID"] ?? "").trim();
}

function toName(row: DraftProspectRow): string {
  return String(row.Name ?? "Unknown Prospect");
}

function toPos(row: DraftProspectRow): string {
  return String(row.POS ?? "ATH");
}

function toCollege(row: DraftProspectRow): string {
  return String(row.College ?? "Unknown");
}

function toRank(row: DraftProspectRow): number {
  const rank = Number(row.Rank ?? 999);
  return Number.isFinite(rank) ? rank : 999;
}

function addToWatchlist(ids: string[], id: string): string[] {
  if (ids.includes(id)) return ids;
  return [...ids, id];
}

function buildScoutReport(week: number, row: DraftProspectRow, level: 1 | 2 | 3): string {
  const rank = toRank(row);
  const rankLabel = Number.isFinite(rank) ? `Rank ${rank}` : "Late-board";
  const blurb = LEVEL_BLURBS[level - 1] ?? LEVEL_BLURBS[0];
  return `Scouting report (W${week}): ${toName(row)} (${toPos(row)}, ${toCollege(row)}, ${rankLabel}). ${blurb}`;
}

function chooseProspects(week: number, discovered: Record<string, ProspectDiscovery>): DraftProspectRow[] {
  const rows = (draftClass as DraftProspectRow[]).filter((row) => toProspectId(row));
  const ranked = rows
    .map((row, idx) => {
      const id = toProspectId(row);
      const existing = discovered[id];
      const level = existing?.level ?? 0;
      const unseenBucket = level === 0 ? 0 : 1;
      const deterministic = (week * 131 + (idx + 1) * 47 + toRank(row) * 11) % 1009;
      return { row, level, unseenBucket, deterministic, rank: toRank(row) };
    })
    .sort((a, b) =>
      a.unseenBucket - b.unseenBucket ||
      a.level - b.level ||
      a.rank - b.rank ||
      a.deterministic - b.deterministic,
    )
    .slice(0, 3)
    .map((it) => it.row);

  return ranked;
}

function isScoutTask(task: Task): boolean {
  return task.title.toLowerCase().includes("scout 3 prospects");
}

export function applyScoutTaskCompletion(week: number, draft: DraftState, task: Task): DraftState {
  if (!isScoutTask(task)) return draft;

  const discovered = { ...draft.discovered };
  let watchlist = [...draft.watchlist];
  const picks = chooseProspects(week, discovered);

  for (const row of picks) {
    const id = toProspectId(row);
    if (!id) continue;
    const prior = discovered[id];
    const nextLevel = Math.min(3, (prior?.level ?? 0) + 1) as 1 | 2 | 3;
    discovered[id] = {
      level: nextLevel,
      notes: buildScoutReport(week, row, nextLevel),
    };
    watchlist = addToWatchlist(watchlist, id);
  }

  return { discovered, watchlist };
}

export function getProspectLabel(prospectId: string): string {
  const row = (draftClass as DraftProspectRow[]).find((item) => toProspectId(item) === prospectId);
  if (!row) return prospectId;
  return `${toName(row)} (${toPos(row)} • ${toCollege(row)})`;
}
