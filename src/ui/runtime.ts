import { STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import { gameActions } from "@/engine/actions";
import { advanceDay, getAdvanceBlocker } from "@/engine/advance";
import type { GameState, StaffAssignment, Thread } from "@/engine/gameState";
import { createNewGameState, reduceGameState } from "@/engine/reducer";
import { generateBeatTasks } from "@/engine/tasks";
import { generateImmediateMessagesFromEvent } from "@/engine/phone";
import { getScoutablePositions } from "@/engine/scouting";
import { HOMETOWN_CLOSEST_TEAM } from "@/data/hometownToTeam";
import { HOMETOWNS } from "@/data/hometowns";
import { INTERVIEW_QUESTION_BANK } from "@/data/interviewBank";
import { INTERVIEW_SCRIPTS } from "@/data/interviewScripts";
import { deriveGmProfile } from "@/data/gmDerivation";
import { OWNER_PROFILES } from "@/data/ownerProfiles";
import { getOwnerProfile } from "@/data/owners";
import { getUgfTeamByExcelKey, normalizeExcelTeamKey } from "@/data/teamMap";
import { deriveOfferTerms } from "@/engine/offers";
import { FRANCHISES, resolveFranchiseLike } from "@/ui/data/franchises";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";
import type { InterviewInvite, InterviewInviteTier, OpeningInterviewResult, OpeningPath, SaveData, UIAction, UIController, UIState } from "@/ui/types";
import { getLeagueDbHash, loadLeagueRosterForTeam } from "@/services/rosterImport";
import { validateLeagueDb } from "@/services/validateLeagueDb";
import { getCurrentSeason, getTeamSummaryProjectionRows } from "@/data/leagueDb";
import { buildFreeAgentPool, buildTeamRosterRows, calculateCapSummary } from "@/ui/freeAgency/freeAgency";
import { ROSTER_CAP_LIMIT, calculateRosterCap, loadRosterPlayersForTeam } from "@/ui/roster/rosterAdapter";
import { buildCharacterRegistry } from "@/engine/characters";
import { DEFAULT_SALARY_CAP, sumCapByTeam } from "@/engine/cap";
import { clearLocalSave, loadLocalSave, persistLocalSave } from "@/domainE/persistence/localSave";
import { loadCoachFreeAgents, type CoachFreeAgent } from "@/services/staffFreeAgents";
import { buildLeagueCoordinatorAssignments, buildStaffAssignmentsForTeam } from "@/services/staffAssignments";
import { buildExistingContractsIndex, contractRowToCoachContract, createNewCoachContract, findExistingCoachContractRow, salaryForContractInSeason, type CoachContract } from "@/services/coachContracts";
import { hydrateLeagueStaffFromPersonnel, hydrateUserStaffFromTeamBucket } from "@/services/instantStaffFill";
import { runCpuStaffHiring } from "@/services/cpuStaffHiring";

/**
 * Verification Checklist
 * 1) Start New Career -> Create Coach: set name + age + personality + hometown.
 *    Expected: Next button enables and selections persist into save after accepting offer.
 * 2) Flow interviews -> accept offer -> hire OC/DC/STC -> Finalize.
 *    Expected: Route goes to Delegation Setup (not Hub).
 * 3) Select delegation options and continue.
 *    Expected: Hub shows delegation summary pills and Advance Week button state matches blocker panel.
 * 4) With a blocker present, click Advance Week.
 *    Expected: modal shows exact blocker reason and CTA navigates to required route.
 * 5) Refresh browser.
 *    Expected: delegation settings + generated owner/GM characters persist.
 * 6) Corrupt saved league.teamRosters in localStorage (duplicate/mismatched player IDs), then refresh.
 *    Expected: league rebuilds from canonical players/contracts, and advance is blocked if validation still fails.
 * 7) Change LeagueDB JSON to include duplicate playerId, then reload.
 *    Expected: validation modal appears and advance is blocked with "League data invalid. Fix LeagueDB JSON."
 */


function ensureRosterCapState(gameState: GameState): Pick<GameState, "roster" | "cap"> {
  const rosterPlayers = gameState.roster?.players ?? {};
  const deadMoney = gameState.cap?.deadMoney ?? [];
  const capLimit = Number(gameState.cap?.limit ?? gameState.cap?.capLimit ?? ROSTER_CAP_LIMIT);
  const cap = calculateRosterCap(Object.values(rosterPlayers), deadMoney, capLimit);
  return {
    roster: { players: rosterPlayers, warning: gameState.roster?.warning },
    cap: {
      ...gameState.cap,
      ...cap,
      limit: capLimit,
      deadMoney,
    },
  };
}


function ensureCharacterRegistryState(gameState: GameState): Pick<GameState, "characters" | "teamFrontOffice"> {
  const hasRegistry = Object.keys(gameState.characters?.byId ?? {}).length > 0;
  const teamKey = resolveTeamKey(gameState.franchise?.ugfTeamKey || gameState.franchise?.excelTeamKey || "");
  if (hasRegistry || !teamKey) {
    return {
      characters: gameState.characters ?? { byId: {}, coachId: null, ownersByTeamKey: {}, gmsByTeamKey: {} },
      teamFrontOffice: gameState.teamFrontOffice ?? {},
    };
  }

  const registry = buildCharacterRegistry({
    leagueSeed: gameState.world?.leagueSeed ?? gameState.time.season,
    coachName: gameState.coach.name || "You",
    coachAge: gameState.coach.age ?? 35,
    coachPersonality: gameState.coach.personalityBaseline || "Assertive Leader",
    userTeamKey: teamKey,
  });
  return {
    characters: {
      byId: registry.byId,
      coachId: registry.coachId,
      ownersByTeamKey: registry.ownersByTeamKey,
      gmsByTeamKey: registry.gmsByTeamKey,
    },
    teamFrontOffice: registry.teamFrontOffice,
  };
}

function loadSave(): { save: SaveData | null; corrupted: boolean } {
  return loadLocalSave();
}


function getAdvanceAvailability(save: SaveData | null): { canAdvance: boolean; message?: string; route?: UIState["route"] } {
  if (!save) {
    return { canAdvance: false, message: "Load or start a save before advancing the day.", route: { key: "Start" } };
  }

  const blocked = getAdvanceBlocker(save.gameState);
  if (!blocked) return { canAdvance: true };
  return { canAdvance: false, message: blocked.message, route: blocked.route };
}

function assertAdvanceRoutingInvariant(save: SaveData | null): void {
  if (!import.meta.env.DEV || !save) return;
  const availability = getAdvanceAvailability(save);
  const blocked = getAdvanceBlocker(save.gameState);
  const expected = blocked
    ? { canAdvance: false, message: blocked.message, routeKey: blocked.route.key }
    : { canAdvance: true, message: undefined, routeKey: undefined };

  const actual = {
    canAdvance: availability.canAdvance,
    message: availability.message,
    routeKey: availability.route?.key,
  };

  console.assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    "[runtime] blocker mismatch between Hub selector and advance handler",
    { actual, expected },
  );

  if (availability.route) {
    const routeKey = availability.route.key;
    const knownRoute = routeKey === "Start" || routeKey === "CreateCoach" || routeKey === "CoachBackground" || routeKey === "Interviews" || routeKey === "OpeningInterview" || routeKey === "Offers" || routeKey === "HireCoordinators" || routeKey === "StaffMeeting" || routeKey === "DelegationSetup" || routeKey === "Hub" || routeKey === "StaffTree" || routeKey === "HireMarket" || routeKey === "CandidateDetail" || routeKey === "PhoneInbox" || routeKey === "PhoneThread" || routeKey === "FreeAgency" || routeKey === "Roster";
    console.assert(knownRoute, "[runtime] unknown route key for advance blocker CTA", availability.route);
  }
}

function runBootAdvanceSelfCheck(save: SaveData | null): void {
  if (!import.meta.env.DEV) return;

  const checks: Array<{ name: string; ok: boolean; details: string }> = [];

  const makeSyntheticSave = (stage: "post_offer" | "post_hire" | "post_delegation"): SaveData => {
    let gameState = createNewGameState();
    gameState = reduceGameState(gameState, gameActions.acceptOffer("ATLANTA_APEX", normalizeExcelTeamKey("Atlanta Apex")));

    if (stage === "post_hire" || stage === "post_delegation") {
      gameState = {
        ...gameState,
        staff: {
          ...gameState.staff,
          assignments: {
            ...gameState.staff.assignments,
            OC: { candidateId: "oc-1", coachName: "OC One", salary: 1_000_000, years: 2, hiredWeek: 1 },
            DC: { candidateId: "dc-1", coachName: "DC One", salary: 1_000_000, years: 2, hiredWeek: 1 },
            STC: { candidateId: "st-1", coachName: "ST One", salary: 1_000_000, years: 2, hiredWeek: 1 },
          },
        },
      };
    }

    if (stage === "post_delegation") {
      gameState = {
        ...gameState,
        delegation: { ...gameState.delegation, setupComplete: true },
      };
    }

    return { version: 1, gameState };
  };

  const postOffer = makeSyntheticSave("post_offer");
  const offerAvailability = getAdvanceAvailability(postOffer);
  checks.push({ name: "post_offer_blocked", ok: !offerAvailability.canAdvance, details: offerAvailability.message ?? "missing message" });

  const postHire = makeSyntheticSave("post_hire");
  const hireAvailability = getAdvanceAvailability(postHire);
  checks.push({
    name: "post_hire_delegation_blocker",
    ok: !hireAvailability.canAdvance && hireAvailability.route?.key === "DelegationSetup",
    details: `${hireAvailability.message ?? "none"} -> ${hireAvailability.route?.key ?? "none"}`,
  });

  const postDelegation = makeSyntheticSave("post_delegation");
  const delegationAvailability = getAdvanceAvailability(postDelegation);
  checks.push({
    name: "post_delegation_route",
    ok: initialRoute(postDelegation).key === "Hub",
    details: `initialRoute=${initialRoute(postDelegation).key}`,
  });
  checks.push({
    name: "post_delegation_advance_selector_parity",
    ok: delegationAvailability.canAdvance === (getAdvanceBlocker(postDelegation.gameState) === null),
    details: `canAdvance=${delegationAvailability.canAdvance}`,
  });

  if (save) {
    const availability = getAdvanceAvailability(save);
    checks.push({
      name: "loaded_save_selector_parity",
      ok: availability.canAdvance === (getAdvanceBlocker(save.gameState) === null),
      details: `route=${availability.route?.key ?? "none"}`,
    });
  }

  const failures = checks.filter((check) => !check.ok);
  console.log(`[runtime] opening-flow self-check: ${checks.length - failures.length}/${checks.length} passed`, {
    checks,
    sample: "[runtime] opening-flow self-check: 5/5 passed",
  });
}



