import type { Route } from "@/ui/routes";
import type { StaffRole } from "@/services/staff";

export type StaffTreeView = {
  byTeam: Record<string, { HC?: { name: string } | null; OC?: { name: string } | null; DC?: { name: string } | null; QB?: { name: string } | null; ASST?: { name: string } | null }>;
};

export type UIState = { route: Route };

export type UIAction =
  | { type: "BACK" }
  | { type: "OPEN_STAFF_TREE" }
  | { type: "OPEN_HIRE_MARKET"; role: StaffRole }
  | { type: "OPEN_TEAM_ROSTER"; teamId: string }
  | { type: "OPEN_CONTRACTS"; teamId: string }
  | { type: "ADVANCE_WEEK" };

export type UIController = {
  getState: () => UIState;
  dispatch: (action: UIAction) => void;
  selectors: {
    table: (name: string) => Array<Record<string, unknown>>;
    franchiseTeamId: () => string;
    teams: () => string[];
    staffTree: () => StaffTreeView;
  };
};

export type ScreenProps = { ui: UIController };
