import type { Route } from "@/ui/routes";
import type { StaffRole } from "@/domain/staffRoles";

export type LeaguePhase = "Preseason" | "RegularSeason";

export type Candidate = {
  id: string;
  name: string;
  primaryRole: StaffRole;
  targetRole: StaffRole;
  traits: string[];
  philosophy: string;
  availability: "FREE_AGENT" | "EMPLOYED" | "INELIGIBLE";
  fitLabel: "Natural Fit" | "Cross-Train" | "Out-of-Role";
  salaryDemand: number;
  recommendedOffer: number;
  contractYears: number;
  standardsNote: string;
  perceivedRisk: number;
  meetsStandards: boolean;
};

export type PhoneMessage = { id: string; from: string; text: string; ts: string };
export type PhoneThread = { id: string; title: string; unreadCount: number; messages: PhoneMessage[] };

export type SaveData = {
  version: 1;
  createdAt: string;
  franchiseId: string;
  league: { season: number; week: number; phase: LeaguePhase; phaseVersion: number };
  staff: Record<StaffRole, string | null>;
  staffAssignments: Partial<Record<StaffRole, { coachId: string; coachName: string; salary: number; contractYears: number; hiredWeek: number }>>;
  finances: { coachBudgetTotal: number; coachBudgetUsed: number };
  standards: {
    ownerStandard: "Cheap" | "Balanced" | "Premium";
    disciplineStandard: "Lenient" | "Balanced" | "Strict";
    schemeStandard: "Conservative" | "Balanced" | "Aggressive";
  };
  pendingOwnerRisks: string[];
  coachProfile?: { name: string; background: string };
  onboardingComplete?: boolean;
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
