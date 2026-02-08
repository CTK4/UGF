import type { StaffRole } from "@/domain/staffRoles";
import type { BeatKey, PhaseKey } from "@/engine/calendar";

export type GamePhase = "PRECAREER" | "INTERVIEWS" | "COORD_HIRING" | "JANUARY_OFFSEASON";
export type Role = StaffRole;

export type StaffAssignment = {
  candidateId: string;
  coachName: string;
  salary: number;
  years: number;
  hiredWeek: number;
};

export type TaskType =
  | "STAFF_MEETING"
  | "SCOUT_POSITION"
  | "COMBINE_REVIEW"
  | "WATCHLIST_UPDATE"
  | "FA_PRIORITIES"
  | "DRAFT_BOARD_FINALIZE";

export type Task = {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  status: "OPEN" | "DONE";
  gateId?: string;
  routeHint?: string;
};

export type ThreadMessage = {
  id: string;
  from: string;
  text: string;
  ts: string;
};

export type Thread = {
  id: string;
  title: string;
  unreadCount: number;
  messages: ThreadMessage[];
};

export type ProspectDiscovery = {
  level: 0 | 1 | 2 | 3;
  notes: string[];
};

export type GameState = {
  meta: { version: 1 };
  phase: GamePhase;
  time: {
    season: number;
    beatIndex: number;
    beatKey: BeatKey;
    label: string;
    phase: PhaseKey;
    phaseVersion: number;
  };
  coach: {
    name: string;
    age: number;
    hometown: string;
    backgroundKey: string;
    reputation: number;
    mediaStyle: string;
    personalityBaseline: string;
  };
  franchise: { ugfTeamKey: string; excelTeamKey: string };
  staff: {
    assignments: Record<Role, StaffAssignment | null>;
    budgetTotal: number;
    budgetUsed: number;
    blockedHireAttemptsRecent: number;
  };
  offseasonPlan: {
    priorities: string[];
    resignTargets: string[];
    shopTargets: string[];
    tradeNotes: string;
  } | null;
  tasks: Task[];
  completedGates: string[];
  lastUiError: string | null;
  inbox: Thread[];
  checkpoints: { ts: number; label: string; beatIndex: number; phaseVersion: number }[];
  draft: {
    discovered: Record<string, ProspectDiscovery>;
    watchlist: string[];
  };
};
