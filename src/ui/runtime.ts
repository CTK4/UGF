import type { UIController, UIState } from "@/ui/types";
import { createNewGameState } from "@/engine/reducer";
import { generateLeagueSchedule } from "@/services/schedule/generateSchedule";
import { simulateGame } from "@/services/sim/gameSim";
import type { DraftProspect, GameState } from "@/engine/gameState";

function hash32(seed: number, s: string): number {
  let h = 2166136261 >>> 0;
  const x = `${seed}|${s}`;
  for (let i = 0; i < x.length; i++) {
    h ^= x.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function unit(seed: number, s: string): number {
  return (hash32(seed, s) % 1_000_000) / 1_000_000;
}

function genProspects(seed: number, year: number): DraftProspect[] {
  const first = ["John", "Willie", "Brad", "Lorenzo", "Adonis", "Cole", "Dante", "Mason", "Grant", "Tyrell", "Flash", "Nolan"];
  const last = ["Calvin", "Duckett", "Bossworth", "Stewart", "Walker", "Ashburn", "Collier", "Pike", "Ellis", "Hudson", "Gorden", "Price"];
  const schools = ["Georgia Tech", "Auburn", "Ohio State", "Alabama", "USC", "Oregon", "LSU", "Michigan", "Texas", "Florida State"];
  const positions = ["QB", "WR", "OT", "EDGE", "CB", "S", "LB", "TE", "RB", "DI"];

  const out: DraftProspect[] = [];
  for (let i = 0; i < 60; i++) {
    const fn = first[Math.floor(unit(seed, `fn:${year}:${i}`) * first.length)];
    const ln = last[Math.floor(unit(seed, `ln:${year}:${i}`) * last.length)];
    const pos = positions[Math.floor(unit(seed, `pos:${year}:${i}`) * positions.length)];
    const school = schools[Math.floor(unit(seed, `sch:${year}:${i}`) * schools.length)];
    const ovrTruth = Math.round(68 + unit(seed, `ovr:${year}:${i}`) * 24);
    const grade = Math.round(ovrTruth - 3 + unit(seed, `gr:${year}:${i}`) * 6);

    const traitPool = pos === "QB"
      ? ["Processing", "Gunslinger", "Volatile", "Leader"]
      : pos === "WR"
        ? ["Vertical", "YAC", "Hands", "Polarizing"]
        : ["High Motor", "Raw", "Technical", "Injury Flag"];

    const traits = traitPool.filter((t) => unit(seed, `tr:${t}:${year}:${i}`) > 0.6).slice(0, 2);

    out.push({ id: `dp_${year}_${i}`, name: `${fn} ${ln}`, pos, school, grade, ovrTruth, traits });
  }

  out[0] = {
    id: `dp_${year}_LEGEND`,
    name: "Willie Duckett",
    pos: "QB",
    school: "Auburn",
    grade: 92,
    ovrTruth: 94,
    traits: ["Polarizing", "High Ceiling"],
  };

  return out.sort((a, b) => b.grade - a.grade);
}

function ensureSeasonInitialized(gs: GameState): GameState {
  const season = gs.season ?? { year: gs.time.season, schedule: null, resultsByGameId: {}, wins: 0, losses: 0, lastGameId: null };
  if (season.schedule) return { ...gs, season };

  const seed = (gs.world.leagueSeed ?? 1337) ^ hash32(gs.world.leagueSeed ?? 1337, "schedule:v1");
  const schedule = generateLeagueSchedule(seed, gs.time.season);
  return { ...gs, season: { ...season, schedule } };
}

function ensureDraftInitialized(gs: GameState): GameState {
  const year = gs.time.season;
  const draftV1 = gs.draftV1 ?? { year, prospects: [], pickedProspectIds: [], userPickMade: false };
  if (draftV1.prospects.length) return { ...gs, draftV1 };
  const seed = (gs.world.leagueSeed ?? 1337) ^ hash32(gs.world.leagueSeed ?? 1337, "draft:v1");
  const prospects = genProspects(seed, year);
  return { ...gs, draftV1: { ...draftV1, year, prospects } };
}


export function marketByWeekFor(_gs: GameState): Record<string, { candidates: Array<{ id: string; name: string; salaryDemand: number; requirement?: { minScheme?: number; minAssistants?: number; locksOnHire?: boolean; reason?: string; lockAxes?: Array<"SCHEME" | "ASSISTANTS"> } }> }> {
  return {};
}

function createInitialState(): UIState {
  return {
    route: { key: "Start" },
    save: { version: 1, gameState: createNewGameState() },
    corruptedSave: false,
    ui: {
      activeModal: null,
      notifications: [],
      opening: {
        coachName: "",
        coachAge: 35,
        coachPersonality: "Balanced",
        background: "",
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

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  let state: UIState = createInitialState();

  const setState = (next: UIState) => {
    state = next;
    onChange();
  };

  return {
    getState: () => state,
    selectors: {
      routeLabel: () => state.route.key,
      table: () => [],
      canAdvance: () => ({ canAdvance: true }),
    },
    dispatch: (action: any) => {
      switch (action.type) {
        case "NAVIGATE": {
          setState({ ...state, route: action.route });
          return;
        }

        case "CLOSE_MODAL": {
          setState({ ...state, ui: { ...state.ui, activeModal: null } });
          return;
        }

        case "DRAFT_PICK": {
          if (!state.save) return;
          const pid = String(action.prospectId ?? "");
          let gs = ensureDraftInitialized(state.save.gameState);

          const draft = gs.draftV1!;
          if (draft.userPickMade) return;

          const prospect = draft.prospects.find((p) => p.id === pid);
          if (!prospect) return;

          const rookieId = `rookie_${prospect.id}`;

          const newPlayer = {
            id: rookieId,
            name: prospect.name,
            pos: prospect.pos,
            age: 21,
            overall: prospect.ovrTruth,
            yearsLeft: 4,
            salary: 1_100_000,
            bonus: 0,
            capHit: 1_100_000,
            status: "ACTIVE" as const,
          };

          gs = {
            ...gs,
            roster: { ...gs.roster, players: { ...gs.roster.players, [rookieId]: newPlayer } },
            draftV1: { ...draft, pickedProspectIds: [...draft.pickedProspectIds, pid], userPickMade: true },
            phase: "REGULAR_SEASON",
          };

          gs = ensureSeasonInitialized(gs);

          setState({
            ...state,
            save: { version: 1, gameState: gs },
            route: { key: "Schedule" },
            ui: { ...state.ui, notifications: [`Drafted: ${prospect.name} (${prospect.pos})`, ...state.ui.notifications].slice(0, 3) },
          });
          return;
        }

        case "PLAY_USER_GAME": {
          if (!state.save) return;
          const week = Math.max(1, Math.round(Number(action.week ?? state.save.gameState.time.week)));
          let gs = ensureSeasonInitialized(state.save.gameState);
          const season = gs.season!;
          const schedule = season.schedule!;
          const userTeamId = gs.franchise.excelTeamKey || gs.franchise.ugfTeamKey || "";

          const games = schedule.gamesByWeek[week] ?? [];
          const userGame = games.find((g) => g.homeTeamId === userTeamId || g.awayTeamId === userTeamId);
          if (!userGame) {
            setState({
              ...state,
              ui: { ...state.ui, notifications: [`Week ${week}: Bye week.`, ...state.ui.notifications].slice(0, 3) },
            });
            return;
          }
          if (userGame.status === "PLAYED") return;

          const seed = (gs.world.leagueSeed ?? 1337) ^ hash32(gs.world.leagueSeed ?? 1337, `game:${userGame.id}`);
          const result = simulateGame(seed, gs, userGame);

          const updated = { ...userGame, status: "PLAYED" as const, score: { home: result.homeScore, away: result.awayScore } };
          const weekGames = (schedule.gamesByWeek[week] ?? []).map((g) => (g.id === updated.id ? updated : g));
          const nextSchedule = {
            ...schedule,
            gamesByWeek: { ...schedule.gamesByWeek, [week]: weekGames },
            gamesById: { ...schedule.gamesById, [updated.id]: updated },
          };

          const userWon =
            (updated.homeTeamId === userTeamId && result.homeScore > result.awayScore) ||
            (updated.awayTeamId === userTeamId && result.awayScore > result.homeScore);

          const repDelta = userWon ? 3 : -3;
          const newRep = Math.max(0, Math.min(100, (gs.coach.reputation ?? 50) + repDelta));

          const postgamePrompt = {
            title: "Postgame Press Conference",
            message: userWon ? "Media mood: Curious. They want to know what changed." : "Media mood: Confrontational. They question your approach.",
            actions: [
              { label: "Protect staff", action: { type: "CLOSE_MODAL" } },
              { label: "Own it", action: { type: "CLOSE_MODAL" } },
              { label: "Deflect", action: { type: "CLOSE_MODAL" } },
            ],
          };

          gs = {
            ...gs,
            coach: { ...gs.coach, reputation: newRep },
            season: {
              ...season,
              schedule: nextSchedule,
              resultsByGameId: { ...season.resultsByGameId, [updated.id]: result },
              wins: season.wins + (userWon ? 1 : 0),
              losses: season.losses + (userWon ? 0 : 1),
              lastGameId: updated.id,
            },
            phase: "POSTGAME",
          };

          setState({
            ...state,
            save: { version: 1, gameState: gs },
            ui: { ...state.ui, activeModal: postgamePrompt as any, notifications: [`Final: ${result.awayScore}-${result.homeScore} (${userWon ? "W" : "L"})`, ...state.ui.notifications].slice(0, 3) },
          });
          return;
        }

        default:
          return;
      }
    },
  };
}
