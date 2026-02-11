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
  | "HIRE_COORDINATORS"
  | "ROSTER_REVIEW"
  | "SCOUTING_SETUP"
  | "FREE_AGENCY_PREP"
  | "DRAFT_PREP"
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

export type PlayerContract = {
  amount: number;
  yearsLeft: number;
  expSeason?: number;
};

export type LeaguePlayer = {
  id: string;
  name: string;
  positionGroup: string;
  pos: string;
  teamKey: string;
  overall?: number;
  age?: number;
  contract: PlayerContract;
};

export type LeagueState = {
  playersById: Record<string, LeaguePlayer>;
  teamRosters: Record<string, string[]>;
  cap: {
    salaryCap: number;
    capUsedByTeam: Record<string, number>;
  };
};

export type PlayerContractRow = {
  id: string;
  playerName: string;
  position: string;
  overall: number;
  age: number;
  years: number;
  salary: number;
  teamKey: string | null;
  contractStatus: "ACTIVE" | "FREE_AGENT";
  needsResign?: boolean;
};

export type PlayerContractState = {
  id: string;
  name: string;
  pos: string;
  age: number;
  overall: number;
  yearsLeft: number;
  salary: number;
  bonus: number;
  capHit: number;
  status: "ACTIVE" | "RELEASED";
};

export type GameState = {
  meta: { version: 2 };
  phase: GamePhase;
  time: { season: number; week: number; dayIndex: number; phaseVersion: number; label: string };
  coach: {
    name: string;
    age: number;
    hometown: string;
    backgroundKey: string;
    reputation: number;
    mediaStyle: string;
    personalityBaseline: string;
    // legacy compatibility
    hometownId?: string;
    hometownLabel?: string;
    hometownTeamKey?: string;
  };
  franchise: { ugfTeamKey: string; excelTeamKey: string };
  staff: {
    assignments: Record<Role, StaffAssignment | null>;
    budgetTotal: number;
    budgetUsed: number;
    blockedHireAttemptsRecent?: number;
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
  league: LeagueState;
  roster: {
    players: Record<string, PlayerContractState>;
    warning?: string;
  };
  freeAgency: {
    freeAgents: PlayerContractRow[];
    lastUpdatedWeek: number;
  };
  cap: {
    limit: number;
    deadMoney: Array<{ playerId: string; amount: number; season: number }>;
    capSpace: number;
    payroll: number;
    capLimit: number;
  };
  completedGates: string[];
  lastUiError: string | null;
};
