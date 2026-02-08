import { STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { GameState, StaffAssignment, Thread } from "@/engine/gameState";
import { createNewGameState, reduceGameState } from "@/engine/reducer";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";
import type { SaveData, UIAction, UIController, UIState } from "@/ui/types";

const SAVE_KEY = "ugf.save.v1";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCanonicalGameState(gameState: unknown): gameState is GameState {
  if (!isObject(gameState)) return false;
  if (!isObject(gameState.meta) || gameState.meta.version !== 1) return false;
  if (!isObject(gameState.time) || typeof gameState.time.week !== "number") return false;
  if (!isObject(gameState.coach) || typeof gameState.coach.name !== "string") return false;
  if (!isObject(gameState.franchise) || typeof gameState.franchise.ugfTeamKey !== "string") return false;
  if (!isObject(gameState.staff) || !isObject(gameState.staff.assignments)) return false;
  if (!Array.isArray(gameState.tasks) || !Array.isArray(gameState.inbox) || !Array.isArray(gameState.checkpoints)) return false;
  return true;
}

function migrateLegacyGameState(gameState: unknown): GameState | null {
  if (!isObject(gameState)) return null;
  if (!isObject(gameState.coachProfile) || !isObject(gameState.staffAssignments)) return null;

  let migrated = createNewGameState(1);

  if (typeof gameState.coachProfile.name === "string" && gameState.coachProfile.name.trim()) {
    migrated = reduceGameState(migrated, {
      type: "SET_COACH_PROFILE",
      payload: {
        name: gameState.coachProfile.name,
        age: typeof gameState.coachProfile.age === "number" ? gameState.coachProfile.age : migrated.coach.age,
        hometown: typeof gameState.coachProfile.hometown === "string" ? gameState.coachProfile.hometown : migrated.coach.hometown,
        reputation: typeof gameState.coachProfile.reputation === "number" ? gameState.coachProfile.reputation : migrated.coach.reputation,
        mediaStyle: typeof gameState.coachProfile.mediaStyle === "string" ? gameState.coachProfile.mediaStyle : migrated.coach.mediaStyle,
        personalityBaseline:
          typeof gameState.coachProfile.personalityBaseline === "string" ? gameState.coachProfile.personalityBaseline : migrated.coach.personalityBaseline,
      },
    });
  }

  if (typeof gameState.coachProfile.backgroundKey === "string" && gameState.coachProfile.backgroundKey.trim()) {
    migrated = reduceGameState(migrated, { type: "SET_BACKGROUND", payload: { backgroundKey: gameState.coachProfile.backgroundKey } });
  }

  if (isObject(gameState.franchise) && typeof gameState.franchise.ugfTeamKey === "string" && typeof gameState.franchise.excelTeamKey === "string") {
    migrated = reduceGameState(migrated, {
      type: "ACCEPT_OFFER",
      payload: { ugfTeamKey: gameState.franchise.ugfTeamKey, excelTeamKey: gameState.franchise.excelTeamKey },
    });
  }

  if (isObject(gameState.time) && typeof gameState.time.week === "number" && Number.isFinite(gameState.time.week)) {
    migrated = { ...migrated, time: { ...migrated.time, week: Math.max(1, Math.floor(gameState.time.week)) } };
  }

  return migrated;
}

function normalizeSaveData(parsed: unknown): SaveData | null {
  if (!isObject(parsed) || parsed.version !== 1) return null;
  const candidateState = parsed.gameState;
  if (isCanonicalGameState(candidateState)) {
    return { version: 1, gameState: candidateState };
  }
  const migrated = migrateLegacyGameState(candidateState);
  if (migrated) return { version: 1, gameState: migrated };
  return null;
}

function loadSave(): { save: SaveData | null; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: null, corrupted: false };
    const parsed = JSON.parse(raw) as unknown;
    const save = normalizeSaveData(parsed);
    if (!save) return { save: null, corrupted: true };
    return { save, corrupted: false };
  } catch {
    return { save: null, corrupted: true };
  }
}

