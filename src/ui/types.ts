import type { Route } from "@/ui/routes";

export type ScreenProps = {
  ui: UIController;
};

export type UIState = {
  route: Route;
};

export type UIController = {
  getState: () => UIState;
  dispatch: (action: { type: string; [key: string]: unknown }) => void;
  selectors: {
    franchiseTeamId: () => string;
    table: (name: string) => Array<Record<string, unknown>>;
    teams: () => string[];
    staffTree: () => { byTeam: Record<string, Record<string, { name: string } | null>> };
  };
};
