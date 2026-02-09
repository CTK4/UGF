import { STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import { gameActions } from "@/engine/actions";
import type { GameState, StaffAssignment, Thread } from "@/engine/gameState";
import { createNewGameState, reduceGameState } from "@/engine/reducer";
import { generateBeatTasks } from "@/engine/tasks";
import { generateImmediateMessagesFromEvent } from "@/engine/phone";
import { getScoutablePositions } from "@/engine/scouting";
import { HOMETOWN_CLOSEST_TEAM } from "@/data/hometownToTeam";
import { HOMETOWNS } from "@/data/hometowns";
import { OPENING_INTERVIEW_QUESTIONS } from "@/data/interviewQuestions";
import { getOwnerProfile } from "@/data/owners";
import { getTeamIdByName, getTeamSummaryRows } from "@/data/generatedData";
import { computeTeamWeightedDelta } from "@/engine/interviews";
import { deriveOfferTerms } from "@/engine/offers";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";
import type { InterviewInvite, InterviewInviteTier, OpeningInterviewResult, SaveData, UIAction, UIController, UIState } from "@/ui/types";

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
  return {
    coachName: "",
    background: "Former QB",
    hometownId: "",
    hometownLabel: "",
    hometownTeamKey: "",
    interviewInvites: [],
    interviewResults: {},
    offers: [],
    coordinatorChoices: {},
  };
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

if (import.meta.env.DEV && OPENING_INTERVIEW_QUESTIONS.length !== 3) {
  console.error(`OPENING_INTERVIEW_QUESTIONS must contain exactly 3 items. Received ${OPENING_INTERVIEW_QUESTIONS.length}.`);
}

function generateOffersFromInterviewResults(interviewInvites: InterviewInvite[], interviewResults: Record<string, OpeningInterviewResult>): InterviewInvite[] {
  const scored = interviewInvites
    .map((invite) => {
      const result = interviewResults[invite.franchiseId];
      const score = (result?.ownerOpinion ?? 50) + (result?.gmOpinion ?? 50) + (result?.pressureTone ?? 50);
      return { invite, score };
    })
    .sort((a, b) => b.score - a.score);

  const offerCount = Math.max(1, Math.min(3, scored.filter((entry) => entry.score >= 150).length || 1));
  return scored.slice(0, offerCount).map((entry) => entry.invite);
}

function parseCapSpaceValue(row: Record<string, unknown>): number | null {
  const raw = row.capSpace ?? row.cap_room ?? row.capRoom ?? row["Cap Space"];
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCapSpace(value: number | null): string {
  if (value === null) return "N/A";

  const abs = Math.abs(value);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";

  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function buildSummaryLine(franchiseId: string, tier: InterviewInviteTier, capSpace: number | null): string {
  const meta = INTERVIEW_SUMMARY_BY_TIER[tier];
  const owner = getOwnerProfile(franchiseId);
  const terms = deriveOfferTerms(tier, owner);
  return `${meta.descriptor} • Cap Space: ${formatCapSpace(capSpace)} • ${terms.years}y • ${terms.pressure} pressure • ${terms.mandate}`;
}

function getOverallValue(row: Record<string, unknown>): number {
  const overall = Number(row.OVERALL ?? row.AvgRating ?? row["Avg Rating"] ?? 0);
  return Number.isFinite(overall) ? overall : 0;
}

function buildTeamInviteMetricsByFranchiseId(): Map<string, TeamInviteMetrics> {
  const metricsByFranchiseId = new Map<string, TeamInviteMetrics>();

  for (const row of getTeamSummaryRows() as unknown as Array<Record<string, unknown>>) {
    const teamName = String(row.Team ?? "").trim();
    if (!teamName) continue;
    const franchiseId = getTeamIdByName(teamName);
    metricsByFranchiseId.set(franchiseId, {
      overall: getOverallValue(row),
      capSpace: parseCapSpaceValue(row),
    });
  }

  return metricsByFranchiseId;
}

function rankTeamsByOverall(
  metricsByFranchiseId: Map<string, TeamInviteMetrics>,
): Array<{ franchiseId: string; overall: number; rank: number; tier: InterviewInviteTier }> {
  const ranked = sortedFranchises()
    .map((franchise) => ({
      franchiseId: franchise.id,
      overall: metricsByFranchiseId.get(franchise.id)?.overall ?? 0,
    }))
    .sort((a, b) => a.overall - b.overall || a.franchiseId.localeCompare(b.franchiseId));

  return ranked.map((team, index) => {
    const isBottomFive = index < 5;
    const isTopTen = index >= ranked.length - 10;
    const tier: InterviewInviteTier = isBottomFive ? "REBUILD" : isTopTen ? "CONTENDER" : "FRINGE";
    return { ...team, rank: index + 1, tier };
  });
}

function pickFirstAvailable(
  candidates: Array<{ franchiseId: string; overall: number; rank: number; tier: InterviewInviteTier }>,
  selected: Set<string>,
): { franchiseId: string; overall: number; rank: number; tier: InterviewInviteTier } | null {
  for (const candidate of candidates) {
    if (!selected.has(candidate.franchiseId)) return candidate;
  }
  return null;
}

function buildInvite(
  team: { franchiseId: string; overall: number; tier: InterviewInviteTier },
  metricsByFranchiseId: Map<string, TeamInviteMetrics>,
): InterviewInvite {
  const capSpace = metricsByFranchiseId.get(team.franchiseId)?.capSpace ?? null;

  return {
    franchiseId: team.franchiseId,
    tier: team.tier,
    overall: team.overall,
    summaryLine: buildSummaryLine(team.franchiseId, team.tier, capSpace),
  };
}

function generateInterviewInvites(hometownTeamKey: string): InterviewInvite[] {
  const metricsByFranchiseId = buildTeamInviteMetricsByFranchiseId();
  const ranked = rankTeamsByOverall(metricsByFranchiseId);
  if (!hometownTeamKey) {
    console.error("Missing hometownTeamKey for interview invites.");
  }

  const teamsByTier = {
    REBUILD: ranked.filter((team) => team.tier === "REBUILD"),
    FRINGE: ranked.filter((team) => team.tier === "FRINGE"),
    CONTENDER: ranked.filter((team) => team.tier === "CONTENDER"),
  } satisfies Record<InterviewInviteTier, Array<{ franchiseId: string; overall: number; rank: number; tier: InterviewInviteTier }>>;

  const selected = new Set<string>();
  const hometown = hometownTeamKey || "UNKNOWN_TEAM";
  selected.add(hometown);

  const hometownTeam = ranked.find((team) => team.franchiseId === hometown);
  const invites: InterviewInvite[] = hometownTeam
    ? [buildInvite(hometownTeam, metricsByFranchiseId)]
    : [{ franchiseId: hometown, tier: "FRINGE", overall: 0, summaryLine: buildSummaryLine(hometown, "FRINGE", null) }];

  const representedTiers = new Set<InterviewInviteTier>(invites.map((invite) => invite.tier));
  for (const tier of ["REBUILD", "FRINGE", "CONTENDER"] as const) {
    if (invites.length >= 3) break;
    if (representedTiers.has(tier)) continue;
    const picked = pickFirstAvailable(teamsByTier[tier], selected);
    if (!picked) continue;
    selected.add(picked.franchiseId);
    invites.push(buildInvite(picked, metricsByFranchiseId));
    representedTiers.add(picked.tier);
  }

  while (invites.length < 3) {
    const fallback = pickFirstAvailable(ranked, selected);
    if (!fallback) break;
    selected.add(fallback.franchiseId);
    invites.push(buildInvite(fallback, metricsByFranchiseId));
  }

  return invites.slice(0, 3);
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
  const loadedGameState = save?.gameState
    ? reduceGameState(createNewGameState(), gameActions.loadState(save.gameState))
    : null;

  let state: UIState = {
    route: initialRoute(loadedGameState ? { version: 1, gameState: loadedGameState } : null),
    save: loadedGameState ? { version: 1, gameState: loadedGameState } : null,
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
        case "NAVIGATE": {
          const nextRoute = action.route as UIState["route"];
          if (nextRoute.key === "Offers") {
            const allDone =
              state.ui.opening.interviewInvites.length > 0 &&
              state.ui.opening.interviewInvites.every((invite) => state.ui.opening.interviewResults[invite.franchiseId]?.completed);
            if (allDone && state.ui.opening.offers.length === 0) {
              const offers = generateOffersFromInterviewResults(state.ui.opening.interviewInvites, state.ui.opening.interviewResults);
              setState({
                ...state,
                route: nextRoute,
                ui: { ...state.ui, activeModal: null, opening: { ...state.ui.opening, offers } },
              });
              return;
            }
          }
          setState({ ...state, route: nextRoute, ui: { ...state.ui, activeModal: null } });
          return;
        }
        case "RESET_SAVE":
          localStorage.removeItem(SAVE_KEY);
          setState({ ...state, save: null, route: { key: "Start" }, corruptedSave: false, ui: { ...state.ui, opening: openingState() } });
          return;
        case "SET_COACH_NAME":
          setState({ ...state, ui: { ...state.ui, opening: { ...state.ui.opening, coachName: String(action.coachName ?? "") } } });
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
          const interviewInvites = generateInterviewInvites(state.ui.opening.hometownTeamKey);
          const interviewResults = Object.fromEntries(
            interviewInvites.map((invite) => [
              invite.franchiseId,
              {
                franchiseId: invite.franchiseId,
                answers: [],
                ownerOpinion: 50,
                gmOpinion: 50,
                pressureTone: 50,
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
                ...state.ui.opening,
                interviewInvites,
                interviewResults,
                offers: [],
              },
            },
            route: { key: "Interviews" },
          });
          return;
        }
        case "OPENING_START_INTERVIEW": {
          const franchiseId = String(action.franchiseId ?? "");
          const invite = state.ui.opening.interviewInvites.find((item) => item.franchiseId === franchiseId);
          if (!invite) return;
          const existing = state.ui.opening.interviewResults[franchiseId] ?? {
            franchiseId,
            answers: [],
            ownerOpinion: 50,
            gmOpinion: 50,
            pressureTone: 50,
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
              },
            },
            route: { key: "OpeningInterview", franchiseId },
          });
          return;
        }
        case "OPENING_ANSWER_INTERVIEW": {
          const franchiseId = String(action.franchiseId ?? "");
          const answerIndex = Number(action.answerIndex ?? -1);
          const current = state.ui.opening.interviewResults[franchiseId];
          if (!current || current.completed) return;
          const question = OPENING_INTERVIEW_QUESTIONS[current.answers.length];
          const choice = question?.choices[answerIndex];
          if (!choice) return;
          const weightedDelta = computeTeamWeightedDelta({
            teamKey: franchiseId,
            questionIndex: current.answers.length,
            choiceIndex: answerIndex,
            base: choice,
          });

          const nextResult: OpeningInterviewResult = {
            ...current,
            answers: [...current.answers, answerIndex],
            ownerOpinion: clampRating(current.ownerOpinion + weightedDelta.owner),
            gmOpinion: clampRating(current.gmOpinion + weightedDelta.gm),
            pressureTone: clampRating(current.pressureTone + weightedDelta.pressure),
            completed: current.answers.length + 1 >= OPENING_INTERVIEW_QUESTIONS.length,
            lastToneFeedback: weightedDelta.tone,
          };

          const interviewResults = { ...state.ui.opening.interviewResults, [franchiseId]: nextResult };
          const allDone = state.ui.opening.interviewInvites.every((invite) => interviewResults[invite.franchiseId]?.completed);
          if (allDone) {
            const offers = generateOffersFromInterviewResults(state.ui.opening.interviewInvites, interviewResults);
            setState({
              ...state,
              ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults, offers } },
              route: { key: "Offers" },
            });
            return;
          }

          if (nextResult.completed) {
            setState({
              ...state,
              ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults } },
              route: { key: "Interviews" },
            });
            return;
          }

          setState({
            ...state,
            ui: { ...state.ui, opening: { ...state.ui.opening, interviewResults } },
            route: { key: "OpeningInterview", franchiseId },
          });
          return;
        }
        case "ACCEPT_OFFER": {
          const franchiseId = String(action.franchiseId);
          const f = getFranchise(franchiseId);
          const isOffered = state.ui.opening.offers.some((offer) => offer.franchiseId === franchiseId);
          if (!f || !isOffered) return;
          let gameState = reduceGameState(createNewGameState(1), gameActions.startNew(1));
          gameState = reduceGameState(
            gameState,
            gameActions.setCoachProfile({
              name: state.ui.opening.coachName || "You",
              age: 35,
              hometown: state.ui.opening.hometownLabel || "Unknown",
              hometownId: state.ui.opening.hometownId,
              hometownLabel: state.ui.opening.hometownLabel,
              hometownTeamKey: state.ui.opening.hometownTeamKey || "UNKNOWN_TEAM",
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
          localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, gameState }));
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
  const weekKey = `${state.time.season}-${state.time.week}`;
  return Object.fromEntries(STAFF_ROLES.map((role) => [`${weekKey}:${role}`, buildMarketForRole(role)]));
}
