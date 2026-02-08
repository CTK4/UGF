import { STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import { gameActions } from "@/engine/actions";
import type { GameState, StaffAssignment, Thread } from "@/engine/gameState";
import { createNewGameState, reduceGameState } from "@/engine/reducer";
import { generateBeatTasks } from "@/engine/tasks";
import { getScoutablePositions } from "@/engine/scouting";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";
import type { SaveData, UIAction, UIController, UIState } from "@/ui/types";

const SAVE_KEY = "ugf.save.v1";

function loadSave(): { save: SaveData | null; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { save: null, corrupted: false };
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed?.version !== 1 || !parsed?.gameState) return { save: null, corrupted: true };
    return { save: parsed, corrupted: false };
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
  const loadedGameState = save?.gameState
    ? reduceGameState(createNewGameState(1), gameActions.loadState(save.gameState))
    : null;

  let state: UIState = {
    route: initialRoute(loadedGameState ? { version: 1, gameState: loadedGameState } : null),
    save: loadedGameState ? { version: 1, gameState: loadedGameState } : null,
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

  const dispatchGameAction = (action: Parameters<typeof reduceGameState>[1]): GameState | null => {
    if (!state.save) return null;
    const gameState = reduceGameState(state.save.gameState, action);
    setState({ ...state, save: { version: 1, gameState } });
    return gameState;
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
          let gameState = reduceGameState(createNewGameState(1), gameActions.startNew(1));
          gameState = reduceGameState(
            gameState,
            gameActions.setCoachProfile({
              name: state.ui.opening.coachName || "You",
              age: 35,
              hometown: "Unknown",
              reputation: 50,
              mediaStyle: "Balanced",
              personalityBaseline: "Balanced",
            }),
          );
          gameState = reduceGameState(gameState, gameActions.setBackground(state.ui.opening.background));
          gameState = reduceGameState(gameState, gameActions.acceptOffer(franchiseId, normalizeExcelTeamKey(f.fullName)));
          gameState = {
            ...gameState,
            inbox: ensureThreads(gameState),
            tasks: [{ id: "task-1", type: "STAFF_MEETING", title: "Hire coordinators", description: "Fill OC/DC/STC positions.", status: "OPEN" }],
            draft: gameState.draft ?? { discovered: {}, watchlist: [] },
          };
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
          const nowWeek = gameState.time.beatIndex;
          (["OC", "DC", "STC"] as const).forEach((role) => {
            const pick = state.ui.opening.coordinatorChoices[role];
            if (!pick) return;
            const assignment: StaffAssignment = { candidateId: `${role}-${pick}`, coachName: pick, salary: 1_200_000, years: 3, hiredWeek: nowWeek };
            gameState = reduceGameState(gameState, gameActions.hireCoach(role, assignment));
          });
          gameState = reduceGameState(gameState, gameActions.enterJanuaryOffseason());
          gameState = { ...gameState, tasks: generateBeatTasks(gameState) };
          setState({ ...state, save: { version: 1, gameState }, route: { key: "StaffMeeting" } });
          return;
        }
        case "SUBMIT_STAFF_MEETING": {
          if (!state.save) return;
          const payload = {
            priorities: Array.isArray(action.payload?.priorities) ? (action.payload.priorities as string[]) : [],
            resignTargets: Array.isArray(action.payload?.resignTargets) ? (action.payload.resignTargets as string[]) : [],
            shopTargets: Array.isArray(action.payload?.shopTargets) ? (action.payload.shopTargets as string[]) : [],
            tradeNotes: String(action.payload?.tradeNotes ?? ""),
          };
          let gameState = reduceGameState(state.save.gameState, gameActions.setOffseasonPlan(payload));
          const initialMeetingTask = gameState.tasks.find((task) => task.title === "Initial staff meeting");
          if (initialMeetingTask) {
            gameState = reduceGameState(gameState, gameActions.completeTask(initialMeetingTask.id));
          }
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
          const assignment: StaffAssignment = { candidateId, coachName: candidateId, salary: 1_300_000, years: 3, hiredWeek: state.save.gameState.time.beatIndex };
          const gameState = reduceGameState(state.save.gameState, gameActions.hireCoach(role, assignment));
          setState({ ...state, save: { version: 1, gameState }, route: { key: "StaffTree" }, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "COMPLETE_TASK": {
          const taskId = String(action.taskId);
          const task = state.save?.gameState.tasks.find((item) => item.id === taskId);
          if (task?.type === "SCOUT_POSITION") {
            const positions = getScoutablePositions();
            setState({
              ...state,
              ui: {
                ...state.ui,
                activeModal: {
                  title: "Scout Position",
                  message: "Choose exactly one position for this scouting action.",
                  actions: positions.slice(0, 12).map((position) => ({
                    label: position,
                    action: { type: "CONFIRM_SCOUT_POSITION", taskId, position },
                  })),
                },
              },
            });
            return;
          }
          const gameState = dispatchGameAction(gameActions.completeTask(taskId));
          if (!gameState) return;
          return;
        }
        case "CONFIRM_SCOUT_POSITION": {
          const taskId = String(action.taskId);
          const position = String(action.position);
          const gameState = dispatchGameAction(gameActions.completeTask(taskId, [position]));
          if (!gameState) return;
          setState({ ...state, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "ADVANCE_WEEK": {
          const gameState = dispatchGameAction(gameActions.advanceWeek());
          if (!gameState) return;
          if (gameState.lastUiError) {
            const routeAction = gameState.lastUiError.toLowerCase().includes("hire")
              ? { type: "NAVIGATE", route: { key: "StaffTree" } }
              : { type: "NAVIGATE", route: { key: "StaffMeeting" } };
            setState({
              ...state,
              ui: {
                ...state.ui,
                activeModal: {
                  title: "Advance Blocked",
                  message: gameState.lastUiError,
                  actions: [
                    { label: "Go to Required Screen", action: routeAction },
                    { label: "Close", action: { type: "CLOSE_MODAL" } },
                  ],
                },
              },
            });
            return;
          }
          setState({ ...state, route: { key: "Hub" } });
          return;
        }
        case "OPEN_PHONE_THREAD": {
          if (!state.save) return;
          const gameState = reduceGameState(state.save.gameState, gameActions.markThreadRead(String(action.threadId)));
          setState({ ...state, save: { version: 1, gameState }, route: { key: "PhoneThread", threadId: String(action.threadId) } });
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
  const weekKey = `${state.time.season}-${state.time.beatIndex}`;
  return Object.fromEntries(STAFF_ROLES.map((role) => [`${weekKey}:${role}`, buildMarketForRole(role)]));
}