function shouldPreserveSaveOnlyEntity(entity: unknown): boolean {
  const marker = entity as Record<string, unknown> | null;
  if (!marker) return false;
  return marker.userCreated === true || marker.transaction === true || marker.createdByTransaction === true;
}

function rebuildLeagueDerivedMaps(playersById: GameState["league"]["playersById"]): Pick<GameState["league"], "teamRosters" | "cap"> {
  const teamRosters: Record<string, string[]> = {};
  for (const player of Object.values(playersById)) {
    const teamKey = String(player.teamKey ?? "");
    if (!teamKey) continue;
    if (!teamRosters[teamKey]) teamRosters[teamKey] = [];
    teamRosters[teamKey].push(player.id);
  }
  return {
    teamRosters,
    cap: {
      salaryCap: DEFAULT_SALARY_CAP,
      capUsedByTeam: sumCapByTeam(playersById),
    },
  };
}

function mergeSaveLeagueDeltas(canonicalLeague: GameState["league"], saveLeague: GameState["league"] | undefined): GameState["league"] {
  const mergedPlayersById = { ...canonicalLeague.playersById };
  const mergedContractsById = { ...canonicalLeague.contractsById };

  for (const [playerId, player] of Object.entries(saveLeague?.playersById ?? {})) {
    if (mergedPlayersById[playerId]) continue;
    if (!shouldPreserveSaveOnlyEntity(player)) continue;
    mergedPlayersById[playerId] = player;
  }

  for (const [contractId, contract] of Object.entries(saveLeague?.contractsById ?? {})) {
    if (mergedContractsById[contractId]) continue;
    if (!shouldPreserveSaveOnlyEntity(contract)) continue;
    mergedContractsById[contractId] = contract;
  }

  const derived = rebuildLeagueDerivedMaps(mergedPlayersById);
  return {
    ...canonicalLeague,
    playersById: mergedPlayersById,
    contractsById: mergedContractsById,
    teamRosters: derived.teamRosters,
    cap: {
      salaryCap: Number(canonicalLeague.cap?.salaryCap ?? DEFAULT_SALARY_CAP),
      capUsedByTeam: derived.cap.capUsedByTeam,
    },
  };
}

async function hydrateLeagueFromCanonical(gameState: GameState): Promise<GameState> {
  const teamKey = gameState.franchise.ugfTeamKey || gameState.franchise.excelTeamKey || "ATLANTA_APEX";
  const leagueDbHash = getLeagueDbHash();
  const { league: canonicalLeague } = await loadLeagueRosterForTeam({
    teamKey,
    excelTeamKey: gameState.franchise.excelTeamKey,
    season: gameState.time.season || getCurrentSeason(),
    salaryCap: gameState.league?.cap?.salaryCap,
  });

  const savedHash = String(gameState.world?.leagueDbHash ?? "");
  const hashChanged = Boolean(savedHash) && savedHash !== leagueDbHash;
  const mergedLeague = mergeSaveLeagueDeltas(canonicalLeague, gameState.league);

  if (hashChanged) {
    console.warn("[runtime] leagueDb hash mismatch. canonical rebuild forced.", { savedHash, leagueDbHash });
  }

  return {
    ...gameState,
    world: {
      ...gameState.world,
      leagueDbVersion: "v1",
      leagueDbHash,
    },
    league: mergedLeague,
  };
}

function createLeagueValidationModal(errors: string[], hasSave: boolean) {
  return {
    title: "League Data Errors",
    message: errors.slice(0, 5).join("\n") + "\nSee console for full list",
    actions: [
      { label: hasSave ? "Go to Hub" : "Go to Start", action: { type: "NAVIGATE", route: hasSave ? { key: "Hub" as const } : { key: "Start" as const } } },
      { label: "Close", action: { type: "CLOSE_MODAL" } },
    ],
  };
}

function assertCityTeamLeagueInvariants(save: SaveData | null): void {
  if (!import.meta.env.DEV || !save) return;
  const league = save.gameState.league;
  const teamIds = new Set(Object.keys(league.teamsById ?? {}));

  for (const teamKey of Object.keys(league.teamRosters ?? {})) {
    if (!teamIds.has(teamKey)) {
      console.warn("[runtime] teamRosters contains non-CITY_TEAM key missing from teamsById", { teamKey });
    }
  }

  for (const player of Object.values(league.playersById ?? {})) {
    const teamKey = String(player.teamKey ?? "");
    if (teamKey && teamKey !== "FREE_AGENT" && !teamIds.has(teamKey)) {
      console.warn("[runtime] player.teamKey not found in teamsById", { playerId: player.id, teamKey });
    }
  }

  for (const [season, picks] of Object.entries(league.draftOrderBySeason ?? {})) {
    for (const pick of picks) {
      if (!teamIds.has(String(pick.teamId ?? ""))) {
        console.warn("[runtime] draftOrder pick teamId not found in teamsById", { season, round: pick.round, pick: pick.pick, teamId: pick.teamId });
      }
    }
  }
}

function getLeagueValidationErrors(save: SaveData | null): string[] {
  if (!save) return [];
  const errors = validateLeagueDb(save.gameState.league);
  if (errors.length) {
    console.error("[runtime] League Data Errors", errors);
  }
  return errors;
}

function runLeagueValidation(save: SaveData | null): ReturnType<typeof createLeagueValidationModal> | null {
  const errors = getLeagueValidationErrors(save);
  if (!errors.length) return null;
  if (!import.meta.env.DEV) return null;
  return createLeagueValidationModal(errors, Boolean(save));
}

function createLeagueInvalidAdvanceModal(errors: string[]) {
  return {
    title: "League Data Invalid",
    message: ["League data invalid. Fix LeagueDB JSON.", ...errors.slice(0, 3)].join("\n"),
    actions: [
      { label: "Go to Hub", action: { type: "NAVIGATE", route: { key: "Hub" as const } } },
      { label: "Close", action: { type: "CLOSE_MODAL" } },
    ],
  };
}

function openingState(): UIState["ui"]["opening"] {
  return {
    openingPath: "FIXED_TRIAD",
    coachName: "",
    coachAge: 35,
    coachPersonality: "Assertive Leader",
    background: "Offensive Coordinator → Head Coach",
    hometownId: "",
    hometownLabel: "",
    hometownTeamKey: "",
    interviewInvites: [],
    interviewResults: {},
    offers: [],
    lastOfferError: undefined,
    lastInterviewError: undefined,
    coordinatorChoices: {},
  };
}

function initialRoute(save: SaveData | null): UIState["route"] {
  if (!save) return { key: "Start" };
  if (!save.gameState.delegation?.setupComplete) return { key: "DelegationSetup" };
  return { key: "Hub" };
}

function ensureThreads(state: GameState): Thread[] {
  if (state.inbox.length) return state.inbox;
  return [
    { id: "owner", title: "Owner", unreadCount: 1, messages: [{ id: "owner-1", from: "Owner", text: "Welcome to the job. Set your offseason priorities.", ts: new Date().toISOString() }] },
    { id: "gm", title: "GM", unreadCount: 1, messages: [{ id: "gm-1", from: "GM", text: "Let me know which coordinators you want to target.", ts: new Date().toISOString() }] },
  ];
}



function sortedFranchises(): typeof FRANCHISES {
  return [...FRANCHISES].sort((a, b) => a.fullName.localeCompare(b.fullName));
}

type InterviewTierMetadata = {
  descriptor: string;
  pressureDescriptor: string;
};

type TeamInviteMetrics = {
  overall: number;
  capSpace: number | null;
};

const INTERVIEW_SUMMARY_BY_TIER: Record<InterviewInviteTier, InterviewTierMetadata> = {
  REBUILD: { descriptor: "Weak roster", pressureDescriptor: "Short patience risk" },
  FRINGE: { descriptor: "Some talent", pressureDescriptor: "Clear gaps" },
  CONTENDER: { descriptor: "Strong roster", pressureDescriptor: "Win-now pressure" },
};

function clampRating(value: number): number {
  return Math.max(0, Math.min(100, value));
}

type ChoiceId = "A" | "B" | "C";

type InterviewDelta = { owner: number; gm: number; risk: number };

function getScriptForTeam(teamLookup: string) {
  const resolved = resolveTeamKey(teamLookup);
  return INTERVIEW_SCRIPTS[teamLookup] ?? INTERVIEW_SCRIPTS[resolved] ?? INTERVIEW_SCRIPTS.ATLANTA_APEX;
}

function sumChoiceTraitMods(
  traits: string[],
  traitMods: Record<string, Partial<Record<ChoiceId, InterviewDelta>>> | undefined,
  choiceId: ChoiceId,
): InterviewDelta {
  if (!traitMods) return { owner: 0, gm: 0, risk: 0 };
  return traits.reduce(
    (acc, trait) => {
      const delta = traitMods[trait]?.[choiceId];
      if (!delta) return acc;
      return {
        owner: acc.owner + delta.owner,
        gm: acc.gm + delta.gm,
        risk: acc.risk + delta.risk,
      };
    },
    { owner: 0, gm: 0, risk: 0 } satisfies InterviewDelta,
  );
}

function generateOffersFromInterviewResults(interviewInvites: InterviewInvite[], interviewResults: Record<string, OpeningInterviewResult>): InterviewInvite[] {
  const scored = interviewInvites
    .map((invite) => {
      const result = interviewResults[invite.franchiseId];
      const script = getScriptForTeam(invite.franchiseId);
      const teamScore = (result?.ownerOpinion ?? 50) + (result?.gmOpinion ?? 50) - (result?.risk ?? 50);
      const offerEligible =
        (result?.ownerOpinion ?? 50) >= script.thresholds.ownerMin &&
        (result?.gmOpinion ?? 50) >= script.thresholds.gmMin &&
        (result?.risk ?? 50) <= script.thresholds.maxRisk;
      return { invite, teamScore, offerEligible };
    })
    .sort((a, b) => b.teamScore - a.teamScore || a.invite.franchiseId.localeCompare(b.invite.franchiseId));

  const eligible = scored.filter((entry) => entry.offerEligible);
  const bestScore = scored[0]?.teamScore ?? 0;
  let offerCount = 1;
  if (eligible.length >= 3 && bestScore >= 140) offerCount = 3;
  else if (eligible.length >= 2 && bestScore >= 120) offerCount = 2;

  const prioritized = [...eligible, ...scored.filter((entry) => !entry.offerEligible)];
  return prioritized.slice(0, offerCount).map((entry) => entry.invite);
}