function openingState(): UIState["ui"]["opening"] {
  return { coachName: "", background: "Former QB", interviewNotes: [], offers: [], coordinatorChoices: {} };
}

function initialRoute(save: SaveData | null): UIState["route"] {
  if (!save) return { key: "Start" };
  return { key: "Hub" };
}

function ensureThreads(state: GameState): Thread[] {
  if (state.inbox.length) return state.inbox;
  return [
    { id: "owner", title: "Owner", unreadCount: 1, messages: [{ id: "owner-1", from: "Owner", text: "Welcome to the job. Set your offseason priorities.", ts: new Date().toISOString() }] },
    { id: "gm", title: "GM", unreadCount: 1, messages: [{ id: "gm-1", from: "GM", text: "Let me know which coordinators you want to target.", ts: new Date().toISOString() }] },
  ];
}

function createCandidate(role: StaffRole, id: number) {
  return {
    id: `${role}-${id}`,
    name: `${role} Candidate ${id}`,
    role,
    primaryRole: role,
    traits: ["Teacher", "Player-dev"],
    philosophy: "Balanced",
    fitLabel: "Natural Fit" as const,
    salaryDemand: 1_000_000 + id * 150_000,
    recommendedOffer: 1_100_000 + id * 120_000,
    availability: "FREE_AGENT" as const,
    standardsNote: "Within standards",
    perceivedRisk: 20,
    defaultContractYears: 3,
  };
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const { save, corrupted } = loadSave();

  let state: UIState = {
    route: initialRoute(save),
    save,
    draftFranchiseId: FRANCHISES[0]?.id ?? null,
    corruptedSave: corrupted,
    ui: { activeModal: null, notifications: [], opening: openingState() },
  };

  let writeTimer: number | null = null;
  const scheduleSave = () => {
    if (!state.save) return;
    if (writeTimer) window.clearTimeout(writeTimer);
    writeTimer = window.setTimeout(() => {
      if (state.save) localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
    }, 120);
  };

  const setState = (next: UIState) => {
    state = next;
    scheduleSave();
    onChange();
  };

  const controller: UIController = {
    getState: () => state,
    dispatch: (action: UIAction) => {
      switch (action.type) {
        case "NAVIGATE":
          setState({ ...state, route: action.route as UIState["route"], ui: { ...state.ui, activeModal: null } });
          return;
        case "RESET_SAVE":
          localStorage.removeItem(SAVE_KEY);
          setState({ ...state, save: null, route: { key: "Start" }, corruptedSave: false, ui: { ...state.ui, opening: openingState() } });
          return;
        case "SET_DRAFT_FRANCHISE":
          setState({ ...state, draftFranchiseId: String(action.franchiseId) });
          return;
        case "SET_COACH_NAME":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachName: String(action.coachName ?? "") } } });
          return;
        case "SET_BACKGROUND":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, background: String(action.background ?? "") } } });
          return;
        case "RUN_INTERVIEWS": {
          const offers = FRANCHISES.slice(0, 3).map((f) => f.id);
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, interviewNotes: ["Interview cycle complete"], offers } }, route: { key: "Offers" } });
          return;
        }
        case "ACCEPT_OFFER": {
          const franchiseId = String(action.franchiseId);
          const f = getFranchise(franchiseId);
          if (!f) return;
          let gameState = reduceGameState(createNewGameState(1), { type: "START_NEW", payload: { week: 1 } });
          gameState = reduceGameState(gameState, {
            type: "SET_COACH_PROFILE",
            payload: {
              name: state.ui.opening.coachName || "You",
              age: 35,
              hometown: "Unknown",
              reputation: 50,
              mediaStyle: "Balanced",
              personalityBaseline: "Balanced",
            },
          });
          gameState = reduceGameState(gameState, { type: "SET_BACKGROUND", payload: { backgroundKey: state.ui.opening.background } });
          gameState = reduceGameState(gameState, { type: "ACCEPT_OFFER", payload: { ugfTeamKey: franchiseId, excelTeamKey: normalizeExcelTeamKey(f.fullName) } });
          gameState = { ...gameState, inbox: ensureThreads(gameState), tasks: [{ id: "task-1", title: "Hire coordinators", completed: false }] };
          setState({ ...state, save: { version: 1, gameState }, route: { key: "HireCoordinators" } });
          return;
        }
        case "SET_COORDINATOR_CHOICE":
          setState({
            ...state,
            ui: {
              ...state.ui,
              opening: {
                ...state.ui.opening,
                coordinatorChoices: { ...state.ui.opening.coordinatorChoices, [String(action.role)]: String(action.candidateName) },
              },
            },
          });
          return;
        case "FINALIZE_NEW_SAVE": {
          if (!state.save) return;
          let gameState = state.save.gameState;
          const nowWeek = gameState.time.week;
          (["OC", "DC", "STC"] as const).forEach((role) => {
            const pick = state.ui.opening.coordinatorChoices[role];
            if (!pick) return;
            const assignment: StaffAssignment = { candidateId: `${role}-${pick}`, coachName: pick, salary: 1_200_000, years: 3, hiredWeek: nowWeek };
            gameState = reduceGameState(gameState, { type: "HIRE_COACH", payload: { role, assignment } });
          });
          gameState = { ...gameState, phase: "JANUARY_OFFSEASON", time: { ...gameState.time, label: "January Offseason" } };
          setState({ ...state, save: { version: 1, gameState }, route: { key: "Hub" } });
          return;
        }
        case "REFRESH_MARKET":
          setState({ ...state });
          return;
        case "TRY_HIRE":
          setState({ ...state, ui: { ...state.ui, activeModal: { title: "Confirm Hire", message: "Proceed with this hire?", actions: [{ label: "Confirm", action: { type: "CONFIRM_HIRE", role: action.role, candidateId: action.candidateId } }, { label: "Cancel", action: { type: "CLOSE_MODAL" } }] } } });
          return;
        case "CLOSE_MODAL":
          setState({ ...state, ui: { ...state.ui, activeModal: null } });
          return;
        case "CONFIRM_HIRE": {
          if (!state.save) return;
          const role = action.role as StaffRole;
          const candidateId = String(action.candidateId);
          const assignment: StaffAssignment = { candidateId, coachName: candidateId, salary: 1_300_000, years: 3, hiredWeek: state.save.gameState.time.week };
          const gameState = reduceGameState(state.save.gameState, { type: "HIRE_COACH", payload: { role, assignment } });
          setState({ ...state, save: { version: 1, gameState }, route: { key: "StaffTree" }, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "COMPLETE_TASK": {
          if (!state.save) return;
          const gameState = reduceGameState(state.save.gameState, { type: "COMPLETE_TASK", payload: { taskId: String(action.taskId) } });
          setState({ ...state, save: { version: 1, gameState } });
          return;
        }
        case "ADVANCE_WEEK": {
          if (!state.save) return;
          const gameState = reduceGameState(state.save.gameState, { type: "ADVANCE_WEEK" });
          setState({ ...state, save: { version: 1, gameState }, route: { key: "Hub" } });
          return;
        }
        case "LOAD_GAME":
          if (state.save) setState({ ...state, route: { key: "Hub" } });
          return;
        default:
          return;
      }
    },
    selectors: {
      routeLabel: () => state.route.key,
    },
  };

  return controller;
}

export function buildMarketForRole(role: StaffRole) {
  return { weekKey: "2026-1", role, candidates: [createCandidate(role, 1), createCandidate(role, 2), createCandidate(role, 3)] };
}

export function marketByWeekFor(state: GameState) {
  const weekKey = `${state.time.season}-${state.time.week}`;
  return Object.fromEntries(STAFF_ROLES.map((role) => [`${weekKey}:${role}`, buildMarketForRole(role)]));
}
