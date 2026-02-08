import rostersData from "@/data/generated/rosters.json";
import teamSummaryData from "@/data/generated/teamSummary.json";
import personnelData from "@/data/generated/personnel.json";
import { STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import { normalizeExcelTeamKey } from "@/data/teamMap";

export type GameTask = {
  id: string;
  title: string;
  detail: string;
  completed: boolean;
  createdForWeek: number;
  category: "staff" | "roster" | "strategy" | "owner";
};

export type InboxMessage = {
  id: string;
  from: "Owner" | "GM";
  subject: string;
  body: string;
  week: number;
  ts: string;
};

export type Checkpoint = {
  id: string;
  ts: string;
  label: string;
  code: string;
};

export type WeeklyRecap = {
  week: number;
  tasksCreated: string[];
  messagesAdded: string[];
  rosterChanges: string[];
};

export type RosterSnapshotPlayer = {
  playerId: number;
  rating: number;
  age: number;
  pos: string;
  team: string;
};

export type StaffAssignmentRecord = Partial<Record<StaffRole, { candidateId: string; coachName: string; salary: number; years: number }>>;

export type GameState = {
  time: { season: number; week: number; phase: string; phaseVersion: number };
  franchise: { ugfTeamKey: string; excelTeamKey: string };
  coachProfile: { name: string; background: string };
  interviewAnswers: string[];
  offers: string[];
  acceptedOffer: string | null;
  staffAssignments: StaffAssignmentRecord;
  rosterSnapshot: Record<string, RosterSnapshotPlayer>;
  inbox: InboxMessage[];
  news: string[];
  tasks: GameTask[];
  checkpoints: Checkpoint[];
  weeklyRecap: WeeklyRecap | null;
};

type RosterRow = { Team: string; Position: string; Age: number; Rating: number; [key: string]: unknown; "Player ID": number };
type TeamSummaryRow = { Team: string };
type PersonnelRow = { DisplayName: string; Position: string };

const rosterRows = rostersData as RosterRow[];
const summaryRows = teamSummaryData as TeamSummaryRow[];
const personnelRows = personnelData as PersonnelRow[];

function buildRosterSnapshot(excelTeamKey: string): Record<string, RosterSnapshotPlayer> {
  return rosterRows
    .filter((row) => normalizeExcelTeamKey(String(row.Team)) === excelTeamKey)
    .reduce<Record<string, RosterSnapshotPlayer>>((acc, row) => {
      const playerId = Number(row["Player ID"] ?? 0);
      acc[String(playerId)] = {
        playerId,
        rating: Number(row.Rating ?? 0),
        age: Number(row.Age ?? 0),
        pos: String(row.Position ?? "UNK"),
        team: String(row.Team ?? "Unknown"),
      };
      return acc;
    }, {});
}

export function createInitialTasks(week: number): GameTask[] {
  return [
    { id: `task-${week}-staff-meeting`, title: "Attend staff meeting", detail: "Complete your mandatory January staff meeting.", completed: false, createdForWeek: week, category: "staff" },
    { id: `task-${week}-depth-chart`, title: "Review depth chart", detail: "Audit roster strengths and weak spots.", completed: false, createdForWeek: week, category: "roster" },
  ];
}

export function createInitialGameState(input: { season: number; week: number; ugfTeamKey: string; excelTeamKey: string; coachName: string; background: string }): GameState {
  const safeExcel = summaryRows.some((row) => normalizeExcelTeamKey(String(row.Team)) === input.excelTeamKey)
    ? input.excelTeamKey
    : normalizeExcelTeamKey(String(summaryRows[0]?.Team ?? ""));
  return {
    time: { season: input.season, week: input.week, phase: "Preseason", phaseVersion: 1 },
    franchise: { ugfTeamKey: input.ugfTeamKey, excelTeamKey: safeExcel },
    coachProfile: { name: input.coachName, background: input.background },
    interviewAnswers: [],
    offers: [],
    acceptedOffer: null,
    staffAssignments: { HC: { candidateId: "coach-player", coachName: input.coachName, salary: 0, years: 4 } },
    rosterSnapshot: buildRosterSnapshot(safeExcel),
    inbox: [
      { id: "owner-welcome", from: "Owner", subject: "Welcome", body: "Set your staff and establish our weekly operating rhythm.", week: input.week, ts: new Date().toISOString() },
      { id: "gm-welcome", from: "GM", subject: "First priorities", body: "We need OC/DC/STC plus first-week priorities.", week: input.week, ts: new Date().toISOString() },
    ],
    news: [
      `${personnelRows.find((p) => p.Position === "Owner")?.DisplayName ?? "Owner"} introduces new coaching leadership.`,
    ],
    tasks: createInitialTasks(input.week),
    checkpoints: [],
    weeklyRecap: null,
  };
}

export function normalizeAssignments(assignments: StaffAssignmentRecord): StaffAssignmentRecord {
  const normalized: StaffAssignmentRecord = {};
  for (const role of STAFF_ROLES) {
    if (assignments[role]) normalized[role] = assignments[role];
  }
  return normalized;
}
