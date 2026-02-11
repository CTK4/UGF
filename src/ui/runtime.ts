import type { Route } from "@/ui/routes";
import type { SaveData, UIAction, UIController, UIState } from "@/ui/types";
import type { GameState, Role } from "@/engine/gameState";
import { clearLocalSave, loadLocalSave, persistLocalSave } from "@/domainE/persistence";


export type StaffMarketCandidate = {
  id: string;
  name: string;
  salaryDemand: number;
  requirement?: { minScheme?: number; minAssistants?: number; locksOnHire?: boolean; lockAxes?: Array<"SCHEME" | "ASSISTANTS">; reason?: string };
};

export type StaffMarketSession = {
  season: number;
  week: number;
  role: string;
  candidates: StaffMarketCandidate[];
};

export function marketByWeekFor(gameState: GameState): Record<string, StaffMarketSession> {
  const season = gameState.time.season;
  const week = gameState.time.week;
  const base = [
    { id: "coach-adler", name: "Mason Adler", salaryDemand: 4_800_000 },
    { id: "coach-novak", name: "Rico Novak", salaryDemand: 3_600_000, requirement: { minScheme: 55, reason: "prefers collaborative design" } },
    { id: "coach-york", name: "Jalen York", salaryDemand: 6_200_000, requirement: { locksOnHire: true, lockAxes: ["SCHEME"], reason: "wants system autonomy" } },
  ];
  const roles = ["OC", "DC", "STC"];
  const out: Record<string, StaffMarketSession> = {};
  for (const role of roles) {
    out[`${season}-${week}:${role}`] = {
      season,
      week,
      role,
      candidates: base.map((c, i) => ({ ...c, id: `${role.toLowerCase()}-${i}-${c.id}`, salaryDemand: c.salaryDemand + i * 250_000 })),
    };
  }
  return out;
}


function createInitialGameState(input: {
  coachName: string;
  coachAge: number;
  coachPersonality: string;
  coachHometownId: string;
  coachHometownLabel: string;
  coachHometownTeamKey: string;
  background: string;
  userTeamKey: string;
  excelTeamKey: string;
  leagueSeed: number;
}): GameState {
  const assignments = ["HC", "OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"].reduce((acc, role) => {
    acc[role as Role] = null;
    return acc;
  }, {} as Record<Role, null>);

  return {
    meta: { version: 2 },
    world: { leagueSeed: input.leagueSeed },
    phase: "JANUARY_OFFSEASON",
    time: { season: 2026, week: 1, dayIndex: 0, phaseVersion: 1, label: "January Week 1" },
    coach: {
      name: input.coachName,
      age: input.coachAge,
      hometown: input.coachHometownLabel,
      backgroundKey: input.background,
      reputation: 50,
      mediaStyle: "Balanced",
      personalityBaseline: input.coachPersonality,
      hometownId: input.coachHometownId,
      hometownLabel: input.coachHometownLabel,
      hometownTeamKey: input.coachHometownTeamKey,
    },
    characters: { byId: {}, coachId: null, ownersByTeamKey: {}, gmsByTeamKey: {} },
    teamFrontOffice: {},
    franchise: { ugfTeamKey: input.userTeamKey, excelTeamKey: input.excelTeamKey },
    staff: { assignments, budgetTotal: 25_000_000, budgetUsed: 0 },
    offseasonPlan: null,
    tasks: [
      { id: "task-hire-coords", type: "HIRE_COORDINATORS", title: "Hire Coordinators", description: "Fill OC/DC/STC roles.", status: "OPEN", routeHint: "StaffTree" },
      { id: "task-staff-meeting", type: "STAFF_MEETING", title: "Staff Meeting", description: "Set initial offseason priorities.", status: "OPEN", routeHint: "StaffMeeting" },
    ],
    inbox: [
      { id: "owner-intro", title: "Owner", unreadCount: 1, messages: [{ id: "m1", from: "Owner", text: "Welcome aboard. Build this the right way.", ts: new Date().toISOString() }] },
    ],
    checkpoints: [],
    career: {
      control: {
        offense: { schemeAuthority: 60, assistantsAuthority: 60, locked: false },
        defense: { schemeAuthority: 60, assistantsAuthority: 60, locked: false },
        specialTeams: { schemeAuthority: 60, assistantsAuthority: 60, locked: false },
      },
    },
    delegation: { offenseControl: "USER", defenseControl: "USER", gameManagement: "SHARED", gmAuthority: "GM_ONLY", setupComplete: false },
    draft: { discovered: {}, watchlist: [] },
    league: {
      playersById: {},
      teamRosters: {},
      teamsById: {},
      contractsById: {},
      personnelById: {},
      draftOrderBySeason: {},
      cap: { salaryCap: 255_400_000, capUsedByTeam: {} },
    },
    roster: { players: {} },
    freeAgency: {
      freeAgents: [
        { id: "fa-1", playerName: "Tyrell Hudson", position: "WR", overall: 90, age: 27, years: 4, salary: 21_000_000, teamKey: null, contractStatus: "FREE_AGENT" },
        { id: "fa-2", playerName: "Dante Collier", position: "QB", overall: 84, age: 29, years: 3, salary: 17_500_000, teamKey: null, contractStatus: "FREE_AGENT" },
      ],
      lastUpdatedWeek: 1,
    },
    cap: { limit: 255_400_000, deadMoney: [], capSpace: 60_000_000, payroll: 195_400_000, capLimit: 255_400_000 },
    completedGates: [],
    lastUiError: null,
  };
}