function generateOpeningOffersWithFallback(
  interviewInvites: InterviewInvite[],
  interviewResults: Record<string, OpeningInterviewResult>,
): { offers: InterviewInvite[]; error?: string } {
  if (!interviewInvites.length) {
    return { offers: [], error: "No interview invites were found. Please return to interviews and try again." };
  }

  try {
    const offers = generateOffersFromInterviewResults(interviewInvites, interviewResults);
    if (offers.length > 0) return { offers };

    const fallback = [...interviewInvites]
      .map((invite) => {
        const result = interviewResults[invite.franchiseId];
        const teamScore = (result?.ownerOpinion ?? 50) + (result?.gmOpinion ?? 50) - (result?.risk ?? 50);
        return { invite, teamScore };
      })
      .sort((a, b) => b.teamScore - a.teamScore || a.invite.franchiseId.localeCompare(b.invite.franchiseId))[0]?.invite;

    if (fallback) {
      return {
        offers: [fallback],
        error: "Offer generation fallback applied. Showing top team by interview score.",
      };
    }

    return { offers: [], error: "Offer generation failed. No teams were available." };
  } catch (error) {
    console.error("[runtime] opening offer generation failed", error);
    return { offers: [], error: "Offer generation failed due to a runtime error. Please return to interviews." };
  }
}

function formatCapSpace(value: number | null): string {
  if (value === null) return "N/A";

  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function buildSummaryLine(teamKey: string, tier: InterviewInviteTier, capSpace: number | null): string {
  const meta = INTERVIEW_SUMMARY_BY_TIER[tier];
  const owner = getOwnerProfile(teamKey);
  const terms = deriveOfferTerms(tier, owner);
  return `${meta.descriptor} • Cap Space: ${formatCapSpace(capSpace)} • ${terms.years}y • ${terms.pressure} pressure • ${terms.mandate}`;
}

function buildTeamInviteMetricsByTeamKey(leagueSeed: number): Map<string, TeamInviteMetrics> {
  const metricsByTeamKey = new Map<string, TeamInviteMetrics>();
  const rows = getTeamSummaryProjectionRows(getCurrentSeason(), leagueSeed);

  for (const row of rows) {
    const teamKey = resolveTeamKey(row.teamId);
    metricsByTeamKey.set(teamKey, {
      overall: Number(row.OVERALL ?? 0),
      capSpace: Number.isFinite(Number(row["Cap Space"])) ? Number(row["Cap Space"]) : null,
    });
  }

  return metricsByTeamKey;
}

function rankTeamsByOverall(
  metricsByTeamKey: Map<string, TeamInviteMetrics>,
): Array<{ teamKey: string; overall: number; rank: number; tier: InterviewInviteTier }> {
  const ranked = sortedFranchises()
    .map((franchise) => ({
      teamKey: resolveTeamKey(franchise.fullName),
      overall: metricsByTeamKey.get(resolveTeamKey(franchise.fullName))?.overall ?? 0,
    }))
    .sort((a, b) => a.overall - b.overall || a.teamKey.localeCompare(b.teamKey));

  return ranked.map((team, index) => {
    const isBottomFive = index < 5;
    const isTopTen = index >= ranked.length - 10;
    const tier: InterviewInviteTier = isBottomFive ? "REBUILD" : isTopTen ? "CONTENDER" : "FRINGE";
    return { ...team, rank: index + 1, tier };
  });
}

function pickFirstAvailable(
  candidates: Array<{ teamKey: string; overall: number; rank: number; tier: InterviewInviteTier }>,
  selected: Set<string>,
): { teamKey: string; overall: number; rank: number; tier: InterviewInviteTier } | null {
  for (const candidate of candidates) {
    if (!selected.has(candidate.teamKey)) return candidate;
  }
  return null;
}

function buildInvite(
  team: { teamKey: string; overall: number; tier: InterviewInviteTier },
  metricsByTeamKey: Map<string, TeamInviteMetrics>,
): InterviewInvite {
  const franchiseId = resolveTeamKey(team.teamKey);
  const capSpace = metricsByTeamKey.get(franchiseId)?.capSpace ?? null;

  return {
    franchiseId,
    tier: team.tier,
    overall: team.overall,
    summaryLine: buildSummaryLine(franchiseId, team.tier, capSpace),
  };
}

function generateInterviewInvites(hometownTeamKey: string, leagueSeed: number): InterviewInvite[] {
  const metricsByTeamKey = buildTeamInviteMetricsByTeamKey(leagueSeed);
  const ranked = rankTeamsByOverall(metricsByTeamKey);
  if (!hometownTeamKey) {
    console.error("Missing hometownTeamKey for interview invites.");
  }

  const teamsByTier = {
    REBUILD: ranked.filter((team) => team.tier === "REBUILD"),
    FRINGE: ranked.filter((team) => team.tier === "FRINGE"),
    CONTENDER: ranked.filter((team) => team.tier === "CONTENDER"),
  } satisfies Record<InterviewInviteTier, Array<{ teamKey: string; overall: number; rank: number; tier: InterviewInviteTier }>>;

  const selected = new Set<string>();
  const hometown = resolveTeamKey(hometownTeamKey || "UNKNOWN_TEAM");
  selected.add(hometown);

  const hometownTeam = ranked.find((team) => team.teamKey === hometown);
  const invites: InterviewInvite[] = hometownTeam
    ? [buildInvite(hometownTeam, metricsByTeamKey)]
    : [{ franchiseId: hometown, tier: "FRINGE", overall: 0, summaryLine: buildSummaryLine(hometown, "FRINGE", null) }];

  const representedTiers = new Set<InterviewInviteTier>(invites.map((invite) => invite.tier));
  for (const tier of ["REBUILD", "FRINGE", "CONTENDER"] as const) {
    if (invites.length >= 3) break;
    if (representedTiers.has(tier)) continue;
    const picked = pickFirstAvailable(teamsByTier[tier], selected);
    if (!picked) continue;
    selected.add(picked.teamKey);
    invites.push(buildInvite(picked, metricsByTeamKey));
    representedTiers.add(picked.tier);
  }

  while (invites.length < 3) {
    const fallback = pickFirstAvailable(ranked, selected);
    if (!fallback) break;
    selected.add(fallback.teamKey);
    invites.push(buildInvite(fallback, metricsByTeamKey));
  }

  return invites.slice(0, 3);
}

const FIXED_TRIAD: Array<{ teamKey: string; tier: InterviewInviteTier; legendRetiredOpening?: boolean }> = [
  { teamKey: "BIRMINGHAM_VULCANS", tier: "CONTENDER", legendRetiredOpening: true },
  { teamKey: "MILWAUKEE_NORTHSHORE", tier: "REBUILD" },
  { teamKey: "ATLANTA_APEX", tier: "FRINGE" },
];

function generateFixedTriadInvitesWithFallback(
  leagueSeed: number,
  fallbackHometownTeamKey: string,
): { invites: InterviewInvite[]; usedFallback: boolean } {
  try {
    const metricsByTeamKey = buildTeamInviteMetricsByTeamKey(leagueSeed);

    const invites: InterviewInvite[] = FIXED_TRIAD.map(({ teamKey, tier, legendRetiredOpening }) => {
      let franchiseId = resolveTeamKey(teamKey);
      if (franchiseId === "UNKNOWN_TEAM") franchiseId = teamKey;
      const metrics = metricsByTeamKey.get(franchiseId) ?? metricsByTeamKey.get(teamKey);
      if (!metrics) throw new Error(`Missing metrics for fixed triad team: ${franchiseId}`);

      const base = buildSummaryLine(franchiseId, tier, metrics.capSpace ?? null);
      return {
        franchiseId,
        tier,
        overall: metrics.overall ?? 0,
        summaryLine: legendRetiredOpening ? `${base} • Legend retired opening` : base,
        legendRetiredOpening,
      };
    });

    const uniq = new Map(invites.map((invite) => [invite.franchiseId, invite]));
    if (uniq.size !== invites.length) throw new Error("Duplicate fixed triad franchiseId");

    return { invites, usedFallback: false };
  } catch (err) {
    console.warn("[runtime] fixed triad generation failed; falling back to fixed triad keys for display", err);
    const metricsByTeamKey = buildTeamInviteMetricsByTeamKey(leagueSeed);
    const fallbackInvites: InterviewInvite[] = FIXED_TRIAD.map(({ teamKey, tier, legendRetiredOpening }) => {
      const franchiseId = teamKey;
      const metrics = metricsByTeamKey.get(teamKey) ?? metricsByTeamKey.get(resolveTeamKey(teamKey)) ?? { overall: 75, capSpace: null };
      const base = buildSummaryLine(franchiseId, tier, metrics.capSpace ?? null);
      return {
        franchiseId,
        tier,
        overall: metrics.overall ?? 0,
        summaryLine: legendRetiredOpening ? `${base} • Legend retired opening` : base,
        legendRetiredOpening,
      };
    });
    return { invites: fallbackInvites, usedFallback: true };
  }
}

function createInitialInterviewResult(franchiseId: string): InterviewResult {
  return {
    franchiseId,
    answers: [],
    ownerOpinion: 0,
    gmOpinion: 0,
    pressureHandling: 0,
    toneFeedback: [],
    complete: false,
  };
}

function applyInterviewAnswer(result: InterviewResult, questionIndex: number, choice: InterviewAnswerChoice): InterviewResult {
  const byQuestion = [
    {
      A: { owner: 2, gm: 1, pressure: 1, tone: "Owner appreciated your long-term vision." },
      B: { owner: -1, gm: 0, pressure: 1, tone: "Owner heard confidence but questioned realism." },
      C: { owner: 1, gm: 1, pressure: 0, tone: "Owner liked your collaborative tone." },
    },
    {
      A: { owner: 0, gm: 2, pressure: 0, tone: "GM responded well to your process-oriented plan." },
      B: { owner: 0, gm: -1, pressure: 1, tone: "GM bristled at the demand for full control." },
      C: { owner: 1, gm: 1, pressure: 0, tone: "GM liked the balanced partnership message." },
    },
    {
      A: { owner: 1, gm: 1, pressure: 2, tone: "Both owner and GM saw calm leadership under pressure." },
      B: { owner: 0, gm: 0, pressure: 1, tone: "They noted urgency, but worried about volatility." },
      C: { owner: 1, gm: 1, pressure: 1, tone: "They saw adaptable leadership and steady judgment." },
    },
  ] as const;

  const deltas = byQuestion[questionIndex][choice];
  const answers = [...result.answers, choice];
  const toneFeedback = [...result.toneFeedback, deltas.tone];

  return {
    ...result,
    answers,
    ownerOpinion: result.ownerOpinion + deltas.owner,
    gmOpinion: result.gmOpinion + deltas.gm,
    pressureHandling: result.pressureHandling + deltas.pressure,
    toneFeedback,
    complete: answers.length >= 3,
  };
}

function generateOffersFromInterviews(invites: InterviewInvite[], results: Record<string, InterviewResult>): InterviewInvite[] {
  const scored = invites
    .map((invite) => {
      const result = results[invite.franchiseId];
      const score = (result?.ownerOpinion ?? 0) + (result?.gmOpinion ?? 0) + (result?.pressureHandling ?? 0);
      return { invite, score };
    })
    .sort((a, b) => b.score - a.score || a.invite.franchiseId.localeCompare(b.invite.franchiseId));

  const count = Math.max(1, Math.min(3, scored.filter((row) => row.score >= 1).length || 1));
  return scored.slice(0, count).map((row) => row.invite);
}


type CandidateRequirement = {
  minScheme?: number;
  minAssistants?: number;
  locksOnHire?: boolean;
  lockAxes?: Array<"SCHEME" | "ASSISTANTS">;
  reason?: string;
};

function sideByRole(role: StaffRole): "offense" | "defense" | "specialTeams" | null {
  if (role === "OC") return "offense";
  if (role === "DC") return "defense";
  if (role === "STC") return "specialTeams";
  return null;
}

function sideLabel(role: StaffRole): string {
  if (role === "OC") return "Offense";
  if (role === "DC") return "Defense";
  if (role === "STC") return "Special Teams";
  return "";
}

function axesLabel(axes: Array<"SCHEME" | "ASSISTANTS">): string {
  const hasScheme = axes.includes("SCHEME");
  const hasAssistants = axes.includes("ASSISTANTS");
  if (hasScheme && hasAssistants) return "Scheme + Assistants";
  if (hasScheme) return "Scheme";
  if (hasAssistants) return "Assistants";
  return "Scheme";
}

function requirementForCandidateId(id: number): CandidateRequirement {
  return id % 4 === 0
    ? { minScheme: 75, minAssistants: 70, locksOnHire: true, lockAxes: ["SCHEME", "ASSISTANTS"], reason: "high-control" }
    : id % 4 === 1
      ? { minScheme: 70, reason: "scheme" }
      : id % 4 === 2
        ? { minAssistants: 65, reason: "assistants" }
        : { reason: "collaborative" };
}

function requirementForAssignmentId(candidateId: string): CandidateRequirement {
  const suffix = Number(String(candidateId).split("-").at(-1));
  return Number.isFinite(suffix) ? requirementForCandidateId(suffix) : {};
}

function createCandidate(role: StaffRole, id: number) {
  const requirement: CandidateRequirement = requirementForCandidateId(id);

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
    requirement,
  };
}

