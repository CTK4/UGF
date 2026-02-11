import { STAFF_ROLES } from "@/domain/staffRoles";
import type { GameAction } from "@/engine/actions";
import type { GamePhase, GameState, Role } from "@/engine/gameState";
import { applyScoutingAction } from "@/engine/scouting";
import { DEFAULT_SALARY_CAP, sumCapByTeam } from "@/engine/cap";

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

function createEmptyLeagueState() {
  return {
    playersById: {},
    teamRosters: {},
    teamsById: {},
    contractsById: {},
    personnelById: {},
    draftOrderBySeason: {},
    cap: {
      salaryCap: DEFAULT_SALARY_CAP,
      capUsedByTeam: {},
    },
  };
}

function createEmptyFreeAgencyState() {
  return { freeAgents: [], lastUpdatedWeek: 0 };
}

function createEmptyCapState() {
  return { limit: DEFAULT_SALARY_CAP, deadMoney: [], capSpace: DEFAULT_SALARY_CAP, payroll: 0, capLimit: DEFAULT_SALARY_CAP };
}

function createEmptyRosterState() {
  return { players: {} };
}

export function createNewGameState(): GameState {
  return {
    meta: { version: 2 },
    world: { leagueSeed: 2026, leagueDbVersion: "v1", leagueDbHash: "" },
    phase: "PRECAREER",
    time: {
      season: 2026,
      week: 1,
      dayIndex: 0,
      phaseVersion: 1,
      label: phaseLabel("PRECAREER"),
    },
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
    characters: { byId: {}, coachId: null, ownersByTeamKey: {}, gmsByTeamKey: {} },
    teamFrontOffice: {},
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
    delegation: {
      offenseControl: "USER",
      defenseControl: "USER",
      gameManagement: "USER",
      gmAuthority: "FULL",
      setupComplete: false,
    },
    draft: { discovered: {}, watchlist: [] },
    league: createEmptyLeagueState(),
    roster: createEmptyRosterState(),
    freeAgency: createEmptyFreeAgencyState(),
    cap: createEmptyCapState(),
    completedGates: [],
    lastUiError: null,
  };
}

export function reduceGameState(prev: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_STATE": {
      const loaded = action.payload.state as any;
      return {
        ...createNewGameState(),
        ...loaded,
        meta: { version: 2 },
        world: {
          leagueSeed: Number(loaded?.world?.leagueSeed ?? loaded?.time?.season ?? 2026),
          leagueDbVersion: String(loaded?.world?.leagueDbVersion ?? "v1"),
          leagueDbHash: String(loaded?.world?.leagueDbHash ?? ""),
        },
        time: {
          season: Number(loaded?.time?.season ?? 2026),
          week: Number(loaded?.time?.week ?? loaded?.time?.beatIndex ?? 1),
          dayIndex: Number(loaded?.time?.dayIndex ?? 0),
          phaseVersion: Number(loaded?.time?.phaseVersion ?? 1),
          label: String(loaded?.time?.label ?? phaseLabel((loaded?.phase as GamePhase) ?? "PRECAREER")),
        },
        staff: { ...createNewGameState().staff, ...(loaded?.staff ?? {}) },
        characters: {
          byId: loaded?.characters?.byId ?? {},
          coachId: loaded?.characters?.coachId ?? null,
          ownersByTeamKey: loaded?.characters?.ownersByTeamKey ?? {},
          gmsByTeamKey: loaded?.characters?.gmsByTeamKey ?? {},
        },
        teamFrontOffice: loaded?.teamFrontOffice ?? {},
        career: loaded?.career ?? createNewGameState().career,
        delegation: {
          ...createNewGameState().delegation,
          ...(loaded?.delegation ?? {}),
        },
        draft: loaded?.draft ?? createNewGameState().draft,
        roster: Array.isArray(loaded?.roster)
          ? createEmptyRosterState()
          : {
              ...createEmptyRosterState(),
              ...(loaded?.roster ?? {}),
              players: loaded?.roster?.players ?? {},
            },
        freeAgency: loaded?.freeAgency ?? createEmptyFreeAgencyState(),
        cap: {
          ...createEmptyCapState(),
          ...(loaded?.cap ?? {}),
          deadMoney: loaded?.cap?.deadMoney ?? [],
          limit: Number(loaded?.cap?.limit ?? loaded?.cap?.capLimit ?? DEFAULT_SALARY_CAP),
        },
        league: {
          ...createEmptyLeagueState(),
          ...(loaded?.league ?? {}),
          teamsById: loaded?.league?.teamsById ?? {},
          contractsById: loaded?.league?.contractsById ?? {},
          personnelById: loaded?.league?.personnelById ?? {},
          draftOrderBySeason: loaded?.league?.draftOrderBySeason ?? {},
          cap: {
            salaryCap: Number(loaded?.league?.cap?.salaryCap ?? DEFAULT_SALARY_CAP),
            capUsedByTeam: loaded?.league?.cap?.capUsedByTeam ?? sumCapByTeam(loaded?.league?.playersById ?? {}),
          },
        },
        completedGates: loaded?.completedGates ?? [],
        lastUiError: loaded?.lastUiError ?? null,
        checkpoints: (loaded?.checkpoints ?? []).map((cp: any) => ({
          ts: Number(cp.ts ?? Date.now()),
          label: String(cp.label ?? "Checkpoint"),
          week: Number(cp.week ?? cp.beatIndex ?? loaded?.time?.week ?? 1),
          phaseVersion: Number(cp.phaseVersion ?? 1),
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
        time: { ...prev.time, label: phaseLabel("COORD_HIRING"), phaseVersion: prev.time.phaseVersion + 1 },
        franchise: { ugfTeamKey: action.payload.ugfTeamKey, excelTeamKey: action.payload.excelTeamKey },
      };
    case "HYDRATE_LEAGUE_ROSTER":
      return {
        ...prev,
        league: {
          ...createEmptyLeagueState(),
          ...action.payload,
          teamsById: action.payload.teamsById ?? {},
          contractsById: action.payload.contractsById ?? {},
          personnelById: action.payload.personnelById ?? {},
          draftOrderBySeason: action.payload.draftOrderBySeason ?? {},
          cap: {
            salaryCap: Number(action.payload.cap.salaryCap || DEFAULT_SALARY_CAP),
            capUsedByTeam: { ...action.payload.cap.capUsedByTeam },
          },
        },
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
      };
    }
    case "ENTER_JANUARY_OFFSEASON":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON"), phaseVersion: prev.time.phaseVersion + 1 },
      };
    case "SET_OFFSEASON_PLAN":
      return {
        ...prev,
        phase: "JANUARY_OFFSEASON",
        time: { ...prev.time, label: phaseLabel("JANUARY_OFFSEASON"), phaseVersion: prev.time.phaseVersion + 1 },
        offseasonPlan: action.payload,
        lastUiError: null,
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
        time: { ...prev.time, week, dayIndex: 0, phaseVersion, label },
        checkpoints: [...prev.checkpoints, { ts: Date.now(), label, week, phaseVersion }],
        lastUiError: null,
      };
    }
    default:
      return prev;
  }
}
