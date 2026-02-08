import { STAFF_ROLES } from "@/domain/staffRoles";
import type { GameAction } from "@/engine/actions";
import type { GamePhase, GameState, Role } from "@/engine/gameState";
import { generateOffseasonTasks } from "@/engine/tasks";

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
    lastUiError: null,
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

function missingCoordinatorRole(state: GameState): Role | null {
  const required: Role[] = ["OC", "DC", "STC"];
  return required.find((role) => !state.staff.assignments[role]) ?? null;
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
        lastUiError: null,
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
        lastUiError: null,
      };
    }
    case "ENTER_JANUARY_OFFSEASON":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON") },
        lastUiError: null,
      };
    case "SET_OFFSEASON_PLAN":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON") },
        offseasonPlan: action.payload,
        lastUiError: null,
      };
    case "COMPLETE_TASK":
      return {
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === action.payload.taskId ? { ...task, status: "DONE" } : task)),
      };
    case "ADVANCE_WEEK": {
      const missingRole = missingCoordinatorRole(prev);
      if (missingRole) {
        return { ...prev, lastUiError: `Cannot advance week: hire a ${missingRole} first.` };
      }

      const isFirstJanuaryWeek = prev.phase === "JANUARY_OFFSEASON" && prev.time.week === 1;
      if (isFirstJanuaryWeek && !prev.offseasonPlan) {
        return { ...prev, lastUiError: "Cannot advance week: set your offseason plan first." };
      }

      const week = prev.time.week + 1;
      const phaseVersion = prev.time.phaseVersion + 1;
      const label = action.payload?.label ?? `${phaseLabel(prev.phase)} Week ${week}`;
      const nextState: GameState = {
        ...prev,
        time: { ...prev.time, week, phaseVersion, label },
        checkpoints: [...prev.checkpoints, { ts: Date.now(), label, week, phaseVersion }],
        lastUiError: null,
      };

      return {
        ...nextState,
        tasks: generateOffseasonTasks(nextState),
      };
    }
    default:
      return prev;
  }
}
