import type { Route } from "@/ui/routes";

export type StaffRole = "hc" | "oc" | "dc" | "qb" | "asst";
export type LeaguePhase = "Preseason" | "RegularSeason";

export type Candidate = {
  id: string;
  name: string;
  role: StaffRole;
  traits: string[];
  philosophy: string;
  availability: "AVAILABLE" | "ALREADY_EMPLOYED" | "INELIGIBLE";
};

export type PhoneMessage = { id: string; from: string; text: string; ts: string };
export type PhoneThread = { id: string; title: string; unreadCount: number; messages: PhoneMessage[] };

export type SaveData = {
  version: 1;
  createdAt: string;
  franchiseId: string;
  league: { season: number; week: number; phase: LeaguePhase; phaseVersion: number };
  staff: Record<StaffRole, string | null>;
  phone: { threads: PhoneThread[] };
  market: { byWeek: Record<string, { weekKey: string; role: StaffRole; candidates: Candidate[] }> };
  checkpoints: Array<{ ts: string; label: string; snapshotRef?: string }>;
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
  ui: { activeModal: ModalState | null; notifications: string[] };
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
