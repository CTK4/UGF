import type { StaffRole } from "@/domain/staffRoles";

export type GamePhase = "PRECAREER" | "INTERVIEWS" | "COORD_HIRING" | "JANUARY_OFFSEASON";
export type Role = StaffRole;

export type StaffAssignment = {
  candidateId: string;
  coachName: string;
  salary: number;
  years: number;
  hiredWeek: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "DONE";
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
  notes: string;
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
  };
  offseasonPlan: {
    priorities: string[];
    resignTargets: string[];
    shopTargets: string[];
    tradeNotes: string;
  } | null;
  tasks: Task[];
  lastUiError: string | null;
  inbox: Thread[];
  checkpoints: { ts: number; label: string; week: number; phaseVersion: number }[];
  draft: {
    discovered: Record<string, ProspectDiscovery>;
    watchlist: string[];
  };
};
