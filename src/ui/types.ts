import type { ReactNode } from "react";
import type { GameState } from "@/engine/gameState";
import type { Route } from "@/ui/routes";

export type SaveData = {
  version: 1;
  gameState: GameState;
};

export type InterviewInviteTier = "REBUILD" | "FRINGE" | "CONTENDER";

export type InterviewInvite = {
  franchiseId: string;
  tier: InterviewInviteTier;
  overall: number;
  summaryLine: string;
};

export type ModalState = {
  title: string;
  message: ReactNode;
  lines?: string[];
  warning?: string;
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
      hometownId: string;
      hometownLabel: string;
      hometownTeamKey: string;
      interviewNotes: string[];
      offers: InterviewInvite[];
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
