import { STAFF_ROLES } from "@/domain/staffRoles";
import type { GameAction } from "@/engine/actions";
import { getBeat, getNextBeat } from "@/engine/calendar";
import { validateBeatGates } from "@/engine/gates";
import type { GamePhase, GameState, Role } from "@/engine/gameState";
import { appendWeeklyMessages } from "@/engine/phone";
import { applyScoutingAction } from "@/engine/scouting";
import { generateBeatTasks } from "@/engine/tasks";

function emptyAssignments() {
  return Object.fromEntries(STAFF_ROLES.map((role) => [role, null])) as Record<Role, null>;
}

export function createNewGameState(beatIndex = 1): GameState {
  const beat = getBeat(2026, beatIndex);
  return {
    meta: { version: 1 },
    phase: "PRECAREER",
    time: {
      season: 2026,
      beatIndex,
      beatKey: beat.key,
      label: beat.label,
      phase: beat.phase,
      phaseVersion: 1,
    },
    coach: {
      name: "",
      age: 35,
      hometown: "",
      hometownId: "",
      hometownLabel: "",
      hometownTeamKey: "",
      backgroundKey: "",
      reputation: 50,
      mediaStyle: "Balanced",
      personalityBaseline: "Balanced",
    },
    franchise: { ugfTeamKey: "", excelTeamKey: "" },
    staff: { assignments: emptyAssignments(), budgetTotal: 18_000_000, budgetUsed: 0, blockedHireAttemptsRecent: 0 },
    offseasonPlan: null,
    tasks: [],
    completedGates: [],
    lastUiError: null,
    inbox: [],
    checkpoints: [],
    draft: { discovered: {}, watchlist: [] },
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
    case "LOAD_STATE": {
      const loaded = action.payload.state as any;
      const season = loaded.time?.season ?? 2026;
      const beatIndex = loaded.time?.beatIndex ?? loaded.time?.week ?? 1;
      const beat = getBeat(season, beatIndex);
      return {
        ...loaded,
        draft: {
          discovered: Object.fromEntries(
            Object.entries(loaded.draft?.discovered ?? {}).map(([id, report]: [string, any]) => [
              id,
              { level: report.level ?? 0, notes: Array.isArray(report.notes) ? report.notes : report.notes ? [String(report.notes)] : [] },
            ]),
          ),
          watchlist: loaded.draft?.watchlist ?? [],
        },
        coach: {
          ...loaded.coach,
          hometownId: loaded.coach?.hometownId ?? "",
          hometownLabel: loaded.coach?.hometownLabel ?? loaded.coach?.hometown ?? "",
          hometownTeamKey: loaded.coach?.hometownTeamKey ?? "",
        },
        staff: {
          ...loaded.staff,
          blockedHireAttemptsRecent: loaded.staff?.blockedHireAttemptsRecent ?? 0,
        },
        time: {
          season,
          beatIndex,
          beatKey: loaded.time?.beatKey ?? beat.key,
          label: loaded.time?.label ?? beat.label,
          phase: loaded.time?.phase ?? beat.phase,
          phaseVersion: loaded.time?.phaseVersion ?? 1,
        },
        completedGates: loaded.completedGates ?? [],
        checkpoints: (loaded.checkpoints ?? []).map((cp: any) => ({
          ts: cp.ts,
          label: cp.label,
          beatIndex: cp.beatIndex ?? cp.week ?? beatIndex,
          phaseVersion: cp.phaseVersion,
        })),
      };
    }
    case "START_NEW":
      return createNewGameState(action.payload?.beatIndex ?? 1);
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
      if (budgetUsed > prev.staff.budgetTotal) {
        return {
          ...prev,
          staff: { ...prev.staff, blockedHireAttemptsRecent: prev.staff.blockedHireAttemptsRecent + 1 },
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
        completedGates: [
          ...new Set([
            ...prev.completedGates,
            ...(["OC", "DC", "STC"].every((r) => (r === role ? assignment : prev.staff.assignments[r as Role])) ? ["GATE.COORDINATORS_HIRED"] : []),
          ]),
        ],
        lastUiError: null,
      };
    }
    case "ENTER_JANUARY_OFFSEASON": {
      const next = {
        ...prev,
        phase: "JANUARY_OFFSEASON" as const,
        time: { ...prev.time, label: getBeat(prev.time.season, prev.time.beatIndex).label },
        lastUiError: null,
      };
      return { ...next, tasks: generateBeatTasks(next) };
    }
    case "SET_OFFSEASON_PLAN": {
      const next = {
        ...prev,
        phase: "JANUARY_OFFSEASON" as const,
        time: { ...prev.time, label: getBeat(prev.time.season, prev.time.beatIndex).label },
        offseasonPlan: action.payload,
        lastUiError: null,
        completedGates: [...new Set([...prev.completedGates, "GATE.STAFF_MEETING_DONE"])],
      };
      return next;
    }
    case "COMPLETE_TASK": {
      const completedTask = prev.tasks.find((task) => task.id === action.payload.taskId);
      let next: GameState = {
        ...prev,
        tasks: prev.tasks.map((task) => (task.id === action.payload.taskId ? { ...task, status: "DONE" } : task)),
      };
      if (completedTask?.gateId) {
        next = { ...next, completedGates: [...new Set([...next.completedGates, completedTask.gateId])] };
      }
      if (completedTask?.type === "SCOUT_POSITION") {
        next = applyScoutingAction(next, { positions: action.payload.positions ?? [] });
      }
      return next;
    }
    case "MARK_THREAD_READ": {
      return {
        ...prev,
        inbox: prev.inbox.map((thread) => (thread.id === action.payload.threadId ? { ...thread, unreadCount: 0 } : thread)),
      };
    }
    case "ADVANCE_WEEK": {
      const currentBeat = getBeat(prev.time.season, prev.time.beatIndex);
      const gateBlock = validateBeatGates(prev, currentBeat.gates);
      if (gateBlock) {
        return { ...prev, lastUiError: gateBlock.message };
      }

      const nextBeat = getNextBeat(prev.time.season, prev.time.beatIndex);
      const phaseVersion = prev.time.phaseVersion + 1;
      const nextState: GameState = {
        ...prev,
        time: {
          season: prev.time.season,
          beatIndex: nextBeat.index,
          beatKey: nextBeat.key,
          label: nextBeat.label,
          phase: nextBeat.phase,
          phaseVersion,
        },
        checkpoints: [...prev.checkpoints, { ts: Date.now(), label: nextBeat.label, beatIndex: nextBeat.index, phaseVersion }],
        lastUiError: null,
      };

      return {
        ...nextState,
        tasks: generateBeatTasks(nextState),
        inbox: appendWeeklyMessages(nextState),
      };
    }
    default:
      return prev;
  }
}
