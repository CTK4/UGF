import draftClassRaw from "@/data/generated/draftClass.json";
import type { GameState } from "@/engine/gameState";

export type ScoutingAction = { positions: string[] };

type DraftProspectRow = { "Player ID"?: string | number; Name?: string; POS?: string; College?: string; Rank?: number };
type RosterRow = { Team?: string; PositionGroup?: string; Rating?: number };

const draftRows = draftClassRaw as DraftProspectRow[];

function normalizeKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function toProspectId(row: DraftProspectRow): string {
  return String(row["Player ID"] ?? "").trim();
}

function buildNote(level: 1 | 2 | 3, row: DraftProspectRow): string {
  const name = String(row.Name ?? "Unknown Prospect");
  const pos = String(row.POS ?? "ATH");
  if (level === 1) return `${name} (${pos}): baseline traits and measurables logged.`;
  if (level === 2) return `${name} (${pos}): scheme fit notes added after tape review.`;
  return `${name} (${pos}): cross-check complete with final projection confidence.`;
}

export function getScoutablePositions(): string[] {
  return [...new Set(draftRows.map((row) => String(row.POS ?? "").trim()).filter(Boolean))].sort();
}

export function getSuggestedNeed(state: GameState): string | null {
  const teamKeys = new Set([normalizeKey(state.franchise.excelTeamKey), normalizeKey(state.franchise.ugfTeamKey)].filter(Boolean));
  if (!teamKeys.size) return null;
  const byGroup = new Map<string, { total: number; count: number }>();

  const rosterRows: RosterRow[] = Object.values(state.league.playersById).map((player) => ({
    Team: player.teamKey,
    PositionGroup: player.positionGroup || player.pos,
    Rating: player.overall,
  }));

  for (const row of rosterRows) {
    const team = normalizeKey(String(row.Team ?? ""));
    const group = String(row.PositionGroup ?? "").trim();
    if (!group || !teamKeys.has(team)) continue;
    const current = byGroup.get(group) ?? { total: 0, count: 0 };
    byGroup.set(group, { total: current.total + Number(row.Rating ?? 0), count: current.count + 1 });
  }

  const ranked = [...byGroup.entries()].map(([group, data]) => ({ group, avg: data.total / Math.max(1, data.count) })).sort((a, b) => a.avg - b.avg);
  return ranked[0]?.group ?? null;
}

export function applyScoutingAction(state: GameState, action: ScoutingAction): GameState {
  if (action.positions.length !== 1) {
    return { ...state, lastUiError: "Select exactly one position to complete scouting." };
  }

  const selectedPosition = action.positions[0];
  const discovered = { ...state.draft.discovered };
  const candidates = draftRows
    .map((row, idx) => ({ row, idx, id: toProspectId(row), pos: String(row.POS ?? "").trim() }))
    .filter((item) => item.id && item.pos === selectedPosition)
    .map((item) => {
      const level = discovered[item.id]?.level ?? 0;
      const rank = Number(item.row.Rank ?? 999);
      const score = level * 10_000 + (Number.isFinite(rank) ? rank : 999) + item.idx;
      return { ...item, level, score };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  let watchlist = [...state.draft.watchlist];
  for (const candidate of candidates) {
    const prior = discovered[candidate.id];
    const nextLevel = Math.min(3, (prior?.level ?? 0) + 1) as 1 | 2 | 3;
    const notes = [...(prior?.notes ?? []), buildNote(nextLevel, candidate.row)];
    discovered[candidate.id] = { level: nextLevel, notes };
    if (nextLevel >= 2 && !watchlist.includes(candidate.id)) {
      watchlist = [...watchlist, candidate.id];
    }
  }

  return { ...state, draft: { discovered, watchlist }, lastUiError: null };
}