export async function createUIRuntime(onChange: () => void): Promise<UIController> {
  const { save, corrupted } = loadSave();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:createUIRuntime',message:'loadSave result',data:{hasSave:!!save,corrupted,timestamp:Date.now()},timestamp:Date.now(),hypothesisId:'runtime-load'})}).catch(()=>{});
  // #endregion
  const loadedGameStateRaw = save?.gameState
    ? reduceGameState(createNewGameState(), gameActions.loadState(save.gameState))
    : null;
  const loadedHydrated = loadedGameStateRaw ? await hydrateLeagueFromCanonical(loadedGameStateRaw) : null;
  const loadedGameState = loadedHydrated
    ? {
        ...loadedHydrated,
        ...ensureRosterCapState(loadedHydrated),
        ...ensureCharacterRegistryState(loadedHydrated),
        freeAgency: {
          freeAgents: loadedHydrated.freeAgency?.freeAgents ?? [],
          lastUpdatedWeek: loadedHydrated.freeAgency?.lastUpdatedWeek ?? 0,
        },
      }
    : null;

  let state: UIState = {
    route: initialRoute(loadedGameState ? { version: 1, gameState: loadedGameState } : null),
    save: loadedGameState ? { version: 1, gameState: loadedGameState } : null,
    corruptedSave: corrupted,
    ui: { activeModal: null, notifications: [], opening: openingState() },
  };

  runBootAdvanceSelfCheck(state.save);
  assertCityTeamLeagueInvariants(state.save);
  const bootValidationErrors = getLeagueValidationErrors(state.save);
  const bootLeagueValidationModal = runLeagueValidation(state.save);
  if (bootValidationErrors.length && !bootLeagueValidationModal) {
    state = { ...state, ui: { ...state.ui, activeModal: createLeagueInvalidAdvanceModal(bootValidationErrors) } };
  } else if (bootLeagueValidationModal) {
    state = { ...state, ui: { ...state.ui, activeModal: bootLeagueValidationModal } };
  }

  let writeTimer: number | null = null;
  const scheduleSave = () => {
    if (!state.save) return;
    if (writeTimer) window.clearTimeout(writeTimer);
    writeTimer = window.setTimeout(() => {
      if (state.save) persistLocalSave(state.save);
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


  const openAdvanceBlockedModal = (availability: { canAdvance: boolean; message?: string; route?: UIState["route"] }) => {
    if (availability.canAdvance) return;
    console.warn("[runtime] advance blocked", availability);
    const fallbackRoute = availability.route ?? { key: "Hub" as const };
    setState({
      ...state,
      ui: {
        ...state.ui,
        activeModal: {
          title: "Advance Blocked",
          message: availability.message ?? "Advance is currently blocked.",
          actions: [
            { label: "Go to Required Screen", action: { type: "NAVIGATE", route: fallbackRoute } },
            { label: "Close", action: { type: "CLOSE_MODAL" } },
          ],
        },
      },
    });
  };

  const controller: UIController = {
    getState: () => state,
    dispatch: (action: UIAction) => {
      switch (action.type) {
        case "NAVIGATE": {
          const nextRoute = action.route as UIState["route"];
          if (nextRoute.key === "FreeAgency" && state.save) {
            const currentWeek = state.save.gameState.time.week;
            const needsRefresh = !state.save.gameState.freeAgency?.freeAgents?.length || state.save.gameState.freeAgency.lastUpdatedWeek !== currentWeek;
            if (needsRefresh) {
              const freeAgents = buildFreeAgentPool(state.save.gameState);
              const gameState = {
                ...state.save.gameState,
                freeAgency: { freeAgents, lastUpdatedWeek: currentWeek },
                ...ensureRosterCapState(state.save.gameState),
              };
              setState({ ...state, save: { version: 1, gameState }, route: nextRoute, ui: { ...state.ui, activeModal: null } });
              return;
            }
          }
          if (nextRoute.key === "Offers") {
            const allDone =
              state.ui.opening.interviewInvites.length > 0 &&
              state.ui.opening.interviewInvites.every((invite) => state.ui.opening.interviewResults[invite.franchiseId]?.completed);
            if (allDone && state.ui.opening.offers.length === 0) {
              const { offers, error } = generateOpeningOffersWithFallback(state.ui.opening.interviewInvites, state.ui.opening.interviewResults);
              setState({
                ...state,
                route: nextRoute,
                ui: { ...state.ui, activeModal: null, opening: { ...state.ui.opening, offers, lastOfferError: error } },
              });
              return;
            }
          }
          setState({ ...state, route: nextRoute, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "REFRESH_FREE_AGENCY": {
          if (!state.save) return;
          const currentWeek = state.save.gameState.time.week;
          const freeAgents = buildFreeAgentPool(state.save.gameState);
          const gameState = {
            ...state.save.gameState,
            freeAgency: { freeAgents, lastUpdatedWeek: currentWeek },
            ...ensureRosterCapState(state.save.gameState),
          };
          setState({
            ...state,
            save: { version: 1, gameState },
            ui: { ...state.ui, notifications: [`Free agency pool refreshed (${freeAgents.length} players).`, ...state.ui.notifications].slice(0, 3) },
          });
          return;
        }
        case "SIGN_FREE_AGENT": {
          if (!state.save) return;
          const playerId = String(action.playerId ?? "");
          const years = Math.max(1, Math.round(Number(action.years ?? 1)));
          const salary = Math.max(0, Math.round(Number(action.salary ?? 0)));
          const teamKey = resolveTeamKey(state.save.gameState.franchise.ugfTeamKey || state.save.gameState.franchise.excelTeamKey || "");
          const freeAgent = state.save.gameState.freeAgency.freeAgents.find((row) => row.id === playerId);
          if (!freeAgent) return;
          const roster = buildTeamRosterRows(state.save.gameState, teamKey);
          const cap = calculateCapSummary(roster, state.save.gameState.league.cap.salaryCap);
          if (cap.payroll + salary > cap.capLimit) {
            setState({
              ...state,
              ui: {
                ...state.ui,
                activeModal: {
                  title: "Insufficient cap space",
                  message: `Cannot sign ${freeAgent.playerName}. You need more cap space.`,
                  lines: [`Cap Space: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cap.capSpace)}`],
                  actions: [{ label: "Close", action: { type: "CLOSE_MODAL" } }],
                },
              },
            });
            return;
          }

          const updatedFreeAgents = state.save.gameState.freeAgency.freeAgents.filter((row) => row.id !== playerId);
          const signed = { ...freeAgent, years, salary, teamKey, contractStatus: "ACTIVE" as const };
          const leaguePlayer = {
            id: signed.id,
            name: signed.playerName,
            positionGroup: signed.position,
            pos: signed.position,
            teamKey,
            overall: signed.overall,
            age: signed.age,
            contract: { amount: signed.salary, yearsLeft: signed.years, expSeason: state.save.gameState.time.season + signed.years },
          };
          const nextRosters = {
            ...state.save.gameState.league.teamRosters,
            [teamKey]: [...(state.save.gameState.league.teamRosters[teamKey] ?? []), signed.id],
          };
          const gameState = {
            ...state.save.gameState,
            league: {
              ...state.save.gameState.league,
              playersById: { ...state.save.gameState.league.playersById, [signed.id]: leaguePlayer },
              teamRosters: nextRosters,
              cap: {
                ...state.save.gameState.league.cap,
                capUsedByTeam: {
                  ...state.save.gameState.league.cap.capUsedByTeam,
                  [teamKey]: (state.save.gameState.league.cap.capUsedByTeam[teamKey] ?? 0) + signed.salary,
                },
              },
            },
            freeAgency: { freeAgents: updatedFreeAgents, lastUpdatedWeek: state.save.gameState.time.week },
          };
          const withDerived = { ...gameState, ...ensureRosterCapState(gameState) };
          setState({
            ...state,
            save: { version: 1, gameState: withDerived },
            ui: {
              ...state.ui,
              activeModal: null,
              notifications: [`Signed ${signed.playerName} for ${signed.years}y / ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(signed.salary)}.`, ...state.ui.notifications].slice(0, 3),
            },
          });
          return;
        }
        case "INIT_ROSTER_DATA": {
          if (!state.save) return;
          const existingPlayers = Object.keys(state.save.gameState.roster?.players ?? {});
          if (existingPlayers.length > 0) return;
          const teamLookup = state.save.gameState.franchise.ugfTeamKey || state.save.gameState.franchise.excelTeamKey || "";
          void (async () => {
            const { players, warning } = await loadRosterPlayersForTeam(teamLookup, state.save!.gameState.league);
            const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
            const baseGameState = {
              ...state.save!.gameState,
              roster: {
                players: playerMap,
                warning,
              },
              cap: {
                ...state.save!.gameState.cap,
                limit: Number(state.save!.gameState.cap?.limit ?? ROSTER_CAP_LIMIT),
                deadMoney: state.save!.gameState.cap?.deadMoney ?? [],
              },
            };
            const nextGameState = { ...baseGameState, ...ensureRosterCapState(baseGameState) };
            setState({
              ...state,
              save: { version: 1, gameState: nextGameState },
            });
          })().catch((error) => {
            if (import.meta.env.DEV) {
              console.warn("[runtime] INIT_ROSTER_DATA failed", error);
            }
          });
          return;
        }
        case "PROMPT_RELEASE_PLAYER": {
          if (!state.save) return;
          const playerId = String(action.playerId ?? "");
          const player = state.save.gameState.roster?.players?.[playerId];
          if (!player || player.status === "RELEASED") return;
          const estimate = Math.min(player.capHit * 0.4, player.capHit);
          setState({
            ...state,
            ui: {
              ...state.ui,
              activeModal: {
                title: `Release ${player.name}?`,
                message: "This move cannot be undone in this MVP flow.",
                warning: "Releasing this player will create dead cap this season.",
                lines: [`Estimated Dead Cap: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(estimate)}`],
                actions: [
                  { label: "Confirm Release", action: { type: "RELEASE_PLAYER", playerId } },
                  { label: "Cancel", action: { type: "CLOSE_MODAL" } },
                ],
              },
            },
          });
          return;
        }
        case "RELEASE_PLAYER": {
          if (!state.save) return;
          const playerId = String(action.playerId ?? "");
          const player = state.save.gameState.roster?.players?.[playerId];
          if (!player || player.status === "RELEASED") return;
          const deadCap = Math.min(player.capHit * 0.4, player.capHit);
          const nextGameStateBase = {
            ...state.save.gameState,
            roster: {
              ...state.save.gameState.roster,
              players: {
                ...state.save.gameState.roster.players,
                [playerId]: { ...player, status: "RELEASED" as const },
              },
            },
            cap: {
              ...state.save.gameState.cap,
              limit: Number(state.save.gameState.cap?.limit ?? ROSTER_CAP_LIMIT),
              deadMoney: [
                ...(state.save.gameState.cap?.deadMoney ?? []),
                { playerId, amount: deadCap, season: state.save.gameState.time.season },
              ],
            },
          };
          const nextGameState = { ...nextGameStateBase, ...ensureRosterCapState(nextGameStateBase) };
          setState({
            ...state,
            save: { version: 1, gameState: nextGameState },
            ui: {
              ...state.ui,
              activeModal: null,
              notifications: [`Released ${player.name}. Dead cap: ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(deadCap)}.`, ...state.ui.notifications].slice(0, 3),
            },
          });
          return;
        }
        case "RESET_SAVE":
          clearLocalSave();
          setState({ ...state, save: null, route: { key: "Start" }, corruptedSave: false, ui: { ...state.ui, opening: openingState() } });
          return;
        case "FORCE_SAVE":
          if (!state.save) return;
          try {
            if (writeTimer) {
              window.clearTimeout(writeTimer);
              writeTimer = null;
            }
            persistLocalSave(state.save);
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error("[runtime] FORCE_SAVE failed", error);
            }
          }
          return;
        case "SET_OPENING_PATH": {
          const openingPath = String(action.openingPath ?? "") as OpeningPath;
          const safe: OpeningPath = openingPath === "DYNAMIC" ? "DYNAMIC" : "FIXED_TRIAD";
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, openingPath: safe } } });
          return;
        }
        case "SET_COACH_NAME":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachName: String(action.coachName ?? "") } } });
          return;
        case "SET_COACH_AGE":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachAge: Math.max(24, Math.min(85, Number(action.coachAge ?? 35) || 35)) } } });
          return;
        case "SET_COACH_PERSONALITY":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachPersonality: String(action.coachPersonality ?? "Assertive Leader") } } });
          return;
        case "SET_BACKGROUND":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, background: String(action.background ?? "") } } });
          return;
        case "SET_HOMETOWN": {
          const hometownId = String(action.hometownId ?? "");
          const hometown = HOMETOWNS.find((item) => item.id === hometownId);
          const hometownLabel = hometown?.label ?? "";
          let hometownTeamKey = HOMETOWN_CLOSEST_TEAM[hometownId];
          if (!hometownTeamKey) {
            console.error("Missing HOMETOWN_CLOSEST_TEAM entry for", hometownId);
            hometownTeamKey = "UNKNOWN_TEAM";
          }
          setState({
            ...state,
            ui: {
              ...state.ui,
              opening: { ...state.ui.opening, hometownId, hometownLabel, hometownTeamKey },
            },
          });
          return;
        }
        case "RUN_INTERVIEWS": {
          const opening = state.ui.opening;

          const { invites, usedFallback } =
            opening.openingPath === "FIXED_TRIAD"
              ? generateFixedTriadInvitesWithFallback(opening.leagueSeed, opening.hometownTeamKey)
              : { invites: generateInterviewInvites(opening.hometownTeamKey, opening.leagueSeed), usedFallback: false };

          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:RUN_INTERVIEWS',message:'invites generated',data:{openingPath:opening.openingPath,usedFallback,franchiseIds:invites.map((i)=>i.franchiseId)},timestamp:Date.now(),hypothesisId:'interview-invites'})}).catch(()=>{});
          // #endregion
          const interviewInvites = invites;

          const interviewResults = Object.fromEntries(
            interviewInvites.map((invite) => [
              invite.franchiseId,
              {
                franchiseId: invite.franchiseId,
                ownerOpinion: 50,
                gmOpinion: 50,
                risk: 50,
                answers: [],
                completed: false,
                lastToneFeedback: "",
              } satisfies OpeningInterviewResult,
            ]),
          );

          setState({
            ...state,
            ui: {
              ...state.ui,
              opening: {
                ...opening,
                interviewInvites,
                interviewResults,
                offers: [],
                lastOfferError: usedFallback ? "Fixed triad unavailable; using dynamic invites." : undefined,
                lastInterviewError: undefined,
              },
            },
            route: { key: "Interviews" },
          });
          return;
        }
        case "OPENING_START_INTERVIEW": {
          const rawId = String(action.franchiseId ?? "");
          const invite =
            state.ui.opening.interviewInvites.find((item) => item.franchiseId === rawId) ??
            state.ui.opening.interviewInvites.find((item) => item.franchiseId === resolveTeamKey(rawId));
          const franchiseId = invite?.franchiseId ?? resolveTeamKey(rawId);
          if (!invite) {
            if (import.meta.env.DEV) {
              console.error("[runtime] OPENING_START_INTERVIEW invite not found", {
                clickedFranchiseId: franchiseId,
                inviteFranchiseIds: state.ui.opening.interviewInvites.map((item) => item.franchiseId),
              });
            }
            setState({
              ...state,
              route: { key: "Interviews" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastInterviewError: "Unable to open that interview invite. Please try another invite.",
                },
              },
            });
            return;
          }
          const existing = state.ui.opening.interviewResults[franchiseId] ?? {
            franchiseId,
            ownerOpinion: 50,
            gmOpinion: 50,
            risk: 50,
            answers: [],
            completed: false,
            lastToneFeedback: "",
          };
          setState({
            ...state,
            ui: {
              ...state.ui,
              opening: {
                ...state.ui.opening,
                interviewResults: { ...state.ui.opening.interviewResults, [franchiseId]: existing },
                lastInterviewError: undefined,
              },
            },
            route: { key: "OpeningInterview", franchiseId },
          });
          if (import.meta.env.DEV) {
            console.log("[runtime] OPENING_START_INTERVIEW routed", { franchiseId });
          }
          return;
        }
        case "OPENING_ANSWER_INTERVIEW": {
          const rawId = String(action.franchiseId ?? "");
          const invite =
            state.ui.opening.interviewInvites.find((item) => item.franchiseId === rawId) ??
            state.ui.opening.interviewInvites.find((item) => item.franchiseId === resolveTeamKey(rawId));
          const franchiseId = invite?.franchiseId ?? resolveTeamKey(rawId);
          const answerIndex = Number(action.answerIndex ?? -1);
          const current = state.ui.opening.interviewResults[franchiseId];
          if (!invite || !current || current.completed) {
            setState({
              ...state,
              route: { key: "Interviews" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastInterviewError: "Interview state was out of sync. Please re-open your interview invitation.",
                },
              },
            });
            return;
          }

          const script = getScriptForTeam(franchiseId);
          const questionId = script.questionIds[current.answers.length];
          const question = INTERVIEW_QUESTION_BANK[questionId];
          const choice = question?.choices[answerIndex];
          const choiceId = choice?.id;
          if (!question || !choice || !choiceId) {
            setState({
              ...state,
              route: { key: "Interviews" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastInterviewError: "Interview question data was missing. Please re-open the invite and try again.",
                },
              },
            });
            return;
          }

          const scriptTeamKey = resolveTeamKey(franchiseId);
          const ownerProfile =
            (OWNER_PROFILES as Record<string, (typeof OWNER_PROFILES)[keyof typeof OWNER_PROFILES]>)[scriptTeamKey] ?? OWNER_PROFILES.ATLANTA_APEX;
          const teamMetrics = buildTeamInviteMetricsByTeamKey(state.ui.opening.leagueSeed).get(franchiseId) ?? { overall: 70, capSpace: 0 };
          const gmProfile = deriveGmProfile({ overall: teamMetrics.overall, capSpace: teamMetrics.capSpace ?? 0 }, ownerProfile);

          const baseDelta: InterviewDelta = { owner: choice.baseOwner, gm: choice.baseGm, risk: choice.baseRisk };
          const ownerTraitMods = sumChoiceTraitMods(ownerProfile.traits, question.ownerTraitMods, choice.id);
          const gmTraitMods = sumChoiceTraitMods(gmProfile.traits, question.gmTraitMods, choice.id);

          let ownerDelta = baseDelta.owner + ownerTraitMods.owner + gmTraitMods.owner;
          const gmDelta = baseDelta.gm + ownerTraitMods.gm + gmTraitMods.gm;
          const riskDelta = baseDelta.risk + ownerTraitMods.risk + gmTraitMods.risk;

          if (script.specialRules?.volatileOwnerSwing) {
            ownerDelta += choice.id === "A" ? 1 : choice.id === "C" ? -1 : 0;
          }

          const nextRisk = clampRating(current.risk + riskDelta);
          const nextResult: OpeningInterviewResult = {
            ...current,
            ownerOpinion: clampRating(current.ownerOpinion + ownerDelta),
            gmOpinion: clampRating(current.gmOpinion + gmDelta),
            risk: nextRisk,
            answers: [...current.answers, { questionId, choiceId: choice.id }],
            completed: current.answers.length + 1 >= script.questionIds.length,
            lastToneFeedback:
              riskDelta > 0
                ? "Tone: Risk increased."
                : ownerDelta >= gmDelta
                  ? "Tone: Ownership receptive."
                  : "Tone: GM receptive.",
          };

          const interviewResults = { ...state.ui.opening.interviewResults, [franchiseId]: nextResult };
          const allDone =
            state.ui.opening.interviewInvites.length > 0 &&
            state.ui.opening.interviewInvites.every((invite) => interviewResults[invite.franchiseId]?.completed);
          if (allDone) {
            const { offers, error } = generateOpeningOffersWithFallback(state.ui.opening.interviewInvites, interviewResults);
            setState({
              ...state,
              ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults, offers, lastOfferError: error, lastInterviewError: undefined } },
              route: { key: "Offers" },
            });
            return;
          }

          if (nextResult.completed) {
            setState({
              ...state,
              ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults, lastInterviewError: undefined } },
              route: { key: "Interviews" },
            });
            return;
          }

          setState({
            ...state,
            ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults, lastInterviewError: undefined } },
            route: { key: "OpeningInterview", franchiseId },
          });
          return;
        }
        case "ACCEPT_OFFER": {
          const rawId = String(action.franchiseId ?? "");
          const offeredInvite =
            state.ui.opening.offers.find((o) => o.franchiseId === rawId) ??
            state.ui.opening.offers.find((o) => o.franchiseId === resolveTeamKey(rawId));
          const franchiseId = offeredInvite?.franchiseId ?? resolveTeamKey(rawId);
          const offeredTeamKey = String(action.excelTeamKey ?? "");
          const franchise = resolveFranchiseLike(franchiseId);
          const isOffered = Boolean(offeredInvite);
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:ACCEPT_OFFER',message:'dispatch',data:{franchiseId,hasFranchise:!!franchise,isOffered,offerCount:state.ui.opening.offers?.length},timestamp:Date.now(),hypothesisId:'accept-dispatch'})}).catch(()=>{});
          // #endregion
          if (!isOffered) {
            if (import.meta.env.DEV) {
              console.error("[runtime] ACCEPT_OFFER rejected before flow", {
                franchiseId,
                offeredFranchiseIds: state.ui.opening.offers.map((offer) => offer.franchiseId),
                reason: "offer_not_found",
              });
            }
            setState({
              ...state,
              route: { key: "Offers" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastOfferError: "Could not accept that offer. Please select one of the listed offers.",
                },
              },
            });
            return;
          }
          const fullName = franchise?.fullName ?? getUgfTeamByExcelKey(franchiseId)?.team ?? franchiseId;
          const excelTeamKey = normalizeExcelTeamKey(fullName);
          if (offeredTeamKey && offeredTeamKey !== excelTeamKey) {
            setState({
              ...state,
              route: { key: "Offers" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastOfferError: "Offer details were out of sync. Please pick your offer again.",
                },
              },
            });
            return;
          }

          const runAcceptOfferFlow = async () => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:runAcceptOfferFlow',message:'flow started',data:{franchiseId},timestamp:Date.now(),hypothesisId:'accept-flow-start'})}).catch(()=>{});
            // #endregion
            let gameState = reduceGameState(createNewGameState(), gameActions.startNew());
            gameState = reduceGameState(
              gameState,
              gameActions.setCoachProfile({
                name: state.ui.opening.coachName || "You",
                age: state.ui.opening.coachAge,
                hometown: state.ui.opening.hometownLabel || "Unknown",
                hometownId: state.ui.opening.hometownId,
                hometownLabel: state.ui.opening.hometownLabel,
                hometownTeamKey: state.ui.opening.hometownTeamKey || "UNKNOWN_TEAM",
                reputation: 50,
                mediaStyle: "Balanced",
                personalityBaseline: state.ui.opening.coachPersonality,
              }),
            );
            gameState = reduceGameState(gameState, gameActions.setBackground(state.ui.opening.background));
            gameState = reduceGameState(gameState, gameActions.acceptOffer(franchiseId, excelTeamKey));
            const { league, warning } = await loadLeagueRosterForTeam({
              teamKey: franchiseId,
              excelTeamKey,
              season: gameState.time.season,
            });
            gameState = reduceGameState(gameState, gameActions.hydrateLeagueRoster(league));
            const derived = ensureRosterCapState(gameState);
            const registry = buildCharacterRegistry({
              leagueSeed: gameState.world.leagueSeed,
              coachName: state.ui.opening.coachName || "You",
              coachAge: state.ui.opening.coachAge,
              coachPersonality: state.ui.opening.coachPersonality,
              userTeamKey: franchiseId,
            });
            gameState = {
              ...gameState,
              ...derived,
              characters: {
                byId: registry.byId,
                coachId: registry.coachId,
                ownersByTeamKey: registry.ownersByTeamKey,
                gmsByTeamKey: registry.gmsByTeamKey,
              },
              teamFrontOffice: registry.teamFrontOffice,
              delegation: { ...gameState.delegation, setupComplete: false },
              freeAgency: {
                freeAgents: buildFreeAgentPool(gameState),
                lastUpdatedWeek: gameState.time.week,
              },
              inbox: ensureThreads(gameState),
              tasks: [{ id: "task-1", type: "STAFF_MEETING", title: "Hire coordinators", description: "Fill OC/DC/STC positions.", status: "OPEN" }],
              draft: gameState.draft ?? { discovered: {}, watchlist: [] },
            };
            const save = { version: 1 as const, gameState };
            hydrateLeagueStaffFromPersonnel(save.gameState);
            hydrateUserStaffFromTeamBucket(save.gameState, franchiseId);
            persistLocalSave(save);
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:runAcceptOfferFlow',message:'flow success',data:{franchiseId,route:'HireCoordinators'},timestamp:Date.now(),hypothesisId:'accept-flow-ok'})}).catch(()=>{});
            // #endregion
            setState({
              ...state,
              // Offers looked dead when errors interrupted flow before route/save updates.
              // Always persist + set state in one branch so clicks deterministically advance.
              save,
              route: { key: "HireCoordinators" },
              ui: {
                ...state.ui,
                opening: { ...state.ui.opening, lastOfferError: undefined },
                activeModal: warning
                  ? {
                      title: "Roster import warning",
                      message: warning,
                      warning,
                      actions: [{ label: "Continue", action: { type: "CLOSE_MODAL" } }],
                    }
                  : null,
              },
            });
          };

          void runAcceptOfferFlow().catch((error: unknown) => {
            const stack = error instanceof Error ? error.stack : undefined;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:ACCEPT_OFFER',message:'flow failed',data:{franchiseId,error: String(error)},timestamp:Date.now(),hypothesisId:'accept-flow-fail'})}).catch(()=>{});
            // #endregion
            console.error("[runtime] ACCEPT_OFFER failed", {
              franchiseId,
              franchiseFullName: fullName,
              excelTeamKey,
              error,
              stack,
            });
            setState({
              ...state,
              route: { key: "Offers" },
              ui: {
                ...state.ui,
                opening: {
                  ...state.ui.opening,
                  lastOfferError: `Could not accept ${fullName}. Please try again.`,
                },
              },
            });
          });
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
            gameState = reduceGameState(gameState, gameActions.hireCoach(role, assignment));
          });
          // Enter January Offseason to trigger initial calendar generation
          gameState = reduceGameState(gameState, gameActions.enterJanuaryOffseason());

          /**
           * Build a unified character registry for the new save. The MVV
           * requires that the user-controlled coach, owners and GMs all live
           * inside a single `characters.byId` map. Without this registry
           * successive systems (e.g. reputation, media, hiring) cannot look
           * up characters consistently. We derive the registry here rather
           * than on first load so that the save persists proper IDs on
           * initial creation.
           */
          try {
            const userTeamKey = gameState.franchise.ugfTeamKey || gameState.franchise.excelTeamKey;
            if (userTeamKey) {
              const registry = buildCharacterRegistry({
                leagueSeed: gameState.world?.leagueSeed ?? gameState.time.season,
                coachName: gameState.coach.name || "You",
                coachAge: gameState.coach.age ?? 35,
                coachPersonality: gameState.coach.personalityBaseline || "Balanced",
                userTeamKey,
              });
              gameState = {
                ...gameState,
                characters: {
                  byId: registry.byId,
                  coachId: registry.coachId,
                  ownersByTeamKey: registry.ownersByTeamKey,
                  gmsByTeamKey: registry.gmsByTeamKey,
                },
                teamFrontOffice: registry.teamFrontOffice,
              };
            }
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error("[runtime] Failed to build character registry", err);
            }
          }

          // Rebuild derived league mappings (rosters and cap usage) now that all
          // roster players have been hydrated. This must happen after any
          // modifications to the league data because derived maps depend on
          // playersById.
          const finalizedDerivedLeague = rebuildLeagueDerivedMaps(gameState.league.playersById ?? {});
          gameState = {
            ...gameState,
            world: {
              ...gameState.world,
              leagueDbVersion: "v1",
              leagueDbHash: getLeagueDbHash(),
            },
            league: {
              ...gameState.league,
              teamRosters: finalizedDerivedLeague.teamRosters,
              cap: {
                salaryCap: Number(gameState.league.cap?.salaryCap ?? DEFAULT_SALARY_CAP),
                capUsedByTeam: finalizedDerivedLeague.cap.capUsedByTeam,
              },
            },
            tasks: generateBeatTasks(gameState),
          };
          const nextSave = { version: 1 as const, gameState };
          assertCityTeamLeagueInvariants(nextSave);
          const validationModal = runLeagueValidation(nextSave);
          setState({
            ...state,
            save: nextSave,
            route: { key: "DelegationSetup" },
            ui: { ...state.ui, activeModal: validationModal ?? state.ui.activeModal },
          });
          return;
        }
        case "SET_DELEGATION_OPTION": {
          if (!state.save) return;
          const key = String(action.key ?? "") as "offenseControl" | "defenseControl" | "gameManagement" | "gmAuthority";
          const value = String(action.value ?? "");
          const allowed = {
            offenseControl: ["USER", "OC"],
            defenseControl: ["USER", "DC"],
            gameManagement: ["USER", "SHARED"],
            gmAuthority: ["FULL", "GM_ONLY"],
          } as const;
          if (!(key in allowed) || !(allowed[key as keyof typeof allowed] as readonly string[]).includes(value)) return;
          const gameState = {
            ...state.save.gameState,
            delegation: {
              ...state.save.gameState.delegation,
              [key]: value,
            },
          };
          setState({ ...state, save: { version: 1, gameState } });
          return;
        }
        case "CONFIRM_DELEGATION_SETUP": {
          if (!state.save) return;
          const gameState = {
            ...state.save.gameState,
            delegation: {
              ...state.save.gameState.delegation,
              setupComplete: true,
            },
          };
          setState({ ...state, save: { version: 1, gameState }, route: { key: "Hub" } });
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
          const gameState = reduceGameState(state.save.gameState, gameActions.setOffseasonPlan(payload));
          setState({ ...state, save: { version: 1, gameState }, route: { key: "Hub" } });
          return;
        }
        case "REFRESH_MARKET":
          setState({ ...state });
          return;
        case "TRY_HIRE": {
          if (!state.save) return;
          const role = action.role as StaffRole;
          const session = marketByWeekFor(state.save.gameState)[`${state.save.gameState.time.season}-${state.save.gameState.time.week}:${role}`];
          const candidate = session.candidates.find((c) => c.id === action.candidateId);
          if (!candidate) return;
          const requirement = candidate.requirement ?? {};
          const side = sideByRole(role);
          const control = side ? state.save.gameState.career.control[side] : null;
          const changes: string[] = [];
          if (control) {
            if (typeof requirement.minScheme === "number" && requirement.minScheme > control.schemeAuthority) {
              changes.push(`Scheme Control: ${control.schemeAuthority} -> ${requirement.minScheme}`);
            }
            if (typeof requirement.minAssistants === "number" && requirement.minAssistants > control.assistantsAuthority) {
              changes.push(`Assistants Control: ${control.assistantsAuthority} -> ${requirement.minAssistants}`);
            }
          }
          const lockAxes = requirement.lockAxes ?? [];
          const warning = requirement.locksOnHire ? `⚠ Hiring will lock: ${axesLabel(lockAxes)}` : undefined;

          setState({
            ...state,
            ui: {
              ...state.ui,
              activeModal: {
                title: "Confirm Hire",
                message: "Proceed with this hire?",
                lines: changes,
                warning,
                actions: [
                  { label: "Raise & Hire", action: { type: "CONFIRM_HIRE", role: action.role, candidateId: action.candidateId } },
                  { label: "Cancel", action: { type: "CLOSE_MODAL" } },
                ],
              },
            },
          });
          return;
        }
        case "CLOSE_MODAL":
          setState({ ...state, ui: { ...state.ui, activeModal: null } });
          return;
        case "OPEN_MODAL":
          setState({
            ...state,
            ui: {
              ...state.ui,
              activeModal: {
                title: String(action.title ?? "Confirm"),
                message: String(action.message ?? ""),
                lines: Array.isArray(action.lines) ? action.lines.filter((line): line is string => typeof line === "string") : undefined,
                warning: typeof action.warning === "string" ? action.warning : undefined,
                actions: Array.isArray(action.actions) ? (action.actions as Array<{ label: string; action: UIAction }>) : undefined,
              },
            },
          });
          return;
        case "CONFIRM_HIRE": {
          if (!state.save) return;
          const role = action.role as StaffRole;
          const candidateId = String(action.candidateId);
          const session = marketByWeekFor(state.save.gameState)[`${state.save.gameState.time.season}-${state.save.gameState.time.week}:${role}`];
          const candidate = session.candidates.find((c) => c.id === candidateId);
          const coachName = candidate?.name ?? candidateId;
          const side = sideByRole(role);
          const requirement = candidate?.requirement ?? {};
          let nextGameState = state.save.gameState;

          if (side) {
            const current = nextGameState.career.control[side];
            const minScheme = Math.max(current.schemeAuthority, requirement.minScheme ?? current.schemeAuthority);
            const minAssistants = Math.max(current.assistantsAuthority, requirement.minAssistants ?? current.assistantsAuthority);
            const lockAxes = requirement.lockAxes ?? [];
            const shouldLock = Boolean(requirement.locksOnHire && ["OC", "DC", "STC"].includes(role));

            nextGameState = {
              ...nextGameState,
              career: {
                ...nextGameState.career,
                control: {
                  ...nextGameState.career.control,
                  [side]: {
                    ...current,
                    schemeAuthority: minScheme,
                    assistantsAuthority: minAssistants,
                    locked: shouldLock ? true : current.locked,
                    lockedBy: shouldLock
                      ? { role: role as "OC" | "DC" | "STC", staffId: candidateId, staffName: coachName, reason: requirement.reason ?? "lock-on-hire", axes: lockAxes }
                      : current.lockedBy,
                  },
                },
              },
            };
          }

          const assignment: StaffAssignment = { candidateId, coachName, salary: candidate?.salaryDemand ?? 1_300_000, years: candidate?.defaultContractYears ?? 3, hiredWeek: nextGameState.time.week };
          nextGameState = reduceGameState(nextGameState, gameActions.hireCoach(role, assignment));

          const nextStateWithContracts = nextGameState as GameState & {
            staff: GameState["staff"] & {
              coachContractsById?: Record<string, CoachContract>;
              nextCoachContractId?: number;
            };
          };
          const season = Number(nextStateWithContracts.time.season ?? 2026);
          nextStateWithContracts.staff.nextCoachContractId = Number(nextStateWithContracts.staff.nextCoachContractId ?? 1);
          const contractId = `COACH_CONTRACT_${nextStateWithContracts.staff.nextCoachContractId++}`;
          const teamId = String(nextStateWithContracts.franchise?.ugfTeamKey || nextStateWithContracts.franchise?.excelTeamKey || "UNKNOWN_TEAM");
          const cc = createNewCoachContract({
            contractId,
            personId: candidateId,
            teamId,
            startSeason: season,
            years: Number(candidate?.defaultContractYears ?? 2),
            salaryY1: Number(candidate?.salaryDemand ?? 700_000),
          });
          nextStateWithContracts.staff.coachContractsById = nextStateWithContracts.staff.coachContractsById ?? {};
          nextStateWithContracts.staff.coachContractsById[contractId] = cc;
          const assigned = nextStateWithContracts.staff.assignments[role] as StaffAssignment & { coachContractId?: string };
          if (assigned) assigned.coachContractId = contractId;
          recomputeStaffBudgetUsed({ version: 1, gameState: nextStateWithContracts });

          if (side && requirement.locksOnHire) {
            const lockAxes = requirement.lockAxes ?? [];
            const labels = axesLabel(lockAxes);
            const cpLabel = `Locked ${sideLabel(role)} ${labels} by hiring ${role}: ${coachName}`;
            nextGameState = {
              ...nextGameState,
              checkpoints: [...nextGameState.checkpoints, { ts: Date.now(), label: cpLabel, week: nextGameState.time.week, phaseVersion: nextGameState.time.phaseVersion }],
            };
            const messages = generateImmediateMessagesFromEvent(nextGameState, { type: "COORDINATOR_LOCK_HIRED", side, role: role as "OC" | "DC" | "STC", name: coachName, axes: lockAxes });
            const inbox = nextGameState.inbox.map((thread) => ({ ...thread, messages: [...thread.messages] }));
            for (const item of messages) {
              let thread = inbox.find((it) => it.id === item.threadId);
              if (!thread) {
                thread = { id: item.threadId, title: item.threadId === "owner" ? "Owner" : "GM", unreadCount: 0, messages: [] };
                inbox.push(thread);
              }
              thread.messages.push({ id: `${item.threadId}-${Date.now()}-${thread.messages.length + 1}`, from: item.from, text: item.text, ts: new Date().toISOString() });
              thread.unreadCount += 1;
            }
            nextGameState = { ...nextGameState, inbox };
          }

          persistLocalSave({ version: 1, gameState: nextGameState });
          setState({ ...state, save: { version: 1, gameState: nextGameState }, route: { key: "StaffTree" }, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "UPDATE_CONTROL": {
          if (!state.save) return;
          const side = action.side as "offense" | "defense" | "specialTeams";
          const axis = action.axis as "schemeAuthority" | "assistantsAuthority";
          const requested = Number(action.value);
          if (!Number.isFinite(requested)) return;
          const current = state.save.gameState.career.control[side];
          const role = side === "offense" ? "OC" : side === "defense" ? "DC" : "STC";
          const assigned = state.save.gameState.staff.assignments[role as "OC" | "DC" | "STC"];
          const req = assigned ? requirementForAssignmentId(assigned.candidateId) : {};
          const floor = axis === "schemeAuthority" ? (req.minScheme ?? 0) : (req.minAssistants ?? 0);
          const lockAxis = axis === "schemeAuthority" ? "SCHEME" : "ASSISTANTS";
          if (current.locked && current.lockedBy?.axes.includes(lockAxis)) return;
          const value = Math.max(floor, Math.min(100, Math.round(requested)));
          const gameState = {
            ...state.save.gameState,
            career: {
              ...state.save.gameState.career,
              control: {
                ...state.save.gameState.career.control,
                [side]: { ...current, [axis]: value },
              },
            },
          };
          setState({ ...state, save: { version: 1, gameState } });
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
          assertAdvanceRoutingInvariant(state.save);
          const availability = getAdvanceAvailability(state.save);
          if (!availability.canAdvance) {
            openAdvanceBlockedModal(availability);
            return;
          }

          if (!state.save) return;

          const preAdvanceErrors = getLeagueValidationErrors(state.save);
          if (preAdvanceErrors.length) {
            setState({
              ...state,
              ui: {
                ...state.ui,
                activeModal: createLeagueInvalidAdvanceModal(preAdvanceErrors),
              },
            });
            return;
          }

          const before = {
            season: state.save.gameState.time.season,
            week: state.save.gameState.time.week,
            dayIndex: state.save.gameState.time.dayIndex,
            phase: state.save.gameState.phase,
          };
          const result = advanceDay(state.save.gameState);

          if (import.meta.env.DEV) {
            console.log("[runtime] ADVANCE_WEEK", {
              before,
              after: {
                season: result.gameState.time.season,
                week: result.gameState.time.week,
                dayIndex: result.gameState.time.dayIndex,
                phase: result.gameState.phase,
              },
              blocked: result.ok ? null : result.blocked,
            });
          }

          if (!result.ok) {
            openAdvanceBlockedModal({
              canAdvance: false,
              message: result.blocked.message,
              route: result.blocked.route,
            });
            return;
          }

          if (import.meta.env.DEV) {
            const noProgress =
              before.season === result.gameState.time.season &&
              before.week === result.gameState.time.week &&
              before.dayIndex === result.gameState.time.dayIndex;
            console.assert(!noProgress, "[runtime] ADVANCE_WEEK completed without calendar progress", { before, after: result.gameState.time });
          }

          const derivedLeagueState = rebuildLeagueDerivedMaps(result.gameState.league.playersById ?? {});
          // Rebuild the game state with derived league information
          let nextGameState: GameState = {
            ...result.gameState,
            world: {
              ...result.gameState.world,
              leagueDbVersion: "v1",
              leagueDbHash: getLeagueDbHash(),
            },
            league: {
              ...result.gameState.league,
              teamRosters: derivedLeagueState.teamRosters,
              cap: {
                salaryCap: Number(result.gameState.league.cap?.salaryCap ?? DEFAULT_SALARY_CAP),
                capUsedByTeam: derivedLeagueState.cap.capUsedByTeam,
              },
            },
          };

          // Automatically transition into the regular season once the January
          // Offseason has progressed past week 4. This prevents the user
          // from getting stuck after completing offseason tasks.
          if (nextGameState.phase === "JANUARY_OFFSEASON" && nextGameState.time.week > 4) {
            nextGameState = reduceGameState(nextGameState, gameActions.enterRegularSeason());
          }

          nextGameState = runCpuStaffHiring(nextGameState);
          const nextSave = { version: 1 as const, gameState: nextGameState };
          assertCityTeamLeagueInvariants(nextSave);
          const validationModal = runLeagueValidation(nextSave);
          setState({
            ...state,
            save: nextSave,
            route: { key: "Hub" },
            ui: { ...state.ui, activeModal: validationModal ?? null },
          });
          return;
        }
        case "SIMULATE_GAME": {
          // Only simulate when a save is loaded
          if (!state.save) return;
          const prevGameState = state.save.gameState;
          // Dispatch the simulateGame engine action
          const nextGameState = reduceGameState(prevGameState, gameActions.simulateGame());
          // Persist derived league maps and update save
          const derivedLeagueStateSim = rebuildLeagueDerivedMaps(nextGameState.league.playersById ?? {});
          const hydratedGameState: GameState = {
            ...nextGameState,
            world: {
              ...nextGameState.world,
              leagueDbVersion: "v1",
              leagueDbHash: getLeagueDbHash(),
            },
            league: {
              ...nextGameState.league,
              teamRosters: derivedLeagueStateSim.teamRosters,
              cap: {
                salaryCap: Number(nextGameState.league.cap?.salaryCap ?? DEFAULT_SALARY_CAP),
                capUsedByTeam: derivedLeagueStateSim.cap.capUsedByTeam,
              },
            },
          };
          const saveNext = { version: 1 as const, gameState: hydratedGameState };
          setState({
            ...state,
            save: saveNext,
          });
          return;
        }
        case "OPEN_ADVANCE_BLOCKED_MODAL": {
          openAdvanceBlockedModal(getAdvanceAvailability(state.save));
          return;
        }
        case "OPEN_PHONE_THREAD": {
          if (!state.save) return;
          const gameState = reduceGameState(state.save.gameState, gameActions.markThreadRead(String(action.threadId)));
          setState({ ...state, save: { version: 1, gameState }, route: { key: "PhoneThread", threadId: String(action.threadId) } });
          return;
        }
        case "LOAD_GAME":
          if (state.save) setState({ ...state, route: initialRoute(state.save) });
          return;
        default:
          return;
      }
    },
    selectors: {
      routeLabel: () => state.route.key,
      table: (name: string): Array<Record<string, unknown>> => {
        if (name === "Team Summary") {
          return getTeamSummaryProjectionRows(getCurrentSeason(), state.ui.opening.leagueSeed) as Array<Record<string, unknown>>;
        }
        return [];
      },
      canAdvance: () => getAdvanceAvailability(state.save),
    },
  };

  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/bd08a75b-7810-4f27-940e-692196e40e09',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ui/runtime.ts:createUIRuntime',message:'controller built',data:{route:state.route?.key,hasSave:!!state.save},timestamp:Date.now(),hypothesisId:'runtime-ready'})}).catch(()=>{});
  // #endregion
  return controller;
}

