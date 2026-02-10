import { loadDataBundle, loadStyleBundle } from "@/bundle/loadBundle";
import { TableRegistry } from "@/data/TableRegistry";
import { canonicalStringify, sha256Hex } from "@/domainE/persistence";
import type { Route } from "@/ui/routes";
import type { UIAction, UIState } from "@/ui/types";
import { initStaffState, simulateCoachingCarousel, hireIntoRole, hashToUnit } from "@/services/staff";
import { initDraftState, userAutoPick, applyPick, prospectMeta, bestPickForTeam } from "@/services/draft";
import { applyDraftPickToLeague } from "@/services/draftMutations";
import { computeDraftClassGrades } from "@/services/draftGrades";
import { computeDraftBeats, applyNeedAdjustment, addRight } from "@/services/draftNarratives";
import { buildPlayerContractView, restructureConvertBaseToBonus, capHit as contractCapHit, applyCapDelta } from "@/services/contracts";
import {
  acceptDecision,
  applyTrade,
  buildCounterOffer,
  buildDraftTradeUpLadder,
  closeThread,
  evalOffer,
  generateInboundDraftOffers,
  generateInboundSeasonOffersFromBlock,
  openTradeThread,
  appendOfferToThread,
  simulateCpuCpuDraftTrades,
  simulateCpuCpuSeasonTrades,
} from "@/services/trade";
import { generateLeagueSchedule } from "@/services/schedule/generateSchedule";
import { simulateGame } from "@/services/sim/gameSim";
import { ensureDepthChart } from "@/services/depthChart/autoDepthChart";
import { mulberry32 } from "@/services/rng";
import { OFF_CORE40, DEF_CORE40 } from "@/services/playbook/core40";


type DispatchContext = {
  getState: () => UIState;
  setState: (next: UIState) => void;
  save: (state: UIState) => Promise<void>;
  clearSave: () => void;
};


function ensureSchedule(save: SaveState): SaveState {
  if (save.schedule) return save;
  const seed = (save.seed ?? 1337) ^ 0x20260206;
  const schedule = generateLeagueSchedule(seed, 2026);

  // Start the experience at the end of the 2026 season (Championship week),
  // like a newly-hired HC arriving for the biggest game, then rolling into the offseason.
  return { ...save, schedule, leaguePhase: "POSTSEASON", leagueWeek: 22 };
}


function routesEqual(a: Route, b: Route): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function withRoute(state: UIState, route: Route, mode: "push" | "replace" = "push"): UIState {
  const HISTORY_MAX = 50;
  if (routesEqual(state.route, route)) return state;

  const historyRaw = mode === "replace" ? state.history : [...state.history, state.route];
  const history = historyRaw.length > HISTORY_MAX ? historyRaw.slice(-HISTORY_MAX) : historyRaw;

  return { ...state, route, history, save: { ...state.save, route, history } };
}

function ensurePickInventoryInitialized(state: UIState): UIState {
  const inv = (state.save.pickInventory ?? {}) as Record<string, Array<{ yearOffset: number; round: number; overall?: number }>>;
  if (Object.keys(inv).length) return state;

  const d = state.save.draft;
  if (!d) return state;

  const nextInv: Record<string, Array<{ yearOffset: number; round: number; overall?: number }>> = {};
  for (const o of d.order) {
    const teamId = o.teamId;
    (nextInv[teamId] ??= []).push({ yearOffset: 0, round: o.round, overall: o.pickNo });
  }
  // add baseline future inventory (Rounds 1-7) per team (placeholders)
  const teams = Array.from(new Set(d.order.map((o) => o.teamId)));
  for (const t of teams) {
    for (const r of [1,2,3,4,5,6,7]) (nextInv[t] ??= []).push({ yearOffset: 1, round: r });
  }

  return { ...state, save: { ...state.save, pickInventory: nextInv } };
}

function ensureDraftInitialized(state: UIState): UIState {
  if (state.save.draft) return state;
  const reg = new TableRegistry(state.tables);
  const seed = state.save.seed ?? 2026;
  const draft = initDraftState({ reg, seed, year: 2026, staff: state.save.staff, teamNeedAdjustments: state.save.teamNeedAdjustments });
  const next = { ...state, save: { ...state.save, draft } };
  return next;
}

function pushDraftNews(state: UIState, title: string, body: string) {
  const draft = state.save.draft;
  if (!draft) return state;
  const tick = state.save.tick ?? 0;
  const id = `draft-${draft.year}-${draft.news.length + 1}`;
  const news = [...draft.news, { id, title, body, tick }];
  return { ...state, save: { ...state.save, draft: { ...draft, news } } };
}

function addRookieToRoster(state: UIState, teamId: string, playerId: string) {
  const reg = new TableRegistry(state.tables);
  const meta = prospectMeta(reg, playerId);
  if (!meta) return state;

  const adds = (state.save.rosterAdditions ?? []) as Array<Record<string, unknown>>;
  const nextRow: Record<string, unknown> = {
    Team: teamId,
    Name: meta.name,
    Pos: meta.pos,
    "Player ID": playerId.replace(/^p:/, ""),
    Age: 21,
    OVR: state.save.draft?.beliefByTeam?.[teamId]?.[playerId]?.grade ?? "",
    Notes: `Rookie (${meta.tier})`,
  };
  return { ...state, save: { ...state.save, rosterAdditions: [...adds, nextRow] } };
}

function ensureStaffInitialized(state: UIState): UIState {
  if (state.save.staff) return state;
  const reg = new TableRegistry(state.tables);
  const staff = initStaffState(reg, state.save.seed ?? 2026);
  const franchiseTeamId = state.save.franchiseTeamId ?? (() => {
    const teams = reg.getTable("Team Summary").map((r) => String((r as any).Team ?? "").trim()).filter(Boolean);
    return teams[0] ?? "Unknown Team";
  })();
  return { ...state, save: { ...state.save, staff, franchiseTeamId } };
}

function coachingThreadId(tick: number, staffId: string): string {
  return `coach-poach:${tick}:${staffId}`;
}

