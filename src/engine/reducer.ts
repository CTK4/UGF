import { STAFF_ROLES } from "@/domain/staffRoles";
import type { GameAction } from "@/engine/actions";
import { applyScoutingAction } from "@/engine/scouting";
import type { GamePhase, GameState, Role } from "@/engine/gameState";

function createDefaultSideControl() {
  return { schemeAuthority: 50, assistantsAuthority: 50, locked: false };
}

function emptyAssignments() {
  return Object.fromEntries(STAFF_ROLES.map((role) => [role, null])) as Record<Role, null>;
}

function phaseLabel(phase: GamePhase): string {
  switch (phase) {
    case "PRECAREER":
      return "Precareer";
    case "INTERVIEWS":
      return "Interviews";
    case "COORD_HIRING":
      return "Coordinator Hiring";
    case "JANUARY_OFFSEASON":
      return "January Offseason";
  }
}

export function createNewGameState(): GameState {
  return {
    meta: { version: 1 },
    phase: "PRECAREER",
    time: { season: 2026, week: 1, phaseVersion: 1, label: phaseLabel("PRECAREER"), beatIndex: 1 },
    coach: {
      name: "",
      age: 35,
      hometown: "",
      backgroundKey: "",
      reputation: 50,
      mediaStyle: "Balanced",
      personalityBaseline: "Balanced",
      hometownId: "",
      hometownLabel: "",
      hometownTeamKey: "",
    },
    franchise: { ugfTeamKey: "", excelTeamKey: "" },
    staff: { assignments: emptyAssignments(), budgetTotal: 18_000_000, budgetUsed: 0, blockedHireAttemptsRecent: 0 },
    offseasonPlan: null,
    tasks: [],
    inbox: [],
    checkpoints: [],
    career: {
      control: {
        offense: createDefaultSideControl(),
        defense: createDefaultSideControl(),
        specialTeams: createDefaultSideControl(),
      },
    },
    completedGates: [],
    lastUiError: null,
    draft: { discovered: {}, watchlist: [] },
  };
}

export function reduceGameState(prev: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE": {
      const loaded = action.payload.state as GameState;
      const week = loaded.time?.week ?? loaded.time?.beatIndex ?? 1;
      return {
        ...createNewGameState(),
        ...loaded,
        time: {
          season: 2026,
          week,
          phaseVersion: loaded.time?.phaseVersion ?? 1,
          label: loaded.time?.label ?? phaseLabel(loaded.phase ?? "PRECAREER"),
          beatIndex: week,
          beatKey: loaded.time?.beatKey,
        },
        checkpoints: (loaded.checkpoints ?? []).map((cp) => ({
          ts: cp.ts,
          label: cp.label,
          week: cp.week ?? cp.beatIndex ?? week,
          beatIndex: cp.week ?? cp.beatIndex ?? week,
          phaseVersion: cp.phaseVersion,
        })),
      };
    }
    case "START_NEW":
      return createNewGameState();
    case "SET_COACH_PROFILE":
      return { ...prev, coach: { ...prev.coach, ...action.payload } };
    case "SET_BACKGROUND":
      return { ...prev, coach: { ...prev.coach, backgroundKey: action.payload.backgroundKey } };
    case "ACCEPT_OFFER":
      return {
        ...prev,
        phase: "COORD_HIRING",
        time: { ...prev.time, label: phaseLabel("COORD_HIRING") },
        franchise: { ugfTeamKey: action.payload.ugfTeamKey, excelTeamKey: action.payload.excelTeamKey },
      };
    case "HIRE_COACH": {
      const { role, assignment } = action.payload;
      const previous = prev.staff.assignments[role];
      const budgetUsed = prev.staff.budgetUsed - (previous?.salary ?? 0) + assignment.salary;
      if (budgetUsed > prev.staff.budgetTotal) {
        return {
          ...prev,
          staff: { ...prev.staff, blockedHireAttemptsRecent: (prev.staff.blockedHireAttemptsRecent ?? 0) + 1 },
          lastUiError: "Hire blocked: staff budget limit exceeded.",
        };
      }
      return {
        ...prev,
        staff: {
          ...prev.staff,
          budgetUsed,
          blockedHireAttemptsRecent: 0,
          assignments: { ...prev.staff.assignments, [role]: assignment },
        },
        lastUiError: null,
      };
    }
    case "ENTER_JANUARY_OFFSEASON":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON") },
      };
    case "SET_OFFSEASON_PLAN":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON") },
        offseasonPlan: action.payload,
      };
    case "COMPLETE_TASK": {
      const completedTask = prev.tasks.find((task) => task.id === action.payload.taskId);
      let next: GameState = {
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === action.payload.taskId ? { ...task, status: "DONE" } : task)),
      };
      if (completedTask?.type === "SCOUT_POSITION") {
        next = applyScoutingAction(next, { positions: action.payload.positions ?? [] });
      }
      return next;
    }
    case "MARK_THREAD_READ":
      return {
        ...prev,
        inbox: prev.inbox.map((thread) => (thread.id === action.payload.threadId ? { ...thread, unreadCount: 0 } : thread)),
      };
    case "ADVANCE_WEEK": {
      const week = prev.time.week + 1;
      const phaseVersion = prev.time.phaseVersion + 1;
      const label = action.payload?.label ?? `Week ${week}`;
      return {
        ...prev,
        time: { ...prev.time, week, beatIndex: week, phaseVersion, label },
        checkpoints: [...prev.checkpoints, { ts: Date.now(), label, week, beatIndex: week, phaseVersion }],
        lastUiError: null,
      };
    }
    default:
      return prev;
  }
}