const FREE_AGENTS_CACHE: CoachFreeAgent[] = loadCoachFreeAgents();
const EXISTING_CONTRACTS_BY_ID = buildExistingContractsIndex();

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function seededJitter(seed: number, id: string): number {
  let h = seed ^ 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  return (h % 5) - 2;
}

function ageCurve(age: number | null): number {
  if (!age) return 0;
  const d = Math.abs(age - 48);
  if (d <= 7) return 2;
  if (d <= 14) return 0;
  if (d <= 22) return -2;
  return -5;
}

function deriveCoachRating(fa: CoachFreeAgent, role: StaffRole, leagueSeed: number): number {
  const rep = Number(fa.reputation ?? 60);
  const curve = ageCurve(fa.age ?? null);
  const j = seededJitter(leagueSeed, `${role}:${fa.id}`);
  return clamp(Math.round(rep + curve + j), 50, 99);
}

function uiRolesForFreeAgentRole(role: CoachFreeAgent["role"]): StaffRole[] {
  return [role as StaffRole];
}

function fitLabelForRating(rating: number): "Natural Fit" | "Good Fit" | "Reach" {
  if (rating >= 86) return "Natural Fit";
  if (rating >= 74) return "Good Fit";
  return "Reach";
}

function salaryFor(role: StaffRole, rating: number): number {
  const base =
    role === "OC" || role === "DC" ? 2_200_000 :
    role === "STC" ? 1_200_000 :
    role === "QB" ? 950_000 :
    role === "ASST" ? 700_000 :
    800_000;
  const bump = Math.round((rating - 70) * 18_000);
  return Math.max(350_000, base + bump);
}