export async function dispatchAction(ctx: DispatchContext, action: UIAction): Promise<void> {
  const state0 = ctx.getState();
  try {
    switch (action.type) {
      
    case "RESET_BUNDLE_CACHE": {
      ui.setState({
        ...state,
        tables: {},
        style: undefined,
      });
      await ui.dispatch({ type: "LOAD_BUNDLE_ASSETS" });
      return;
    }
case "APP_BOOT":
      case "LOAD_BUNDLE_ASSETS": {
        const [style, data] = await Promise.all([loadStyleBundle(), loadDataBundle()]);
        const next0: UIState = { ...state0, style, tables: data.tables };
        const next = ensureStaffInitialized(next0);
          // scouting initialized (fog-of-war talent)
  const userTeamId = (next.save.franchiseTeamId ?? next.save.userTeamId ?? "") as string;
  if (userTeamId) {
    const reg = makeRegistry(next.tables);
    next = { ...next, save: updateWeeklyScouting(reg, next.save, userTeamId, next.save.staff) } as any;
  }
  ctx.setState(next);
        await ctx.save(next);
        await dispatchAction(ctx, { type: "RUN_CPU_TRADES_WEEKLY" });
        return;
      }

      case "NAVIGATE": {
        const next = withRoute(state0, action.route, action.mode ?? "push");
        ctx.setState(next);
        await ctx.save(next);
        await dispatchAction(ctx, { type: "RUN_CPU_TRADES_WEEKLY" });
        return;
      }

      case "BACK": {
        const prev = state0.history[state0.history.length - 1] ?? ({ key: "Hub" } as Route);
        const history = state0.history.slice(0, -1);
        const next = { ...state0, route: prev, history, save: { ...state0.save, route: prev, history } };
        ctx.setState(next);
        await ctx.save(next);
        await dispatchAction(ctx, { type: "RUN_CPU_TRADES_WEEKLY" });
        return;
      }

      case "OPEN_LEAGUE":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "League" } });

      case "OPEN_TEAM_SUMMARY":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "TeamSummary", teamId: action.teamId } });

      case "OPEN_TEAM_ROSTER":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "Hub", tab: "roster" } });

      case "OPEN_DEPTH_CHART": {
        let next = state0;
        const reg = makeRegistry(next.tables);
        next = { ...next, save: ensureDepthChart(reg, next.save, action.teamId) };
        ctx.setState(next);
        await ctx.save(next);
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "DepthChart", teamId: action.teamId } });
      }

      case "OPEN_DRAFT_BOARD": {
        let next = ensureDraftInitialized(state0);
        next = ensurePickInventoryInitialized(next);
        ctx.setState(next);
        await ctx.save(next);
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "DraftBoard" } });
      }

      case "OPEN_PROSPECT":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "CandidateDetail", personId: action.personId } });

      case "OPEN_HIRE_MARKET": {
        const teamId = state0.save.franchiseTeamId ?? ctx.getState().save.franchiseTeamId ?? "Unknown Team";
        const next = { ...state0, save: { ...state0.save, pendingHire: { teamId, role: action.role } } };
        ctx.setState(next);
        await ctx.save(next);
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "HireMarket", role: action.role } });
      }

      case "OPEN_CANDIDATE":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "CandidateDetail", personId: action.personId } });

      case "HIRE_CANDIDATE": {
        const state = ensureStaffInitialized(state0);
        const teamId = state.save.pendingHire?.teamId ?? state.save.franchiseTeamId ?? "Unknown Team";
        const role = action.role;
const member = state.save.staff!.staffById[action.personId];
const tier = member?.tier ?? "Standard";
const rep = state.save.coachReputation ?? 0.4;
const budget = state.save.staffBudgetM ?? 18;

const costM = tier === "Elite" ? 6 : 2;
const repReq = tier === "Elite" ? 0.65 : 0.0;
const owner = getOwnerConfidence(state.save, teamId, 70);
const ownerReq = tier === "Elite" ? 40 : 0;

if (owner < ownerReq) {
  const next = pushPhoneMessage(state, "Inbox", `Owner won\'t approve an Elite hire right now (confidence ${Math.round(owner)}).`);
  ctx.setState(next);
  await ctx.save(next);
  return;
}
if (rep < repReq) {
  const next = pushPhoneMessage(state, "Inbox", `We couldn't land ${member?.name ?? "that coach"} — reputation too low for Elite hires.`);
  ctx.setState(next);
  await ctx.save(next);
  return;
}
if (budget < costM) {
  const next = pushPhoneMessage(state, "Inbox", `We couldn't afford ${member?.name ?? "that coach"} — staff budget is too low.`);
  ctx.setState(next);
  await ctx.save(next);
  return;
}

const staff = hireIntoRole(state.save.staff!, teamId, role, action.personId);

        const hires = { ...state.save.hires, [`${teamId}:${role}`]: action.personId };
        const next = { ...state, save: { ...state.save, staff, hires, staffBudgetM: Math.max(0, (state.save.staffBudgetM ?? 18) - costM), coachReputation: Math.min(1, (state.save.coachReputation ?? 0.4) + (tier === "Elite" ? 0.01 : 0.005)) } };
        ctx.setState(next);
        await ctx.save(next);
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "StaffTree" } });
      }

      case "OPEN_CONTRACTS":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "Hub", tab: "contracts" } });

      case "OPEN_PLAYER_CONTRACT":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "PlayerContract", personId: action.personId } });

      case "OPEN_METRICS_DICTIONARY":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "MetricsDictionary" } });

      case "OPEN_REFERENCE":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "Reference" } });

      case "OPEN_TRADE_THREAD":
  return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "TradeThread", threadId: action.threadId } });

case "OPEN_TRADE_HUB":
  return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "TradeHub" } });

