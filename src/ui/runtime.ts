import type { UIController, UIState } from "@/ui/types";

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const state: UIState = { route: { key: "TeamSummary", teamId: "HOU" } };

  const teamRows = [
    { Team: "HOU", Wins: 9, Losses: 8, OVR: 78, Offense: 77, Defense: 79, SpecialTeams: 74 },
    { Team: "DAL", Wins: 11, Losses: 6, OVR: 82, Offense: 84, Defense: 81, SpecialTeams: 76 },
  ];

  const ui: UIController = {
    getState: () => state,
    dispatch: (action) => {
      if (action.type === "OPEN_STAFF_TREE") state.route = { key: "StaffTree" };
      if (action.type === "BACK") state.route = { key: "TeamSummary", teamId: "HOU" };
      onChange();
    },
    selectors: {
      franchiseTeamId: () => "HOU",
      table: (name) => (name === "Team Summary" ? teamRows : []),
      teams: () => ["HOU", "DAL"],
      staffTree: () => ({
        byTeam: {
          HOU: { HC: { name: "Alex Romero" }, OC: null, DC: { name: "Nolan Price" }, QB: null, ASST: null },
          DAL: { HC: { name: "Sam Rourke" }, OC: { name: "Brian Walsh" }, DC: { name: "Devon Lake" }, QB: null, ASST: null },
        },
      }),
    },
  };

  return ui;
}