function candidateFromFreeAgent(role: StaffRole, fa: CoachFreeAgent, leagueSeed: number): ReturnType<typeof createCandidate> {
  const rating = deriveCoachRating(fa, role, leagueSeed);
  const demand = salaryFor(role, rating);
  return {
    id: fa.id,
    name: fa.name,
    rating,
    role,
    primaryRole: role,
    traits: ["Staffer"],
    philosophy: fa.scheme ?? "Balanced",
    fitLabel: fitLabelForRating(rating),
    salaryDemand: demand,
    recommendedOffer: Math.round(demand * 1.08),
    availability: "FREE_AGENT" as const,
    standardsNote: fa.age ? `Age ${fa.age}` : "Standard",
    perceivedRisk: Math.max(5, Math.min(70, 95 - rating)),
    defaultContractYears: role === "OC" || role === "DC" ? 3 : 2,
    requirement: {},
  };
}

function candidatesForRoleFromFreeAgents(role: StaffRole, leagueSeed: number): ReturnType<typeof createCandidate>[] {
  // ASST is a generic opening: can be filled by any FA coach (non-HC).
  const raw =
    role === "ASST"
      ? FREE_AGENTS_CACHE.filter((fa) => fa.role !== "HC")
      : FREE_AGENTS_CACHE.filter((fa) => fa.role === role);

  const mapped = raw.map((fa) => candidateFromFreeAgent(role, fa, leagueSeed));
  mapped.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return mapped;
}