case "OPEN_PHONE_INBOX":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "PhoneInbox" } });

      case "OPEN_PHONE_THREAD": {
        const phoneRead = { ...state0.save.phoneRead, [action.threadId]: true };
        const next = { ...state0, save: { ...state0.save, phoneRead } };
        ctx.setState(next);
        await ctx.save(next);
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "PhoneThread", threadId: action.threadId } });
      }

      case "OPEN_STAFF_TREE":
        return dispatchAction(ctx, { type: "NAVIGATE", route: { key: "StaffTree" } });

      
    case "OPEN_SEASON_HUB": {
      const save2 = ensureSchedule(save);
      return { save: save2, route: { key: "SeasonHub" } };
    }

    case "PLAY_WEEK": {
      let save2 = ensureSchedule(save);
      save2 = ensureDepthChart(reg, save2, save2.userTeamId);

      const week = save2.leagueWeek ?? 1;
      const games = save2.schedule?.gamesByWeek?.[week] ?? [];
      const userTeamId = save2.userTeamId;
      const userGame = games.find((g) => g.homeTeamId === userTeamId || g.awayTeamId === userTeamId);

      const results: any[] = [];
      for (const g of games) {
        if (userGame && g.id === userGame.id) continue;
        results.push(simulateGame(save2.seed ?? 1, save2, g));
      }

      const lastWeekResults = { ...(save2 as any).lastWeekResults, [week]: results.map((r) => ({ gameId: r.gameId, home: r.homeTeamId, away: r.awayTeamId, homeScore: r.homeScore, awayScore: r.awayScore })) };
      save2 = { ...(save2 as any), lastWeekResults };

      if (!userGame) {
        save2 = { ...save2, leagueWeek: Math.min(18, week + 1) };
        return { save: save2, route: { key: "SeasonHub" } };
      }

      const rng = mulberry32((save2.seed ?? 1) ^ hashStr(userGame.id));
      const possession = rng.next() < 0.5 ? userGame.homeTeamId : userGame.awayTeamId;

      save2 = {
        ...save2,
        liveGame: {
          gameId: userGame.id,
          week,
          homeTeamId: userGame.homeTeamId,
          awayTeamId: userGame.awayTeamId,
          homeScore: 0,
          awayScore: 0,
          possessionTeamId: possession,
          down: 1,
          toGo: 10,
          yardLine: 25,
          quarter: 1,
          clockSec: 15 * 60,
          log: [{ text: "Kickoff. Game begins." }],
          controlOffense: true,
          controlDefense: true,
        },
      };

      return { save: save2, route: { key: "GameDay" } };
    }

    case "RUN_SNAP": {
      let save2 = save;
      const lg = save2.liveGame;
      if (!lg) return { save: save2, route };

      const rngSeed = (save2.seed ?? 1) ^ 0x9e3779b9 ^ hashStr(lg.gameId) ^ (lg.clockSec + lg.quarter * 1000 + lg.down * 10 + lg.yardLine);
      const rng = mulberry32(rngSeed);

      const userTeamId = save2.userTeamId;
      const offenseTeamId = lg.possessionTeamId;
      const defenseTeamId = offenseTeamId === lg.homeTeamId ? lg.awayTeamId : lg.homeTeamId;

      const userOnOffense = offenseTeamId === userTeamId;
      const userOnDefense = defenseTeamId === userTeamId;

      const offCall = (userOnOffense && lg.controlOffense && action.offenseCall) ? action.offenseCall : pickOffFallback(rng);
      const defCall = (userOnDefense && lg.controlDefense && action.defenseCall) ? action.defenseCall : pickDefFallback(rng);

      const offProxy = teamProxyFromSave(save2 as any, offenseTeamId);
      const defProxy = teamProxyFromSave(save2 as any, defenseTeamId);
      const stress = (save2 as any).teamStress?.[offenseTeamId] ?? 0;

      const res = resolveSnap(rng, offProxy, defProxy, offCall, defCall, stress);

      const playText = `${offenseTeamId} ${res.type} ${res.yards >= 0 ? "+" : ""}${res.yards} (${res.note})`;
      const log = [...lg.log, { text: playText }];

      let down = lg.down;
      let toGo = lg.toGo;
      let yardLine = lg.yardLine + res.yards;
      let homeScore = lg.homeScore;
      let awayScore = lg.awayScore;
      let possessionTeamId = lg.possessionTeamId;

      const clockDrain = res.type === "RUN" ? 33 : 21;
      let clockSec = Math.max(0, lg.clockSec - clockDrain);

      if (res.penalty) {
        yardLine += rng.next() < 0.6 ? -5 : 5;
        log.push({ text: "Penalty affects field position." });
      }

      if (res.turnover) {
        log.push({ text: `Turnover (${res.turnover}).` });
        possessionTeamId = defenseTeamId;
        down = 1; toGo = 10; yardLine = 25;
      } else if (yardLine >= 100) {
        log.push({ text: "Touchdown!" });
        if (offenseTeamId === lg.homeTeamId) homeScore += 7; else awayScore += 7;
        possessionTeamId = defenseTeamId;
        down = 1; toGo = 10; yardLine = 25;
      } else {
        if (res.yards >= toGo) {
          down = 1; toGo = 10;
        } else {
          down += 1;
          toGo = Math.max(1, toGo - Math.max(0, res.yards));
          if (down > 4) {
            if (yardLine >= 65 && rng.next() < 0.55) {
              log.push({ text: "Field goal is good." });
              if (offenseTeamId === lg.homeTeamId) homeScore += 3; else awayScore += 3;
            } else {
              log.push({ text: "Punt." });
            }
            possessionTeamId = defenseTeamId;
            down = 1; toGo = 10; yardLine = 25;
          }
        }
      }

      let quarter = lg.quarter;
      if (clockSec === 0) {
        if (quarter < 4) {
          log.push({ text: `End of Q${quarter}.` });
          quarter += 1;
          clockSec = 15 * 60;
        } else {
          log.push({ text: "Final whistle." });
          const completed = finalizeUserGame(save2 as any, { ...lg, homeScore, awayScore });
          return { save: completed, route: { key: "SeasonHub" } };
        }
      }

      save2 = { ...save2, liveGame: { ...lg, homeScore, awayScore, possessionTeamId, down, toGo, yardLine: Math.max(1, Math.min(99, yardLine)), quarter, clockSec, log } };
      return { save: save2, route };
    }

    case "SIM_REST_OF_GAME": {
      const lg = save.liveGame;
      if (!lg) return { save, route };
      let state: any = save;
      for (let i = 0; i < 500; i++) {
        const out = dispatch(reg, state, route, { type: "RUN_SNAP" } as any);
        state = out.save;
        if (!state.liveGame) return { save: state, route: { key: "SeasonHub" } };
      }
      return { save: state, route: { key: "SeasonHub" } };
    }

