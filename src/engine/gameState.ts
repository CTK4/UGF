import type { StaffRole } from "@/domain/staffRoles";

export type GamePhase = "PRECAREER" | "INTERVIEWS" | "COORD_HIRING" | "JANUARY_OFFSEASON";
export type Role = StaffRole;


export type ControlAxis = "SCHEME" | "ASSISTANTS";
export type ControlSide = "offense" | "defense" | "specialTeams";
export type SideControl = {
  schemeAuthority: number;
  assistantsAuthority: number;
  locked: boolean;
  lockedBy?: {
    role: "OC" | "DC" | "STC";
    staffId: string;
    staffName: string;
    reason: string;
    axes: ControlAxis[];
  };
};

export type ProspectDiscovery = { level: 0 | 1 | 2 | 3; notes: string[] };

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

export type GameState = {
  meta: { version: 1 };
  phase: GamePhase;
  time: { season: 2026; week: number; phaseVersion: number; label: string };
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
  inbox: Thread[];
  checkpoints: { ts: number; label: string; week: number; phaseVersion: number }[];
  career: { control: Record<ControlSide, SideControl> };
  draft: { discovered: Record<string, ProspectDiscovery>; watchlist: string[] };
  completedGates: string[];
  lastUiError: string | null;
};
