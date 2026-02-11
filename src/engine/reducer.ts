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
    case "PRECAREER": return "Precareer";
    case "INTERVIEWS": return "Interviews";
    case "COORD_HIRING": return "Coordinator Hiring";
    case "JANUARY_OFFSEASON": return "January Offseason";
    case "DRAFT": return "Draft Week";
    case "REGULAR_SEASON": return "Regular Season";
    case "POSTGAME": return "Postgame";
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
    cap: { salaryCap: DEFAULT_SALARY_CAP, capUsedByTeam: {} },
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
    time: { season: 2026, week: 1, dayIndex: 0, phaseVersion: 1, label: phaseLabel("PRECAREER") },
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
    career: { control: { offense: createDefaultSideControl(), defense: createDefaultSideControl(), specialTeams: createDefaultSideControl() } },
    delegation: { offenseControl: "USER", defenseControl: "USER", gameManagement: "USER", gmAuthority: "FULL", setupComplete: false },
    draft: { discovered: {}, watchlist: [] },
    draftV1: { year: 2026, prospects: [], pickedProspectIds: [], userPickMade: false },
    season: { year: 2026, schedule: null, resultsByGameId: {}, wins: 0, losses: 0, lastGameId: null },
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
      const base = createNewGameState();
      const phase = (loaded?.phase as GamePhase) ?? base.phase;

      return {
        ...base,
        ...loaded,
        meta: { version: 2 },
        phase,
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
          label: String(loaded?.time?.label ?? phaseLabel(phase)),
        },
        staff: { ...base.staff, ...(loaded?.staff ?? {}) },
        characters: {
          byId: loaded?.characters?.byId ?? {},
          coachId: loaded?.characters?.coachId ?? null,
          ownersByTeamKey: loaded?.characters?.ownersByTeamKey ?? {},
          gmsByTeamKey: loaded?.characters?.gmsByTeamKey ?? {},
        },
        teamFrontOffice: loaded?.teamFrontOffice ?? {},
        career: loaded?.career ?? base.career,
        delegation: { ...base.delegation, ...(loaded?.delegation ?? {}) },
        draft: loaded?.draft ?? base.draft,
        draftV1: loaded?.draftV1 ?? base.draftV1,
        season: loaded?.season ?? base.season,
        roster: Array.isArray(loaded?.roster)
          ? base.roster
          : { ...base.roster, ...(loaded?.roster ?? {}), players: loaded?.roster?.players ?? {} },
        freeAgency: loaded?.freeAgency ?? base.freeAgency,
        cap: {
          ...base.cap,
          ...(loaded?.cap ?? {}),
          deadMoney: loaded?.cap?.deadMoney ?? [],
          limit: Number(loaded?.cap?.limit ?? loaded?.cap?.capLimit ?? DEFAULT_SALARY_CAP),
        },
        league: {
          ...base.league,
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
          week: Number(cp.week ?? 1),
          phaseVersion: Number(cp.phaseVersion ?? 1),
        })),
      };
    }

    case "APPLY_SCOUTING_ACTION":
      return applyScoutingAction(prev, action.payload);

    default:
      return prev;
  }
}
