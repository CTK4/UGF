import type { StaffRole } from "@/domain/staffRoles";
import type { LeagueSchedule } from "@/services/schedule/types";
import type { GameResult } from "@/services/sim/types";

export type GamePhase =
  | "PRECAREER"
  | "INTERVIEWS"
  | "COORD_HIRING"
  | "JANUARY_OFFSEASON"
  | "DRAFT"
  | "REGULAR_SEASON"
  | "POSTGAME";

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

export type ThreadMessage = { id: string; from: string; text: string; ts: string };

export type Thread = { id: string; title: string; unreadCount: number; messages: ThreadMessage[] };

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
  status?: string;
  contract: PlayerContract;
};

export type LeagueTeam = { id: string; teamId: string; name: string; conferenceId?: string; divisionId?: string; abbrev?: string; region?: string };
export type LeaguePersonnel = { id: string; personId: string; fullName: string; role?: string; teamId?: string; status?: string; contractId?: string };
export type LeagueContract = {
  id: string;
  contractId: string;
  entityType: string;
  entityId: string;
  teamId?: string;
  startSeason?: number;
  endSeason?: number;
  salaryY1?: number;
  guaranteed?: number;
  isExpired?: boolean;
};
export type LeagueDraftPick = { season: number; round: number; pick: number; teamId: string };

export type LeagueState = {
  playersById: Record<string, LeaguePlayer>;
  teamRosters: Record<string, string[]>;
  teamsById: Record<string, LeagueTeam>;
  contractsById: Record<string, LeagueContract>;
  personnelById: Record<string, LeaguePersonnel>;
  draftOrderBySeason: Record<string, LeagueDraftPick[]>;
  cap: { salaryCap: number; capUsedByTeam: Record<string, number> };
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

export type CharacterRole = "COACH" | "OWNER" | "GM" | "PLAYER";

export type Character = {
  id: string;
  teamKey?: string;
  role: CharacterRole;
  fullName: string;
  age?: number;
  personality: string;
  ownerTraits?: {
    patience: "LOW" | "MEDIUM" | "HIGH";
    spending: "LOW" | "MEDIUM" | "HIGH";
    interference: "LOW" | "MEDIUM" | "HIGH";
  };
  gmBiases?: { youth: number; speed: number; ras: number; discipline: number; trenches: number };
};

export type SeasonState = {
  year: number;
  schedule: LeagueSchedule | null;
  resultsByGameId: Record<string, GameResult>;
  wins: number;
  losses: number;
  lastGameId: string | null;
};

export type DraftProspect = {
  id: string;
  name: string;
  pos: string;
  school: string;
  grade: number; // user-visible
  ovrTruth: number; // hidden-ish
  traits: string[];
};

export type DraftStateV1 = {
  year: number;
  prospects: DraftProspect[];
  pickedProspectIds: string[];
  userPickMade: boolean;
};

export type GameState = {
  meta: { version: 2 };
  world: { leagueSeed: number; leagueDbVersion?: string; leagueDbHash?: string };
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
    hometownId?: string;
    hometownLabel?: string;
    hometownTeamKey?: string;
  };
  characters: {
    byId: Record<string, Character>;
    coachId: string | null;
    ownersByTeamKey: Record<string, string>;
    gmsByTeamKey: Record<string, string>;
  };
  teamFrontOffice: Record<string, { ownerId: string; gmId: string }>;
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
  delegation: {
    offenseControl: "USER" | "OC";
    defenseControl: "USER" | "DC";
    gameManagement: "USER" | "SHARED";
    gmAuthority: "FULL" | "GM_ONLY";
    setupComplete: boolean;
  };
  draft: { discovered: Record<string, ProspectDiscovery>; watchlist: string[] };
  draftV1?: DraftStateV1;
  season?: SeasonState;
  league: LeagueState;
  roster: { players: Record<string, PlayerContractState>; warning?: string };
  freeAgency: { freeAgents: PlayerContractRow[]; lastUpdatedWeek: number };
  cap: { limit: number; deadMoney: Array<{ playerId: string; amount: number; season: number }>; capSpace: number; payroll: number; capLimit: number };
  completedGates: string[];
  lastUiError: string | null;
};