function fallbackCandidatesForCoordinatorRole(role: StaffRole, leagueSeed: number): ReturnType<typeof createCandidate>[] {
  if (role !== "OC" && role !== "DC" && role !== "STC") return [];
  const names =
    role === "OC"
      ? ["Lori Reardon", "Devlin Britton", "Donnie Chu", "Katya Beasley", "Yulissa Broussard", "Orion Firth"]
      : role === "DC"
        ? ["Marcus Webb", "Elena Vasquez", "James Chen", "Dakota Reed", "Sam Foster", "Jordan Blake"]
        : ["Alex Rivera", "Jordan Tate", "Casey Morgan", "Riley Hayes", "Quinn Davis", "Avery Brooks"];
  const count = 6;
  const out: ReturnType<typeof createCandidate>[] = [];
  for (let i = 0; i < count; i++) {
    const rating = 65 + (Number((leagueSeed + i * 7 + role.charCodeAt(0)) % 31) % 25);
    const demand = salaryFor(role, rating);
    out.push({
      id: `fallback-${role}-${i + 1}`,
      name: names[i] ?? `${role} Candidate ${i + 1}`,
      rating,
      role,
      primaryRole: role,
      traits: ["Staffer"],
      philosophy: "Balanced",
      fitLabel: fitLabelForRating(rating),
      salaryDemand: demand,
      recommendedOffer: Math.round(demand * 1.08),
      availability: "FREE_AGENT" as const,
      standardsNote: "Standard",
      perceivedRisk: Math.max(5, Math.min(70, 95 - rating)),
      defaultContractYears: role === "OC" || role === "DC" ? 3 : 2,
      requirement: {},
    });
  }
  out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return out;
}

