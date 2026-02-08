import type { GameState } from "@/engine/gameState";
import type { Route } from "@/ui/routes";

export type SaveData = {
  version: 1;
  gameState: GameState;
};

export type ModalState = {
  title: string;
  message: string;
  actions?: Array<{ label: string; action: UIAction }>;
};

export type UIState = {
  route: Route;
  save: SaveData | null;
  draftFranchiseId: string | null;
  corruptedSave: boolean;
  ui: {
    activeModal: ModalState | null;
    notifications: string[];
    opening: {
      coachName: string;
      background: string;
      interviewNotes: string[];
      offers: string[];
      coordinatorChoices: Partial<Record<"OC" | "DC" | "STC", string>>;
    };
  };
};

export type UIAction = { type: string; [key: string]: unknown };

export type UIController = {
  getState: () => UIState;
  dispatch: (action: UIAction) => void;
  selectors: {
    routeLabel: () => string;
  };
};

export type ScreenProps = { ui: UIController };
