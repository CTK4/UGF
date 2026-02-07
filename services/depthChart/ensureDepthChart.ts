import type { SaveState } from "@/ui/types";
import type { TableRegistry } from "@/data/TableRegistry";
import type { DepthChart } from "./types";
import { autoDepthChart } from "./autoDepthChart";

/**
 * Ensures save.depthCharts[teamId] exists and is internally consistent.
 * - Removes assignments to players no longer on the team
 * - Removes assignments to players marked inactive
 * - Fills missing slots via deterministic autoDepthChart
 */
export function ensureDepthChart(reg: TableRegistry, save: SaveState, teamId: string): SaveState {
  const depthCharts: Record<string, DepthChart> = { ...(save.depthCharts ?? {}) } as any;

  const inactive = new Set(((save as any).inactivesByTeam?.[teamId] ?? []) as string[]);
  const roster = reg.getTable("Roster");
  const teamRoster = roster.filter((r: any) => String(r.Team ?? r.teamId ?? r["Team ID"] ?? "") === teamId);
  const onTeam = new Set(teamRoster.map((r: any) => String(r["Player ID"] ?? r.playerId ?? r.id ?? "")));

  const existing = depthCharts[teamId];
  if (existing?.slots) {
    const nextSlots: any = { ...(existing.slots as any) };
    let changed = false;
    for (const [slot, pid] of Object.entries(nextSlots)) {
      const id = String(pid);
      if (!id || inactive.has(id) || !onTeam.has(id)) {
        delete nextSlots[slot];
        changed = true;
      }
    }
    if (changed) depthCharts[teamId] = { ...existing, slots: nextSlots };
  }

  const built = autoDepthChart(reg, { ...save, depthCharts } as any, teamId);
  // autoDepthChart already honors inactivesByTeam via our patch.
  depthCharts[teamId] = built;

  return { ...save, depthCharts } as any;
}