function emptyUiState(): UIState {
  return {
    route: { key: "Start" },
    save: null,
    corruptedSave: false,
    ui: {
      activeModal: null,
      notifications: [],
      opening: {
        coachName: "",
        coachAge: 38,
        coachPersonality: "Balanced",
        background: "Former QB",
        hometownId: "",
        hometownLabel: "",
        hometownTeamKey: "",
        interviewInvites: [],
        interviewResults: {},
        offers: [],
        coordinatorChoices: {},
      },
    },
  };
}

function defaultRouteFor(route: Route): Route {
  if (route.key === "Hub" && route.tab === "roster") return { key: "Roster" };
  return route;
}

function withNotification(state: UIState, message: string): UIState {
  return {
    ...state,
    ui: { ...state.ui, notifications: [message, ...state.ui.notifications].slice(0, 5) },
  };
}

function persistSave(save: SaveData | null): void {
  if (typeof window === "undefined") return;
  if (!save) {
    clearLocalSave();
    return;
  }
  persistLocalSave(save);
}

function hydrateSave(): SaveData | null {
  if (typeof window === "undefined") return null;
  const loaded = loadLocalSave();
  return loaded.save;
}

function createInterviewInvites(state: UIState) {
  const invites = [
    { franchiseId: "CLEVELAND_FORGE", tier: "REBUILD", overall: 72, summaryLine: "Rebuild with cap space and owner patience." },
    { franchiseId: "CHICAGO_UNION", tier: "FRINGE", overall: 79, summaryLine: "Middle-of-pack roster with defensive identity." },
    { franchiseId: "LOS_ANGELES_STAR", tier: "CONTENDER", overall: 90, summaryLine: "Contender opening after a legend retired." },
  ] as const;

  const interviewResults: UIState["ui"]["opening"]["interviewResults"] = {};
  for (const invite of invites) {
    interviewResults[invite.franchiseId] = {
      franchiseId: invite.franchiseId,
      ownerOpinion: 0,
      gmOpinion: 0,
      risk: 0,
      answers: [],
      completed: false,
      lastToneFeedback: "",
    };
  }

  return {
    ...state,
    route: { key: "Interviews" },
    ui: {
      ...state.ui,
      opening: {
        ...state.ui.opening,
        interviewInvites: [...invites],
        interviewResults,
        offers: [],
        lastInterviewError: undefined,
      },
    },
  };
}

function buildSaveFromOpening(state: UIState): SaveData {
  const opening = state.ui.opening;
  const teamKey = opening.offers[0]?.franchiseId ?? "CLEVELAND_FORGE";
  return {
    version: 1,
    gameState: createInitialGameState({
      coachName: opening.coachName || "Coach",
      coachAge: opening.coachAge || 38,
      coachPersonality: opening.coachPersonality || "Balanced",
      coachHometownId: opening.hometownId || "chicago_il",
      coachHometownLabel: opening.hometownLabel || "Chicago, IL",
      coachHometownTeamKey: opening.hometownTeamKey || "CHICAGO_UNION",
      background: opening.background || "Former QB",
      userTeamKey: teamKey,
      excelTeamKey: teamKey,
      leagueSeed: 2026,
    }),
  };
}