case "ADVANCE_WEEK": {
        let state = ensureStaffInitialized(state0);
  

        // Weekly PFF-style grading (visible OVR) driven by hidden talent + coaching + performance proxy.
        save1 = simulateWeeklyPff(reg, save1, save1.staff);

        const userTeamId = (save1.franchiseTeamId ?? save1.userTeamId ?? (teams[0] ?? "USER")) as string;
        save1 = updateWeeklyScouting(reg, save1, userTeamId, save1.staff);

      const tick = (state.save.tick ?? 0) + 1;
        const reg = new TableRegistry(state.tables);
        const franchiseTeamId = state.save.franchiseTeamId ?? "Unknown Team";
        const result = simulateCoachingCarousel({ reg, seed: state.save.seed ?? 2026, tick, franchiseTeamId, state: state.save.staff! });

        const coachingEvents = [...(state.save.coachingEvents ?? []), ...result.events];
        let phoneRead = { ...state.save.phoneRead };

        if (result.franchiseOcPoached) {
          const evt = {
            tick,
            type: "STAFF_POACHED" as const,
            fromTeamId: result.franchiseOcPoached.fromTeamId,
            toTeamId: result.franchiseOcPoached.toTeamId,
            staffId: result.franchiseOcPoached.staffId,
            fromRole: "OC" as const,
            toRole: "HC" as const,
          };
          coachingEvents.push(evt);
          const tid = coachingThreadId(tick, evt.staffId);
          phoneRead[tid] = false;
        }

        const next = {
          ...state,
          save: { ...state.save, tick, staff: result.next, coachingEvents, phoneRead },
        };
        ctx.setState(next);
        await ctx.save(next);
        await dispatchAction(ctx, { type: "RUN_CPU_TRADES_WEEKLY" });
        return;
      }

      case "COUNTER_OFFER_STAFF": {
        let state = ensureStaffInitialized(state0);
        const evt = (state.save.coachingEvents ?? []).find((e: any) => e.type === "STAFF_POACHED" && coachingThreadId(e.tick, e.staffId) === action.threadId) as any;
        if (!evt) throw new Error("Counter-offer: event not found for thread.");

        if ((state.save.tick ?? 0) !== evt.tick) {
          const coachingResolutions = { ...(state.save.coachingResolutions ?? {}), [action.threadId]: { tick: state.save.tick ?? 0, action: "COUNTER_OFFER", result: "REJECT", note: "Counter-offer window expired." } };
          const next = { ...state, save: { ...state.save, coachingResolutions } };
          ctx.setState(next);
          await ctx.save(next);
          return;
        }

        const seed = state.save.seed ?? 2026;
        const acceptRoll = hashToUnit(seed, "counter", evt.tick, evt.staffId, evt.toTeamId);
        const rating = state.save.staff!.staffById[evt.staffId]?.rating ?? 50;
        const accept = acceptRoll < Math.min(0.75, 0.25 + rating / 200);

        let staff = state.save.staff!;
        let note = "";

        if (accept) {
          staff = hireIntoRole(staff, evt.fromTeamId, "OC", evt.staffId);
          note = "Accepted. Coach returns as OC.";
        } else {
          note = "Rejected. Coach stays with new team.";
        }

        const coachingResolutions = { ...(state.save.coachingResolutions ?? {}), [action.threadId]: { tick: state.save.tick ?? 0, action: "COUNTER_OFFER", result: accept ? "ACCEPT" : "REJECT", note } };

        const next = { ...state, save: { ...state.save, staff, coachingResolutions } };
        ctx.setState(next);
        await ctx.save(next);
        await dispatchAction(ctx, { type: "RUN_CPU_TRADES_WEEKLY" });
        return;
      }

      case "PROMOTE_INTERNAL": {
        let state = ensureStaffInitialized(state0);
        const teamId = state.save.franchiseTeamId ?? "Unknown Team";
        const slots = state.save.staff!.teamStaff[teamId] ?? {};
        const targetRole: "OC" = "OC";

        // Prefer QB Coach -> Assistant -> DC -> HC -> best free agent OC/HC
let promotedId: string | undefined;
let vacatedRole: "QB" | "ASST" | "DC" | "HC" | null = null;

if ((slots as any).QB) {
  promotedId = (slots as any).QB;
  vacatedRole = "QB";
} else if ((slots as any).ASST) {
  promotedId = (slots as any).ASST;
  vacatedRole = "ASST";
} else if (slots.DC) {
  promotedId = slots.DC;
  vacatedRole = "DC";
} else if (slots.HC) {
  promotedId = slots.HC;
  vacatedRole = "HC";
} else {
  const fa = state.save.staff!.freeAgents.find((id) => {
    const pos = state.save.staff!.staffById[id]?.position;
    return pos === "Offensive Coordinator" || pos === "Head Coach";
  });
  promotedId = fa;
  vacatedRole = null;
}

if (!promotedId) throw new Error("Promote internal: no candidate available.");


        let staff = hireIntoRole(state.save.staff!, teamId, targetRole, promotedId);

        const coachingResolutions = {
          ...(state.save.coachingResolutions ?? {}),
          [action.threadId]: { tick: state.save.tick ?? 0, action: "PROMOTE_INTERNAL", result: "DONE", note: `Promoted ${promotedId} to OC.` },
        };

        // Auto open hire market for vacated role (requested)
        const pendingHire = vacatedRole ? { teamId, role: vacatedRole } : state.save.pendingHire ?? null;

        const next = { ...state, save: { ...state.save, staff, coachingResolutions, pendingHire } };
        ctx.setState(next);
        await ctx.save(next);

        if (vacatedRole) {
          await dispatchAction(ctx, { type: "NAVIGATE", route: { key: "HireMarket", role: vacatedRole }, mode: "replace" });
        } else {
          await dispatchAction(ctx, { type: "NAVIGATE", route: { key: "StaffTree" }, mode: "replace" });
        }
        return;
      }

      case "DO_NOTHING_COACH_POACH": {
  const coachingResolutions = {
    ...(state0.save.coachingResolutions ?? {}),
    [action.threadId]: { tick: state0.save.tick ?? 0, action: "DO_NOTHING", result: "DONE", note: "You chose to do nothing." },
  };

  // Guided flow: if franchise OC slot is vacant, jump straight to HireMarket(OC).
  const teamId = state0.save.franchiseTeamId ?? "Unknown Team";
  const ocVacant = !state0.save.staff?.teamStaff?.[teamId]?.OC;

  const pendingHire = ocVacant ? { teamId, role: "OC" } : (state0.save.pendingHire ?? null);

  const next = { ...state0, save: { ...state0.save, coachingResolutions, pendingHire } };
  ctx.setState(next);
  await ctx.save(next);

  if (ocVacant) {
    await dispatchAction(ctx, { type: "NAVIGATE", route: { key: "HireMarket", role: "OC" }, mode: "replace" });
  } else {
    await dispatchAction(ctx, { type: "NAVIGATE", route: { key: "StaffTree" }, mode: "replace" });
  }
  return;
}

