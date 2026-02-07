import { loadDataBundle } from "@/bundle/loadBundle";
import type { UIAction, UIController, UIState } from "@/ui/types";

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const data = await loadDataBundle();
  const teamRows = data.tables["Team Summary"]?.rows ?? [];
  const teams = Array.from(
    new Set(teamRows.map((r) => String((r as Record<string, unknown>).Team ?? "").trim()).filter(Boolean)),
  );
  const franchiseTeamId = teams[0] ?? "HOU";

  let state: UIState = { route: { key: "TeamSummary", teamId: franchiseTeamId } };

  const controller: UIController = {
    getState: () => state,
    dispatch: (action: UIAction) => {
      if (action.type === "BACK") state = { ...state, route: { key: "TeamSummary", teamId: franchiseTeamId } };
      if (action.type === "OPEN_STAFF_TREE") state = { ...state, route: { key: "StaffTree" } };
      onChange();
    },
    selectors: {
      table: (name: string) => data.tables[name]?.rows ?? [],
      franchiseTeamId: () => franchiseTeamId,
      teams: () => teams,
      staffTree: () => ({ byTeam: Object.fromEntries(teams.map((t) => [t, { HC: null, OC: null, DC: null, QB: null, ASST: null }])) }),
    },
  };

  return controller;
}