function recomputeStaffBudgetUsed(save: SaveData): void {
  const gameState = save.gameState as GameState & { staff: GameState["staff"] & { coachContractsById?: Record<string, CoachContract> } };
  const season = Number(gameState.time?.season ?? 2026);
  const assignments = gameState.staff.assignments ?? {};
  const runtimeContracts = gameState.staff.coachContractsById ?? {};
  let used = 0;

  for (const a of Object.values(assignments)) {
    if (!a) continue;
    const contractId = String((a as any).coachContractId ?? (a as any).contractId ?? "");
    if (!contractId) continue;

    const runtime = runtimeContracts[contractId];
    if (runtime) {
      used += salaryForContractInSeason(runtime, season);
      continue;
    }

    const existing = EXISTING_CONTRACTS_BY_ID.get(contractId);
    if (existing) {
      used += salaryForContractInSeason(existing, season);
      continue;
    }

    const row = findExistingCoachContractRow(contractId);
    const cc = row ? contractRowToCoachContract(row) : null;
    if (cc) used += salaryForContractInSeason(cc, season);
  }

  gameState.staff.budgetUsed = used;
}

function hydrateAllTeamsCoordinators(save: SaveData): void {
  const gameState = save.gameState as GameState & { staff: GameState["staff"] & { leagueAssignmentsByTeamId?: Record<string, unknown> } };
  const seed = Number(gameState.world?.leagueSeed ?? 1337);
  gameState.staff.leagueAssignmentsByTeamId = buildLeagueCoordinatorAssignments(seed);
}

function hydrateUserTeamStaff(save: SaveData): void {
  const gameState = save.gameState as GameState & { staff: GameState["staff"] & { assignments: Record<string, unknown> } };
  const seed = Number(gameState.world?.leagueSeed ?? 1337);
  const teamId = gameState.franchise?.ugfTeamKey ?? gameState.franchise?.excelTeamKey;
  if (!teamId) return;

  const assn = buildStaffAssignmentsForTeam(teamId, seed);
  gameState.staff.assignments = { ...(gameState.staff.assignments ?? {}), ...(assn as any) };

  for (const [role, a] of Object.entries(assn)) {
    const cur = (gameState.staff.assignments as any)[role];
    if (!cur || !a) continue;
    if (a.contractId && !cur.contractId) cur.contractId = a.contractId;
  }

  recomputeStaffBudgetUsed(save);
}

export function buildMarketForRole(role: StaffRole) {
  if (role === "HC") return { weekKey: "2026-1", role, candidates: [] as ReturnType<typeof createCandidate>[] };

  const leagueSeed = 1337;
  const fromFreeAgents = candidatesForRoleFromFreeAgents(role, leagueSeed);
  const candidates: ReturnType<typeof createCandidate>[] = [];

  for (const c of fromFreeAgents) {
    if (candidates.length >= 6) break;
    candidates.push(c);
  }

  if (candidates.length === 0 && (role === "OC" || role === "DC" || role === "STC")) {
    candidates.push(...fallbackCandidatesForCoordinatorRole(role, leagueSeed));
  }

  candidates.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return { weekKey: "2026-1", role, candidates };
}

export function marketByWeekFor(state: GameState) {
  const weekKey = `${state.time.season}-${state.time.week}`;
  return Object.fromEntries(STAFF_ROLES.map((role) => [`${weekKey}:${role}`, buildMarketForRole(role)]));
}
