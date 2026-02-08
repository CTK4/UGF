import { STAFF_ROLES } from "@/domain/staffRoles";
import type { GameAction } from "@/engine/actions";
import type { GamePhase, GameState, Role } from "@/engine/gameState";

function emptyAssignments() {
  return Object.fromEntries(STAFF_ROLES.map((role) => [role, null])) as Record<Role, null>;
}

export function createNewGameState(week = 1): GameState {
  return {
    meta: { version: 1 },
    phase: "PRECAREER",
    time: { season: 2026, week, phaseVersion: 1, label: "Precareer" },
    coach: {
      name: "",
      age: 35,
      hometown: "",
      backgroundKey: "",
      reputation: 50,
      mediaStyle: "Balanced",
      personalityBaseline: "Balanced",
    },
    franchise: { ugfTeamKey: "", excelTeamKey: "" },
    staff: { assignments: emptyAssignments(), budgetTotal: 18_000_000, budgetUsed: 0 },
    offseasonPlan: null,
    tasks: [],
    inbox: [],
    checkpoints: [],
  };
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

export function reduceGameState(prev: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE":
      return action.payload.state;
    case "START_NEW":
      return createNewGameState(action.payload?.week ?? 1);
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
      return {
        ...prev,
        staff: {
          ...prev.staff,
          budgetUsed,
          assignments: { ...prev.staff.assignments, [role]: assignment },
        },
      };
    }
    case "SET_OFFSEASON_PLAN":
      return { ...prev, phase: "JANUARY_OFFSEASON", time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON") }, offseasonPlan: action.payload };
    case "COMPLETE_TASK":
      return { ...prev, tasks: prev.tasks.map((task) => (task.id === action.payload.taskId ? { ...task, completed: true } : task)) };
    case "ADVANCE_WEEK": {
      const week = prev.time.week + 1;
      const phaseVersion = prev.time.phaseVersion + 1;
      const label = action.payload?.label ?? `${phaseLabel(prev.phase)} Week ${week}`;
      return {
        ...prev,
        time: { ...prev.time, week, phaseVersion, label },
        checkpoints: [...prev.checkpoints, { ts: Date.now(), label, week, phaseVersion }],
      };
    }
    default:
      return prev;
  }
}