function reduceState(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, route: defaultRouteFor(action.route as Route) };
    case "SET_COACH_NAME":
      return { ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachName: String(action.coachName ?? "") } } };
    case "SET_COACH_AGE":
      return { ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachAge: Number(action.coachAge ?? 38) } } };
    case "SET_COACH_PERSONALITY":
      return { ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachPersonality: String(action.coachPersonality ?? "Balanced") } } };
    case "SET_HOMETOWN":
      return { ...state, ui: { ...state.ui, opening: { ...state.ui.opening, hometownId: String(action.hometownId ?? "") } } };
    case "SET_BACKGROUND":
      return { ...state, ui: { ...state.ui, opening: { ...state.ui.opening, background: String(action.background ?? "") } } };
    case "RUN_INTERVIEWS":
      return createInterviewInvites(state);
    case "OPENING_START_INTERVIEW":
      return { ...state, route: { key: "OpeningInterview", franchiseId: String(action.franchiseId ?? "") } };
    case "OPENING_ANSWER_INTERVIEW": {
      const franchiseId = String(action.franchiseId ?? "");
      const result = state.ui.opening.interviewResults[franchiseId];
      if (!result) return state;
      const nextAnswers = [...result.answers, { questionId: `Q${result.answers.length + 1}`, choiceId: "A" as const }];
      const completed = nextAnswers.length >= 3;
      const nextResult = {
        ...result,
        answers: nextAnswers,
        completed,
        ownerOpinion: result.ownerOpinion + 1,
        gmOpinion: result.gmOpinion + 1,
        lastToneFeedback: completed ? "Interview complete. Leadership tone noted." : "Answer recorded.",
      };
      const allResults = { ...state.ui.opening.interviewResults, [franchiseId]: nextResult };
      const allDone = Object.values(allResults).every((x) => x.completed);
      return {
        ...state,
        route: allDone ? { key: "Offers" } : state.route,
        ui: {
          ...state.ui,
          opening: {
            ...state.ui.opening,
            interviewResults: allResults,
            offers: allDone ? [...state.ui.opening.interviewInvites] : state.ui.opening.offers,
          },
        },
      };
    }
    case "ACCEPT_OFFER": {
      const franchiseId = String(action.franchiseId ?? "");
      const selected = state.ui.opening.interviewInvites.find((x) => x.franchiseId === franchiseId);
      if (!selected) return state;
      return {
        ...state,
        route: { key: "HireCoordinators" },
        ui: { ...state.ui, opening: { ...state.ui.opening, offers: [selected] } },
      };
    }
    case "SET_COORDINATOR_CHOICE":
      return {
        ...state,
        ui: {
          ...state.ui,
          opening: {
            ...state.ui.opening,
            coordinatorChoices: {
              ...state.ui.opening.coordinatorChoices,
              [String(action.role) as "OC" | "DC" | "STC"]: String(action.candidateName ?? ""),
            },
          },
        },
      };
    case "TRY_HIRE": {
      if (!state.save) return state;
      const role = String(action.role ?? "") as Role;
      const candidateId = String(action.candidateId ?? "");
      const session = marketByWeekFor(state.save.gameState)[`${state.save.gameState.time.season}-${state.save.gameState.time.week}:${role}`];
      const candidate = session?.candidates.find((c) => c.id === candidateId);
      if (!candidate) return withNotification(state, "Candidate no longer available.");
      const assignment = {
        candidateId,
        coachName: candidate.name,
        salary: candidate.salaryDemand,
        years: 3,
        hiredWeek: state.save.gameState.time.week,
      };
      const gameState = {
        ...state.save.gameState,
        staff: {
          ...state.save.gameState.staff,
          assignments: { ...state.save.gameState.staff.assignments, [role]: assignment },
          budgetUsed: state.save.gameState.staff.budgetUsed + candidate.salaryDemand,
        },
      };
      return withNotification({ ...state, save: { ...state.save, gameState }, route: { key: "StaffTree" } }, `${candidate.name} hired as ${role}.`);
    }
    case "FINALIZE_NEW_SAVE": {
      const save = buildSaveFromOpening(state);
      return { ...state, save, route: { key: "Hub" } };
    }
    case "LOAD_GAME":
      return state.save ? { ...state, route: { key: "Hub" } } : state;
    case "FORCE_SAVE":
      return withNotification(state, state.save ? "Save written." : "No active save to write.");
    case "RESET_SAVE":
      return withNotification({ ...state, save: null, route: { key: "Start" } }, "Save reset.");
    case "OPEN_PHONE_THREAD":
      return { ...state, route: { key: "PhoneThread", threadId: String(action.threadId ?? "") } };
    case "COMPLETE_TASK": {
      if (!state.save) return state;
      const taskId = String(action.taskId ?? "");
      const gameState = {
        ...state.save.gameState,
        tasks: state.save.gameState.tasks.map((t) => (t.id === taskId ? { ...t, status: "DONE" as const } : t)),
      };
      return { ...state, save: { ...state.save, gameState } };
    }
    case "ADVANCE_WEEK": {
      if (!state.save) return state;
      const week = state.save.gameState.time.week + 1;
      const gameState = {
        ...state.save.gameState,
        time: { ...state.save.gameState.time, week, dayIndex: 0, label: `Week ${week}` },
      };
      return withNotification({ ...state, save: { ...state.save, gameState } }, `Advanced to Week ${week}.`);
    }
    case "OPEN_MODAL":
      return {
        ...state,
        ui: {
          ...state.ui,
          activeModal: {
            title: String(action.title ?? "Action"),
            message: String(action.message ?? ""),
            actions: Array.isArray(action.actions) ? (action.actions as UIState["ui"]["activeModal"]["actions"]) : undefined,
          },
        },
      };
    case "CLOSE_MODAL":
      return { ...state, ui: { ...state.ui, activeModal: null } };
    case "REFRESH_FREE_AGENCY":
    case "INIT_ROSTER_DATA":
      return state;
    case "SIGN_FREE_AGENT": {
      if (!state.save) return state;
      const playerId = String(action.playerId ?? "");
      const freeAgents = state.save.gameState.freeAgency.freeAgents;
      const signing = freeAgents.find((fa) => fa.id === playerId);
      if (!signing) return state;
      const nextFreeAgents = freeAgents.filter((fa) => fa.id !== playerId);
      const nextRosterPlayers = {
        ...state.save.gameState.roster.players,
        [playerId]: {
          id: playerId,
          name: signing.playerName,
          pos: signing.position,
          age: signing.age,
          overall: signing.overall,
          yearsLeft: signing.years,
          salary: signing.salary,
          bonus: 0,
          capHit: signing.salary,
          status: "ACTIVE" as const,
        },
      };
      const nextCapSpace = Math.max(0, state.save.gameState.cap.capSpace - signing.salary);
      const gameState = {
        ...state.save.gameState,
        freeAgency: { ...state.save.gameState.freeAgency, freeAgents: nextFreeAgents },
        roster: { ...state.save.gameState.roster, players: nextRosterPlayers },
        cap: {
          ...state.save.gameState.cap,
          payroll: state.save.gameState.cap.payroll + signing.salary,
          capSpace: nextCapSpace,
        },
      };
      return withNotification(
        { ...state, save: { ...state.save, gameState }, ui: { ...state.ui, activeModal: null } },
        `Signed ${signing.playerName}.`,
      );
    }
    case "SUBMIT_STAFF_MEETING":
      return withNotification({ ...state, route: { key: "Hub" } }, "Staff meeting submitted.");
    default:
      return state;
  }
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  let state = emptyUiState();
  const hydrated = hydrateSave();
  if (hydrated) state = { ...state, save: hydrated };

  const api: UIController = {
    getState: () => state,
    dispatch: (action) => {
      state = reduceState(state, action);
      persistSave(state.save);
      onChange();
    },
    selectors: {
      routeLabel: () => state.route.key,
      table: () => [],
      canAdvance: () => {
        if (!state.save) return { canAdvance: false, message: "No active save." };
        const open = state.save.gameState.tasks.filter((t) => t.status !== "DONE");
        if (open.length > 0) return { canAdvance: false, message: `${open.length} required task(s) remaining.`, route: { key: "Hub" } };
        return { canAdvance: true };
      },
    },
  };

  return api;
}