case "ADVANCE_DRAFT": {
  let state = ensureDraftInitialized(state0);
  const reg = new TableRegistry(state.tables);
  const franchiseTeamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";

  const stepOnce = (s: UIState): UIState => {
            // CPU↔CPU draft trade chance (bounded)
            const sim = simulateCpuCpuDraftTrades({ reg, save: s.save as any, seed: s.save.seed ?? 2026, maxPerRound: 1 });
            if (sim.events.length) {
              let ns: UIState = { ...s, save: sim.save as any };
              for (const e of sim.events) ns = pushDraftNews(ns, "Draft Trade", e);
              s = ns;
            }

    const d = s.save.draft!;
    const slot = d.order[d.currentPickIndex];
    if (!slot) return s;

    if (slot.teamId === franchiseTeamId && action.toNextUserPick !== false) {
      // Stop on user's clock
      return s;
    }

    const { playerId, note } = bestPickForTeam({ reg, draft: d, teamId: slot.teamId, franchiseTeamId, seed: s.save.seed ?? 2026 });
    const nextDraft = applyPick({ reg, draft: d, pickNo: slot.pickNo, teamId: slot.teamId, playerId, note });
    let next: UIState = { ...s, save: { ...s.save, draft: { ...nextDraft, currentPickIndex: d.currentPickIndex + 1 } } };

// league mutation + news
const mutated = applyDraftPickToLeague({
  reg,
  save: next.save as any,
  draft: next.save.draft as any,
  pickNo: slot.pickNo,
  teamId: slot.teamId,
  playerId,
});
next = { ...next, save: { ...mutated.save, draft: next.save.draft as any } };
next = pushDraftNews(next, "Draft Pick", mutated.body);


    // Add small league note if it's a top-10 pick
    if (slot.pickNo <= 10) {
      const meta = prospectMeta(reg, playerId);
      if (meta) next = pushDraftNews(next, `Pick ${slot.pickNo}: ${slot.teamId} selects ${meta.name}`, `${note} (${meta.pos}, ${meta.college})`);
    }
    return next;
  };

  // Run until next user pick if requested
  let next = state;
  const maxSteps = 64;
  for (let i = 0; i < maxSteps; i++) {
    const d = next.save.draft!;
    const slot = d.order[d.currentPickIndex];
    if (!slot) break;
    if (slot.teamId === franchiseTeamId) break;
    next = stepOnce(next);
    if (next.save.draft!.currentPickIndex === d.currentPickIndex) break;
  }

  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "AUTO_PICK": {
  let state = ensureDraftInitialized(state0);
  const reg = new TableRegistry(state.tables);
  const d = state.save.draft!;
  const franchiseTeamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const slot = d.order[d.currentPickIndex];
  if (!slot) return;

  const { playerId, note } = userAutoPick({ reg, draft: d, franchiseTeamId, seed: state.save.seed ?? 2026 });
  const nextDraft = applyPick({ reg, draft: d, pickNo: slot.pickNo, teamId: franchiseTeamId, playerId, note });

  let next: UIState = { ...state, save: { ...state.save, draft: { ...nextDraft, currentPickIndex: d.currentPickIndex + 1 } } };

  const mutated = applyDraftPickToLeague({
    reg,
    save: next.save as any,
    draft: next.save.draft as any,
    pickNo: slot.pickNo,
    teamId: franchiseTeamId,
    playerId,
  });

  next = { ...next, save: { ...mutated.save, draft: next.save.draft as any } };
  next = pushDraftNews(next, "Auto Pick", mutated.body);

  ctx.setState(next);
  await ctx.save(next);
  return;
}


case "DRAFT_PICK": {
  let state = ensureDraftInitialized(state0);
  const reg = new TableRegistry(state.tables);
  const d = state.save.draft!;
  const franchiseTeamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const slot = d.order[d.currentPickIndex];
  if (!slot) return;
  if (slot.teamId !== franchiseTeamId) return;

  const playerId = action.playerId;
  if (!d.available.includes(playerId)) {
    const nextErr = { ...state, lastError: { message: "Player not available", context: { playerId } } };
    ctx.setState(nextErr);
    await ctx.save(nextErr);
    return;
  }

  const nextDraft = applyPick({ reg, draft: d, pickNo: slot.pickNo, teamId: franchiseTeamId, playerId, note: "User pick." });

  let next: UIState = { ...state, save: { ...state.save, draft: { ...nextDraft, currentPickIndex: d.currentPickIndex + 1 } } };
  next = addRookieToRoster(next, franchiseTeamId, playerId);

  const meta = prospectMeta(reg, playerId);
  if (meta) next = pushDraftNews(next, `You drafted ${meta.name} (${meta.pos})`, `User pick at ${slot.pickNo}. Tier: ${meta.tier}.`);

  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "SET_DRAFT_TARGET": {
  let state = ensureDraftInitialized(state0);
  const d = state.save.draft!;
  const targets = { ...d.user.targets };
  if (action.on) targets[action.playerId] = true;
  else delete targets[action.playerId];
  const next = { ...state, save: { ...state.save, draft: { ...d, user: { ...d.user, targets } } } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "SET_DRAFT_NO_PICK": {
  let state = ensureDraftInitialized(state0);
  const d = state.save.draft!;
  const noPick = { ...d.user.noPick };
  if (action.on) noPick[action.playerId] = true;
  else delete noPick[action.playerId];
  const next = { ...state, save: { ...state.save, draft: { ...d, user: { ...d.user, noPick } } } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "GENERATE_DRAFT_TRADE_OFFERS": {
  let state = ensureDraftInitialized(state0);
  const reg = new TableRegistry(state.tables);
  const teamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const offers = generateInboundDraftOffers({
    reg,
    save: state.save,
    fromTeamId: teamId,
    pickNo: action.pickNo,
    seed: state.save.seed ?? 2026,
    maxOffers: 2,
  });

  const inbox = [...(state.save.tradeInbox ?? [])].filter((o) => !(o.phase === "draft" && o.status === "pending" && o.fromTeamId === teamId));
  const next = { ...state, save: { ...state.save, tradeInbox: [...offers, ...inbox] } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "ACCEPT_TRADE_OFFER": {
  let state = ensureDraftInitialized(state0);
  const reg = new TableRegistry(state.tables);
  const inbox = [...(state.save.tradeInbox ?? [])];
  const idx = inbox.findIndex((o) => o.id === action.offerId);
  if (idx < 0) return;

  const offer = inbox[idx];

  // Both sides evaluate using same function (no cheating)
  const fromTeamId = offer.fromTeamId;
  const toTeamId = offer.toTeamId;

  const dFrom = acceptDecision(reg, state.save, offer as any, fromTeamId);
  const dTo = acceptDecision(reg, state.save, offer as any, toTeamId);

  if (!dFrom.accept || !dTo.accept) {
    inbox[idx] = { ...offer, status: "rejected", rationale: `Rejected: ${!dFrom.accept ? dFrom.rationale : dTo.rationale}` } as any;
    const next = { ...state, save: { ...state.save, tradeInbox: inbox }, lastError: { message: "Trade rejected on evaluation.", context: { from: dFrom, to: dTo } } };
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  const appliedSave = applyTrade({ reg, save: state.save, offer: offer as any });
  inbox[idx] = { ...offer, status: "accepted", eval: { from: dFrom.eval as any, to: dTo.eval as any }, rationale: offer.rationale } as any;

  const next = { ...state, save: { ...appliedSave, tradeInbox: inbox } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "REJECT_TRADE_OFFER": {
  const inbox = [...(state0.save.tradeInbox ?? [])];
  const idx = inbox.findIndex((o) => o.id === action.offerId);
  if (idx < 0) return;
  inbox[idx] = { ...inbox[idx], status: "rejected" } as any;
  const next = { ...state0, save: { ...state0.save, tradeInbox: inbox } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "PROPOSE_TRADE": {
  let state = ensureDraftInitialized(state0);
  state = ensurePickInventoryInitialized(state);

  const reg = new TableRegistry(state.tables);
  const fromTeamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const seed = state.save.seed ?? 2026;

  // Reputation guardrail: repeated lowballs raise accept thresholds vs user.
  const rep = state.save.tradeReputation ?? { score: 0.5, lowballStrikes: 0, lastTick: 0 };
  const repPenalty = Math.min(0.20, rep.lowballStrikes * 0.05);

  const opened = openTradeThread(state.save as any, action.toTeamId, seed);
  let nextSave: any = opened.save;
  const threadId = opened.threadId;

  const offer: any = {
    id: `user-offer-${(state.save.tick ?? 0)}-${action.toTeamId}-${((state.save.tradeInbox ?? []).length + 1)}`,
    fromTeamId,
    toTeamId: action.toTeamId,
    give: action.give as any,
    get: action.get as any,
    createdTick: state.save.tick ?? 0,
    phase: state.save.draft ? "draft" : "season",
    status: "pending",
    message: action.message,
    threadId,
  };

  const toEval = evalOffer(reg, state.save as any, offer, offer.toTeamId);
  const toAccept = toEval.netGain >= (toEval.threshold + toEval.threshold * repPenalty);
  const toDecision = { accept: toAccept, eval: toEval, rationale: toAccept ? "Accepted: meets threshold." : "Rejected: value short." };

  if (!toDecision.accept) {
    // lowball strike if far
    const gap = toDecision.eval.threshold - toDecision.eval.netGain;
    const lowball = gap > 140;

    nextSave = appendOfferToThread(nextSave, threadId, { ...offer, status: "rejected", eval: { to: toDecision.eval, from: evalOffer(reg, state.save as any, offer, fromTeamId) }, rationale: toDecision.rationale });

    const rep2 = {
      score: Math.max(0, rep.score - (lowball ? 0.05 : 0.01)),
      lowballStrikes: rep.lowballStrikes + (lowball ? 1 : 0),
      lastTick: state.save.tick ?? 0,
    };
    nextSave = { ...nextSave, tradeReputation: rep2 };

    // CPU counter if close enough and open
    const built = buildCounterOffer({
      reg,
      save: state.save as any,
      threadId,
      lastOffer: offer,
      counteringTeamId: offer.toTeamId,
      maxCounters: 2,
    });

    if (built.offer) {
      const cpuOffer: any = { ...built.offer, threadId, status: "pending", message: built.rationale };
      nextSave = appendOfferToThread(nextSave, threadId, cpuOffer);
      // also push to inbox as pending
      const inbox = [...(nextSave.tradeInbox ?? [])];
      inbox.unshift(cpuOffer);
      nextSave.tradeInbox = inbox;
    } else {
      nextSave = closeThread(nextSave, threadId);
    }

    const next = { ...state, save: nextSave, lastError: { message: `Trade rejected: ${toDecision.rationale}`, context: { eval: toDecision.eval, offer } } };
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  // accepted: apply immediately
  const fromDecision = acceptDecision(reg, state.save as any, offer, fromTeamId);
  const appliedSave = applyTrade({ reg, save: state.save as any, offer });
  nextSave = appliedSave as any;

  const eval = { from: fromDecision.eval as any, to: toDecision.eval as any };
  const acceptedOffer = { ...offer, status: "accepted", eval, rationale: "Accepted." };

  nextSave = appendOfferToThread(nextSave, threadId, acceptedOffer);
  nextSave = closeThread(nextSave, threadId);

  const inbox = [...(state.save.tradeInbox ?? [])];
  inbox.unshift(acceptedOffer);
  nextSave.tradeInbox = inbox;

  const rep2 = { score: Math.min(1, rep.score + 0.01), lowballStrikes: Math.max(0, rep.lowballStrikes - 1), lastTick: state.save.tick ?? 0 };
  nextSave.tradeReputation = rep2;

  const next = { ...state, save: nextSave, lastError: undefined };
  ctx.setState(next);
  await ctx.save(next);
  return;
}


  const fromDecision = acceptDecision(reg, state.save, offer, fromTeamId);

  // We allow user to send even if it's slightly bad for user, but keep guardrail: show warning in error context
  const eval = { from: fromDecision.eval as any, to: toDecision.eval as any };
  const appliedSave = applyTrade({ reg, save: state.save, offer });

  const inbox = [...(state.save.tradeInbox ?? [])];
  inbox.unshift({ ...offer, status: "accepted", eval, rationale: "Accepted." });

  const next = { ...state, save: { ...appliedSave, tradeInbox: inbox }, lastError: undefined };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "CLOSE_TRADE_THREAD": {
  const nextSave = closeThread(state0.save as any, action.threadId);
  const next = { ...state0, save: nextSave as any };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "COUNTER_TRADE_OFFER": {
  const state = state0;
  const reg = new TableRegistry(state.tables);
  const threads = state.save.tradeThreads ?? {};
  const thread = threads[action.threadId];
  if (!thread) return;

  const last = (thread.offers ?? []).find((o: any) => o.id === action.offerId);
  if (!last) return;

  if ((thread.countersUsed ?? 0) >= 2) {
    const next = { ...state, lastError: { message: "Max counters reached for this negotiation.", context: { threadId: action.threadId } } };
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  const myTeam = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const counter: any = {
    id: `${last.id}-userCounter-${(state.save.tick ?? 0)}`,
    fromTeamId: myTeam,
    toTeamId: thread.otherTeamId,
    give: action.give,
    get: action.get,
    createdTick: state.save.tick ?? 0,
    phase: state.save.draft ? "draft" : "season",
    status: "pending",
    message: "Counteroffer.",
    threadId: action.threadId,
  };

  const toDecision = acceptDecision(reg, state.save as any, counter, counter.toTeamId);
  if (!toDecision.accept) {
    // If close, create CPU counter (bounded) else reject
    const built = buildCounterOffer({
      reg,
      save: state.save as any,
      threadId: action.threadId,
      lastOffer: counter,
      counteringTeamId: counter.toTeamId,
      maxCounters: 2,
    });

    const nextThreads: any = { ...(state.save.tradeThreads ?? {}) };
    const t = nextThreads[action.threadId];
    t.countersUsed = (t.countersUsed ?? 0) + 1;

    let nextSave: any = { ...state.save, tradeThreads: nextThreads };
    if (built.offer) {
      const cpuOffer: any = { ...built.offer, threadId: action.threadId, status: "pending", message: built.rationale };
      nextSave = appendOfferToThread(nextSave, action.threadId, counter);
      nextSave = appendOfferToThread(nextSave, action.threadId, cpuOffer);
    } else {
      nextSave = appendOfferToThread(nextSave, action.threadId, { ...counter, status: "rejected", rationale: toDecision.rationale, eval: { to: toDecision.eval, from: evalOffer(reg, state.save as any, counter, myTeam) } });
      nextSave = closeThread(nextSave, action.threadId);
    }

    const next = { ...state, save: nextSave, lastError: { message: `Counter rejected: ${toDecision.rationale}`, context: toDecision } };
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  // accepted outright
  const fromDecision = acceptDecision(reg, state.save as any, counter, counter.fromTeamId);
  const appliedSave = applyTrade({ reg, save: state.save as any, offer: counter });
  let nextSave: any = appliedSave;
  nextSave = appendOfferToThread(nextSave, action.threadId, { ...counter, status: "accepted", eval: { to: toDecision.eval, from: fromDecision.eval } });
  nextSave = closeThread(nextSave, action.threadId);

  const next = { ...state, save: nextSave, lastError: undefined };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "GENERATE_TRADE_LADDER": {
  const state = state0;
  const reg = new TableRegistry(state.tables);
  const seed = state.save.seed ?? 2026;
  const myTeam = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";

  const offers = buildDraftTradeUpLadder({
    reg,
    save: state.save as any,
    fromTeamId: myTeam,
    toTeamId: action.toTeamId,
    fromPickNo: action.fromPickNo,
    toPickNo: action.toPickNo,
    seed,
  });

  // store ladder offers as pending in inbox (user can accept by selecting one via TradeHub propose -> send)
  // Here we just push them into inbox as "pending" offers from user to partner; acceptance happens via PROPOSE_TRADE if sent.
  const next = { ...state, save: { ...state.save, tradeInbox: [...offers, ...(state.save.tradeInbox ?? [])] } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "RUN_CPU_TRADES_WEEKLY": {
  const reg = new TableRegistry(state0.tables);
  const freq = (state0.save.leagueActivity?.tradeFrequency ?? 0.5);
          const maxTrades = Math.max(0, Math.round(freq * 4));
          const sim = simulateCpuCpuSeasonTrades({ reg, save: state0.save as any, seed: state0.save.seed ?? 2026, maxTradesPerWeek: maxTrades });
  let next: UIState = { ...state0, save: sim.save as any };
  for (const e of sim.events) next = pushDraftNews(next, "League Trade", e); // reuse news pipe; will appear in phone
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "TOGGLE_TRADE_BLOCK_PLAYER": {
  const block = state0.save.tradeBlock ?? { playerIds: [], lastShopTick: 0 };
  const ids = new Set(block.playerIds ?? []);
  const pid = String(action.playerId).replace(/^p:/, "");
  if (!pid) return;
  if (ids.has(pid)) ids.delete(pid);
  else ids.add(pid);

  const next = { ...state0, save: { ...state0.save, tradeBlock: { ...block, playerIds: Array.from(ids) } } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "SHOP_TRADE_BLOCK": {
  const reg = new TableRegistry(state0.tables);
  const seed = state0.save.seed ?? 2026;
  const myTeam = state0.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";
  const block = state0.save.tradeBlock ?? { playerIds: [], lastShopTick: 0 };
  const playerIds = (block.playerIds ?? []).slice(0, 10);

  if (!playerIds.length) {
    const next = { ...state0, lastError: { message: "Trade block is empty.", context: {} } };
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  const offers = generateInboundSeasonOffersFromBlock({
    reg,
    save: state0.save as any,
    userTeamId: myTeam,
    playerIds,
    seed,
    maxOffers: 4,
  });

  const inbox = [...(state0.save.tradeInbox ?? [])];
  for (const o of offers) inbox.unshift(o);

  const next = {
    ...state0,
    save: {
      ...state0.save,
      tradeInbox: inbox,
      tradeBlock: { ...block, lastShopTick: state0.save.tick ?? 0 },
    },
    lastError: undefined,
  };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "SET_LEAGUE_ACTIVITY": {
  const v = Math.max(0, Math.min(1, action.tradeFrequency));
  const next = { ...state0, save: { ...state0.save, leagueActivity: { tradeFrequency: v } } };
  ctx.setState(next);
  await ctx.save(next);
  return;
}

case "PREVIEW_TRADE": {
  const state = state0;
  const reg = new TableRegistry(state.tables);
  const fromTeamId = state.save.franchiseTeamId ?? ui.selectors.franchiseTeamId?.() ?? "Unknown Team";

  try {
    const offer: any = {
      id: `preview-${state.save.tick ?? 0}-${action.toTeamId}`,
      fromTeamId,
      toTeamId: action.toTeamId,
      give: action.give,
      get: action.get,
      createdTick: state.save.tick ?? 0,
      phase: state.save.draft ? "draft" : "season",
      status: "pending",
    };

    const you = evalOffer(reg, state.save as any, offer, fromTeamId);
    const them = evalOffer(reg, state.save as any, offer, offer.toTeamId);

    const next: UIState = {
      ...state,
      tradePreview: {
        offer: { toTeamId: action.toTeamId, give: action.give, get: action.get },
        eval: { you: you as any, them: them as any },
        status: "ready",
      } as any,
    };
    ctx.setState(next);
    // no save (ui-only)
    return;
  } catch (e: any) {
    const next: UIState = {
      ...state,
      tradePreview: {
        offer: { toTeamId: action.toTeamId, give: action.give, get: action.get },
        status: "error",
        error: String(e?.message ?? e),
      } as any,
    };
    ctx.setState(next);
    return;
  }
}

case "CLEAR_TRADE_PREVIEW": {
  const next: UIState = { ...state0, tradePreview: undefined };
  ctx.setState(next);
  return;
}

case "TOGGLE_CONTROL": {
  const lg = state.save.liveGame;
  if (!lg) return state;
  const side = action.payload.side;
  const next = { ...lg };
  if (side === "offense") next.userControlsOffense = !lg.userControlsOffense;
  if (side === "defense") next.userControlsDefense = !lg.userControlsDefense;
  if (side === "mgmt") next.userControlsMgmt = !lg.userControlsMgmt;

  // Lightweight consequences: taking over increases scrutiny; delegating builds trust.
  const rep = state.save.meta?.reputation ?? 50;
  const trustDelta = (side === "mgmt" ? 1 : 2) * (next.userControlsOffense || next.userControlsDefense ? -1 : 1);
  const mediaDelta = (next.userControlsOffense || next.userControlsDefense ? 2 : -1);

  const meta = {
    ...(state.save.meta ?? {}),
    reputation: rep,
    coordinatorTrust: clampInt((state.save.meta?.coordinatorTrust ?? 50) + trustDelta, 0, 100),
    mediaScrutiny: clampInt((state.save.meta?.mediaScrutiny ?? 50) + mediaDelta, 0, 100),
  };

  return { ...state, save: { ...state.save, liveGame: next, meta } };
}
case "RESET_SAVE": {
        ctx.clearSave();
        const fresh = createInitialState();
        ctx.setState(fresh);
        await dispatchAction(ctx, { type: "LOAD_BUNDLE_ASSETS" });
        return;
      }

case "SCOUT_PLAYER": {
  const state0 = ctx.getState();
  const reg = makeRegistry(state0.tables);
  const playerId = action.playerId;

  const userTeamId = (state0.save.franchiseTeamId ?? state0.save.userTeamId ?? "") as string;
  if (!userTeamId) {
    ctx.setState({ ...state0, lastError: { message: "No userTeamId for scouting", context: { action } } });
    return;
  }

  // Budget: scouting uses staff budget (v1): $0.5M per action.
  const costM = 0.5;
  const budgetMap = { ...(state0.save.staffBudgetM ?? {}) } as any;
  const cur = Number(budgetMap[userTeamId] ?? 0);
  if (cur < costM) {
    ctx.setState({ ...state0, lastError: { message: "Insufficient staff budget to scout", context: { teamId: userTeamId, needM: costM, haveM: cur } } });
    return;
  }

  let save1: any = { ...state0.save, staffBudgetM: { ...budgetMap, [userTeamId]: Math.round((cur - costM) * 10) / 10 } };

  // Ensure hidden talent exists (truth) then ensure a report exists.
  const guess = baseOvrGuessFor(reg, playerId);
  save1 = getOrInitTalent(save1, playerId, guess);

  const trueTalent = Number((save1.playerTalent ?? {})[playerId] ?? guess);
  save1 = ensureScoutingReport(save1, userTeamId, playerId, trueTalent, "GEN", save1.staff);

  // Invest: shrink sigma faster deterministically.
  save1 = investScout(save1, userTeamId, playerId, 3);

  // Phone beat
  const note = `Scouting update: new intel on ${playerId}.`;
  const msg = { id: `scout:${Date.now()}:${playerId}`, threadId: "scouting", from: "Director of Scouting", body: note, ts: Date.now() };
  const phone = { ...(save1.phone ?? { threads: {}, messages: {} }) };
  phone.threads = { ...(phone.threads ?? {}), scouting: { id: "scouting", title: "Scouting Dept", lastTs: msg.ts, unread: true } };
  phone.messages = { ...(phone.messages ?? {}), [msg.id]: msg };
  save1 = { ...save1, phone };

  ctx.setState({ ...state0, save: save1 });
  return;
}

      default:
        return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const next: UIState = {
      ...state0,
      route: { key: "Error", message, context: action },
      lastError: { message, stack: error instanceof Error ? error.stack : undefined, context: action },
      save: { ...state0.save, lastError: { message, stack: error instanceof Error ? error.stack : undefined, context: action } },
    };
    ctx.setState(next);
    await ctx.save(next);
  }
}

export function createInitialState(): UIState {
  const route: Route = { key: "Hub" };
  return {
    route,
    history: [],
    tables: {},
    style: null,
    save: {
      schemaVersion: 18,
    leagueStartYear: 2026,
    leagueYear: 2026,
    rightsOwned: {},
    teamNeedAdjustments: {},
    ownerConfidence: {},
    week: 1,
    playerDevState: {},
    playerTalent: {},
    playerPff: {},
    unitPff: {},
    scouting: { reportsByTeam: {} },
    playerDevPoints: {},
      route,
      history: [],
      seed: 2026,
      tick: 0,
      draftResults: {},
      hires: {},
      phoneRead: {},
    tradeInbox: [],
    tradeThreads: {},
    tradeReputation: { score: 0.5, lowballStrikes: 0, lastTick: 0 },
    pickInventory: {},
    tradeBlock: { playerIds: [], lastShopTick: 0 },
    leagueActivity: { tradeFrequency: 0.5 },
      coachingEvents: [],
      coachingResolutions: {},
      pendingHire: null,
    },
  };
}

export async function stampChecksum(state: UIState): Promise<UIState> {
  const checksum = await sha256Hex(canonicalStringify({ ...state.save, checksum: undefined }));
  return { ...state, save: { ...state.save, checksum } };
}

export function getRegistry(state: UIState) {
  return new TableRegistry(state.tables);
}case "RESTRUCTURE_PLAYER": {
  const state0 = ensureLoaded(state);
  const reg = ctx.registry();
  const startYear = state0.save.leagueStartYear ?? 2026;
  const currentYear = state0.save.leagueYear ?? startYear;

  const baseRows = reg.getTable("Roster") as any[];
  const adds = ((state0.save as any).rosterAdditions ?? []) as any[];
  const override = (state0.save.playerTeamOverride ?? {}) as Record<string, string>;
  const id = String(action.personId);

  const baseRow = baseRows.find((r) => String(r["Player ID"] ?? "") === id);
  const addRow = adds.find((r) => String(r["Player ID"] ?? "") === id);
  const row0 = addRow ?? baseRow;
  if (!row0) {
    const next = withError(state0, "Restructure failed: player not found", { personId: id });
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  const teamId = override[id] ?? String(row0.Team ?? "");
  const overrideMap = (state0.save.playerTeamOverride ?? {}) as Record<string, string>;
  const effective = { ...row0, Team: overrideMap[id] ?? String((row0 as any).Team ?? "") };
  const view = buildPlayerContractView(reg, effective, startYear, currentYear) as any;
  if (!view) {
    const next = withError(state0, "Restructure failed: contract view not available", { personId: id });
    ctx.setState(next);
    await ctx.save(next);
    return;
  }

  const idxYear = Math.max(0, Math.min(view.contract.years - 1, currentYear - view.contract.startYear));
  const beforeHit = contractCapHit(view.contract, idxYear);

  const amount = Math.max(0, action.amountM) * 1_000_000;
  const nextContract = restructureConvertBaseToBonus(view.contract, idxYear, amount);
  const afterHit = contractCapHit(nextContract, idxYear);

  // Persist as override contract blob keyed by playerId (v1)
  const contractOverrides = { ...(state0.save.contractOverrides ?? {}) };
  contractOverrides[id] = nextContract;

  // Cap delta: team cap hits decrease by (before-after) this year. Future pain already embedded in proration, but we model as immediate delta only.
  const delta = afterHit - beforeHit; // usually negative
  let save1: any = { ...state0.save, contractOverrides };
  save1 = applyCapDelta(save1, teamId, { capHitsDelta: delta });

  const next = { ...state0, save: save1 };
  ctx.setState(next);
  await ctx.save(next);
  return;
}
        // Player development (hidden): coaches + performance proxy + work ethic.
        save1 = applyWeeklyDevelopment(reg, save1, save1.staff);

function baseOvrGuessFor(reg: any, playerId: string): number {
  const tables = ["Roster", "2026 Draft Class", "Prospects", "Draft Class"];
  for (const name of tables) {
    const t = reg.getTable(name) as any[];
    for (const r of t) {
      const pid = String((r as any)["Player ID"] ?? (r as any).playerId ?? (r as any).id ?? "").trim();
      if (pid && pid === playerId) {
        const v = Number((r as any).OVR ?? (r as any).Overall ?? (r as any).grade ?? (r as any).Grade ?? 70);
        if (Number.isFinite(v)) return v;
      }
    }
  }
  return 70;
}




function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function teamProxyFromSave(save: any, teamId: string): { off: number; def: number } {
  const r = save.teamRatings?.[teamId];
  return {
    off: typeof r?.offense === "number" ? r.offense : 70,
    def: typeof r?.defense === "number" ? r.defense : 70,
  };
}

function pickOffFallback(rng: any): string {
  return rng.pick(OFF_CORE40).full;
}
function pickDefFallback(rng: any): string {
  return rng.pick(DEF_CORE40).full;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function resolveSnap(rng: any, offProxy: any, defProxy: any, offCall: string, defCall: string, stress: number) {
  const isPass = /Scat|PlayAction|RPO|Mesh|Verts|Cross|Dig|Levels|Shallow|Smash|YCross|Stick|Flood|Sail|Post/i.test(offCall);
  const baseYards = isPass ? 6 : 4;
  const offEdge = (offProxy.off - defProxy.def) / 20;
  const defAgg = /Zero|Mug|Overload|Blitz|Sim|Creeper/i.test(defCall) ? 0.12 : 0.0;
  const complexity = (isPass ? 1.0 : 0.7) + (offCall.includes("Jet") || offCall.includes("Orbit") ? 0.2 : 0);

  const bustProb = clamp(0.03 + complexity * 0.02 + (stress / 100) * 0.06, 0, 0.25);
  const sackProb = isPass ? clamp(0.05 + defAgg + (1 - clamp(offEdge + 0.5, 0, 1)) * 0.06, 0, 0.22) : 0.01;
  const turnoverProb = isPass ? 0.02 + defAgg * 0.04 : 0.01;
  const bigPlayProb = isPass ? clamp(0.05 + offEdge * 0.06 - defAgg * 0.02, 0.01, 0.18) : clamp(0.04 + offEdge * 0.04, 0.01, 0.14);

  const busted = rng.next() < bustProb;
  const sacked = isPass && rng.next() < sackProb;
  const turnover = rng.next() < turnoverProb ? (isPass ? "INT" : "FUM") : undefined;

  let yards = Math.round(baseYards + offEdge * 6 + (rng.next() - 0.5) * 6);
  if (busted) yards = Math.round(yards - (2 + rng.next() * 5));
  if (sacked) yards = -Math.round(4 + rng.next() * 5);
  if (turnover) yards = 0;
  if (!busted && rng.next() < bigPlayProb) yards += Math.round(8 + rng.next() * 25);
  yards = clamp(yards, -12, 55);

  const note = turnover ? `${turnover}!` : sacked ? "Sack" : busted ? "Bust" : yards >= 20 ? "Explosive" : yards <= 0 ? "Stuffed" : "Normal";
  const penalty = rng.next() < clamp(0.03 + (stress / 100) * 0.04 + (defAgg > 0 ? 0.01 : 0), 0, 0.18);

  return { yards, type: isPass ? "PASS" : "RUN", turnover, sack: sacked, penalty, note };
}

function finalizeUserGame(save: any, lg: any): any {
  const week = lg.week;
  const result = { gameId: lg.gameId, home: lg.homeTeamId, away: lg.awayTeamId, homeScore: lg.homeScore, awayScore: lg.awayScore };
  const lastWeekResults = { ...(save.lastWeekResults ?? {}), [week]: [...(save.lastWeekResults?.[week] ?? []), result] };
  const nextWeek = Math.min(18, (save.leagueWeek ?? week) + 1);
  return { ...save, lastWeekResults, leagueWeek: nextWeek, liveGame: null };
}
