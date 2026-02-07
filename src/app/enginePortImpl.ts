import type { EngineCallDescriptorStamped, EngineResponse, InterviewQuestion } from "@/ui/engine/types";
import { advanceAsync, GateBlockedError, PhaseVersionMismatchError } from "@/phaseEngine";
import { checkpointNowPort } from "./checkpointNowPort";
import { createPersistencePort } from "@/domainE/persistence";

const persistence = createPersistencePort();
const SAVE_ID = "default";
const BACKUP_SAVE_ID = "default_backup";

type InMemory = {
  save: any;
  leagueState: any;
};

const mem: InMemory = { save: null, leagueState: null };

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function deterministicPick<T>(seed: string, list: T[]): T {
  return list[hashString(seed) % list.length];
}

function makeId(prefix: string, seed: string): string {
  return `${prefix}_${hashString(seed).toString(16)}`;
}

async function persistCurrent(withBackup = true): Promise<void> {
  await persistence.createCheckpoint(SAVE_ID, mem.save, { appendCheckpointEvent: true });
  await persistence.save(SAVE_ID, mem.save);
  if (withBackup) {
    await persistence.save(BACKUP_SAVE_ID, mem.save);
  }
}

function buildInitialSave(seedBase: string): any {
  return {
    meta: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), checksum: null, prevChecksum: null, saveId: SAVE_ID },
    game: { leagueId: "ugf", clock: { season: 2026, phase: "preseason_setup", week: 0, day: 0 }, timeline: { tick: 0 } },
    world: {},
    fog: {},
    systems: {
      phaseEngine: null,
      staffMarket: { sessionsById: {}, hires: [] },
      interviews: { pool: [], sessions: {}, history: [] },
      phone: { threads: [], relationship: 50, interest: 50 },
      contracts: { expiring: [] }
    },
    events: { log: [] },
    rng: { masterSeed: `seed_${hashString(seedBase)}` },
    uxState: { notices: [] }
  };
}

function buildInitialLeagueState(save: any): any {
  return {
    phaseVersion: 0,
    rng: { masterSeed: save.rng.masterSeed },
    clock: { ...save.game.clock },
    user: { franchiseTeamId: null },
    teams: [],
    config: {
      freeAgency: { totalWeeks: 3, daysPerWeek: 7, granularity: "WEEK" },
      trainingCamp: { totalWeeks: 3 },
      regularSeason: { totalWeeks: 17 },
      draft: { totalPicks: 224 }
    },
    market: { pendingOffers: [], udfaWindowClosed: false },
    draft: {
      orderFinalized: false,
      pickOwnershipLocked: false,
      totalPicks: 224,
      currentOverallPick: 1,
      onClockTeamId: "",
      eligiblePlayerIds: [],
      draftedPlayerIds: new Set<string>()
    },
    rosters: { allTeamsAtFinalSize: false, offseasonCutsComplete: false }
  };
}

function baseCandidates(role: string) {
  return [
    { name: "Alex Romero", traits: ["QB-friendly", "tempo control"], scheme: "Spread", ego: 61, personality: "Measured" },
    { name: "Nolan Price", traits: ["player dev", "situational aggression"], scheme: "West Coast", ego: 48, personality: "Teacher" },
    { name: "Sam Rourke", traits: ["blitz packages", "red zone focus"], scheme: "3-4 Hybrid", ego: 73, personality: "Intense" },
    { name: "Kyle Benton", traits: ["analytics", "scripted drives"], scheme: "Air Raid", ego: 55, personality: "Collaborative" },
    { name: "Brian Walsh", traits: ["discipline", "turnover margin"], scheme: "Ball Control", ego: 66, personality: "Old School" },
    { name: "Devon Lake", traits: ["adaptability", "locker-room buy-in"], scheme: role === "OC" ? "RPO" : "4-2-5", ego: 42, personality: "Players Coach" }
  ];
}

function deterministicCandidates(role: string, salt: string): any[] {
  const master = `${role}:${salt}`;
  const rotated = [...baseCandidates(role)].sort((a, b) => hashString(`${master}:${a.name}`) - hashString(`${master}:${b.name}`));
  return rotated.slice(0, 5).map((b, i) => ({
    id: makeId(`cand_${role}`, `${master}:${i}:${b.name}`),
    name: b.name,
    role,
    traits: b.traits,
    scheme: b.scheme,
    ego: b.ego,
    personality: b.personality,
    availability: "AVAILABLE" as const
  }));
}

function ensureSystems(save: any): void {
  save.systems = save.systems ?? {};
  save.systems.staffMarket = save.systems.staffMarket ?? { sessionsById: {}, hires: [] };
  save.systems.interviews = save.systems.interviews ?? { pool: [], sessions: {}, history: [] };
  save.systems.phone = save.systems.phone ?? { threads: [], relationship: 50, interest: 50 };
  save.systems.contracts = save.systems.contracts ?? { expiring: [] };
}

function bootstrapNarrativeSystems(save: any): void {
  ensureSystems(save);
  if ((save.systems.phone.threads ?? []).length === 0) {
    save.systems.phone.threads = [
      {
        id: "thread_owner",
        title: "Owner",
        unread: 1,
        messages: [{ id: "m_owner_intro", from: "Owner", text: "Camp is close. I need a clear staffing plan this week." }],
        replies: [
          { id: "polite", label: "Absolutely, I will handle it with a full report." },
          { id: "aggressive", label: "Back off. Let me coach." },
          { id: "defer", label: "Give me two days before I commit." },
          { id: "negotiate", label: "I can do it if we stretch staff budget slightly." }
        ]
      }
    ];
  }
  if ((save.systems.interviews.pool ?? []).length === 0) {
    save.systems.interviews.pool = [
      { id: "iv_01", name: "Mason Pike", role: "OC", fitBase: 54, repBase: 42, status: "available" },
      { id: "iv_02", name: "Derrick Shaw", role: "DC", fitBase: 61, repBase: 55, status: "available" },
      { id: "iv_03", name: "Grant Ellis", role: "OC", fitBase: 49, repBase: 68, status: "available" }
    ];
  }
  if ((save.systems.contracts.expiring ?? []).length === 0) {
    save.systems.contracts.expiring = [
      { id: "ct_1", name: "OL Coach Rivera", role: "OL", yearsLeft: 0, salary: 1.1 },
      { id: "ct_2", name: "S&C Bell", role: "S&C", yearsLeft: 0, salary: 0.8 }
    ];
  }
}

function getOrCreateMarketSession(save: any, role: string, refresh: boolean): { marketSessionId: string; candidates: any[] } {
  ensureSystems(save);
  const weekKey = `${save.game.clock.season}-${save.game.clock.phase}-${save.game.clock.week}`;
  const sessions = save.systems.staffMarket.sessionsById as Record<string, any>;
  const baseId = `ms::STAFF_V1::${save.game.leagueId}::user::${role}::${weekKey}`;
  if (!refresh && sessions[baseId]) return { marketSessionId: baseId, candidates: sessions[baseId].candidates };
  const existingRefreshes = Object.keys(sessions).filter(k => k.startsWith(baseId));
  const nextIndex = refresh ? existingRefreshes.length : 0;
  const sessionId = refresh && nextIndex > 0 ? `${baseId}::r${nextIndex}` : baseId;
  if (!sessions[sessionId]) {
    const salt = refresh ? `r${nextIndex}` : "r0";
    sessions[sessionId] = { role, candidates: deterministicCandidates(role, salt) };
  }
  return { marketSessionId: sessionId, candidates: sessions[sessionId].candidates };
}

function mkHubActions(state: any, save: any) {
  const hires = (save.systems?.staffMarket?.hires ?? []).length;
  const expiring = (save.systems?.contracts?.expiring ?? []).length;
  return {
    actions: [
      { id: "OPEN_STAFF", label: "Hire Market", enabled: true, badge: `${hires} hired` },
      { id: "OPEN_INTERVIEWS", label: "Interviews", enabled: true },
      { id: "OPEN_PHONE", label: "Phone", enabled: true },
      { id: "OPEN_CONTRACTS", label: "Expiring Contracts", enabled: true, badge: String(expiring) },
      { id: "ADVANCE_WEEK", label: "Advance Week", enabled: true }
    ],
    summary: {
      hires: (save.systems?.staffMarket?.hires ?? []).map((h: any) => `${h.role}: ${h.name}`),
      pendingContracts: expiring
    }
  };
}

function buildInterviewQuestions(candidateId: string): InterviewQuestion[] {
  const style = deterministicPick(candidateId, ["balanced", "aggressive", "development"]);
  return [
    {
      id: "q1",
      prompt: "How do you install your scheme in camp?",
      options: [
        { id: "q1_a", label: "Teach fundamentals first", fitDelta: 8, repDelta: 3, ownerDelta: 2 },
        { id: "q1_b", label: `Go ${style} from day one`, fitDelta: 4, repDelta: 6, ownerDelta: -1 },
        { id: "q1_c", label: "Let veterans set tone", fitDelta: -2, repDelta: 2, ownerDelta: 0 }
      ]
    },
    {
      id: "q2",
      prompt: "How do you handle a star player challenging play-calls?",
      options: [
        { id: "q2_a", label: "Private meeting and role clarity", fitDelta: 7, repDelta: 4, ownerDelta: 1 },
        { id: "q2_b", label: "Bench him to send a message", fitDelta: -3, repDelta: -2, ownerDelta: -4 },
        { id: "q2_c", label: "Adjust calls to his strengths", fitDelta: 5, repDelta: 2, ownerDelta: 3 }
      ]
    },
    {
      id: "q3",
      prompt: "What staffing budget do you need?",
      options: [
        { id: "q3_a", label: "Lean budget with analysts", fitDelta: 4, repDelta: 2, ownerDelta: 6 },
        { id: "q3_b", label: "Top market assistants", fitDelta: 6, repDelta: 5, ownerDelta: -5 },
        { id: "q3_c", label: "Mid-tier, performance bonuses", fitDelta: 5, repDelta: 3, ownerDelta: 2 }
      ]
    }
  ];
}

async function ensureLoaded(forceNew = false): Promise<void> {
  if (!forceNew && mem.save && mem.leagueState) return;
  try {
    const loaded = forceNew ? null : await persistence.load(SAVE_ID);
    if (!loaded) throw new Error("missing");
    mem.save = loaded;
    ensureSystems(mem.save);
    bootstrapNarrativeSystems(mem.save);
    mem.leagueState = loaded.systems?.phaseEngine ?? buildInitialLeagueState(loaded);
  } catch {
    if (!forceNew) {
      try {
        const backup = await persistence.load(BACKUP_SAVE_ID);
        mem.save = backup;
        ensureSystems(mem.save);
        bootstrapNarrativeSystems(mem.save);
        mem.leagueState = backup.systems?.phaseEngine ?? buildInitialLeagueState(backup);
        mem.save.uxState.notices = [...(mem.save.uxState.notices ?? []), "Recovered from backup save."];
        mem.save.systems.phaseEngine = mem.leagueState;
        await persistCurrent(false);
        return;
      } catch {
        // continue to fresh save
      }
    }
    const fresh = buildInitialSave(`new_${Date.now()}`);
    bootstrapNarrativeSystems(fresh);
    await persistence.createCheckpoint(SAVE_ID, fresh, { appendCheckpointEvent: true });
    await persistence.save(SAVE_ID, fresh);
    mem.save = fresh;
    mem.leagueState = buildInitialLeagueState(fresh);
    mem.save.systems.phaseEngine = mem.leagueState;
    await persistCurrent();
  }
}

export const enginePort = {
  async call(desc: EngineCallDescriptorStamped): Promise<EngineResponse> {
    await ensureLoaded();
    ensureSystems(mem.save);

    switch (desc.kind) {
      case "GET_HUB_ACTIONS": {
        const hub = mkHubActions(mem.leagueState, mem.save);
        return { kind: "HUB_ACTIONS", actions: hub.actions, summary: hub.summary };
      }
      case "GET_MARKET_CANDIDATES": {
        const { marketSessionId, candidates } = getOrCreateMarketSession(mem.save, desc.role, !!desc.refresh);
        const hiredStaff = mem.save.systems.staffMarket.hires ?? [];
        await persistCurrent();
        return { kind: "MARKET_CANDIDATES", marketSessionId, role: desc.role, candidates, hiredStaff };
      }
      case "CONFIRM_HIRE": {
        const sessions = mem.save.systems.staffMarket.sessionsById ?? {};
        const session = sessions[desc.marketSessionId];
        const pick = session?.candidates?.find((c: any) => c.id === desc.candidateId);
        if (!pick) throw new Error("Candidate no longer available in this market session.");
        mem.save.systems.staffMarket.hires = mem.save.systems.staffMarket.hires ?? [];
        const already = mem.save.systems.staffMarket.hires.some((h: any) => h.candidateId === desc.candidateId);
        if (!already) {
          mem.save.systems.staffMarket.hires.push({ id: makeId("staff", desc.candidateId), role: desc.role, candidateId: desc.candidateId, name: pick.name, hiredTick: mem.save.game.timeline.tick });
        }
        session.candidates = session.candidates.filter((c: any) => c.id !== desc.candidateId);
        await persistCurrent();
        return { kind: "HIRE_CONFIRMED", role: desc.role, candidateId: desc.candidateId, staffId: makeId("staff", desc.candidateId), name: pick.name };
      }
      case "GET_PHONE_INBOX": {
        const threads = (mem.save.systems.phone.threads ?? []).map((t: any) => ({ id: t.id, title: t.title, unread: t.unread ?? 0 }));
        return { kind: "PHONE_INBOX", threads };
      }
      case "GET_PHONE_THREAD": {
        const thread = (mem.save.systems.phone.threads ?? []).find((t: any) => t.id === desc.threadId);
        if (!thread) throw new Error("Thread not found.");
        thread.unread = 0;
        await persistCurrent();
        return { kind: "PHONE_THREAD", threadId: desc.threadId, messages: thread.messages ?? [], replyOptions: thread.replies ?? [] };
      }
      case "PHONE_REPLY": {
        const thread = (mem.save.systems.phone.threads ?? []).find((t: any) => t.id === desc.threadId);
        const reply = thread?.replies?.find((r: any) => r.id === desc.replyId);
        if (!thread || !reply) throw new Error("Reply option unavailable.");
        thread.messages.push({ id: makeId("msg_user", `${desc.threadId}:${desc.replyId}:${thread.messages.length}`), from: "You", text: reply.label });
        const effects: Record<string, { relationship: number; interest: number; text: string }> = {
          polite: { relationship: 6, interest: 4, text: "Owner: Good. Keep me informed." },
          aggressive: { relationship: -8, interest: -5, text: "Owner: I expect professionalism." },
          defer: { relationship: 1, interest: 0, text: "Owner: Fine, but clock is ticking." },
          negotiate: { relationship: 2, interest: 6, text: "Owner: Show me value and we'll discuss budget." }
        };
        const fx = effects[desc.replyId] ?? { relationship: 0, interest: 0, text: "Owner: Understood." };
        mem.save.systems.phone.relationship = Math.max(0, Math.min(100, (mem.save.systems.phone.relationship ?? 50) + fx.relationship));
        mem.save.systems.phone.interest = Math.max(0, Math.min(100, (mem.save.systems.phone.interest ?? 50) + fx.interest));
        thread.messages.push({ id: makeId("msg_owner", `${desc.threadId}:${desc.replyId}:resp`), from: "Owner", text: fx.text });
        await persistCurrent();
        return { kind: "PHONE_REPLY_RESULT", threadId: desc.threadId, relationship: mem.save.systems.phone.relationship, interest: mem.save.systems.phone.interest };
      }
      case "GET_INTERVIEW_LIST": {
        const candidates = (mem.save.systems.interviews.pool ?? []).map((c: any) => ({ id: c.id, name: c.name, role: c.role, status: c.status }));
        return { kind: "INTERVIEW_LIST", candidates };
      }
      case "START_INTERVIEW": {
        const cand = (mem.save.systems.interviews.pool ?? []).find((c: any) => c.id === desc.candidateId);
        if (!cand) throw new Error("Interview candidate not found.");
        const sessionId = makeId("ivs", `${cand.id}:${mem.save.game.timeline.tick}`);
        const session = {
          sessionId,
          candidate: { id: cand.id, name: cand.name, role: cand.role },
          questions: buildInterviewQuestions(cand.id),
          currentIndex: 0,
          finished: false,
          fitScore: cand.fitBase,
          reputationDelta: cand.repBase - 50,
          ownerDelta: 0
        };
        mem.save.systems.interviews.sessions[sessionId] = session;
        await persistCurrent();
        return { kind: "INTERVIEW_SESSION", session };
      }
      case "ANSWER_INTERVIEW": {
        const session = mem.save.systems.interviews.sessions[desc.sessionId];
        if (!session) throw new Error("Interview session not found.");
        if (session.finished) return { kind: "INTERVIEW_STEP_RESULT", session };
        const q = session.questions[session.currentIndex];
        const option = q?.options?.find((o: any) => o.id === desc.optionId);
        if (!q || !option) throw new Error("Invalid interview answer.");
        session.fitScore += option.fitDelta;
        session.reputationDelta += option.repDelta;
        session.ownerDelta += option.ownerDelta;
        session.currentIndex += 1;
        if (session.currentIndex >= session.questions.length) {
          session.finished = true;
          const offerRecommended = session.fitScore >= 58;
          session.outcome = {
            offerRecommended,
            salary: offerRecommended ? 1.4 + (session.fitScore % 5) * 0.1 : 0,
            years: offerRecommended ? 2 + (session.reputationDelta > 8 ? 1 : 0) : 0,
            ownerNote: session.ownerDelta >= 4 ? "Owner sees strong budget alignment." : "Owner worried about cost/fit alignment.",
            fitScore: session.fitScore,
            reputationDelta: session.reputationDelta
          };
          const poolEntry = mem.save.systems.interviews.pool.find((c: any) => c.id === session.candidate.id);
          if (poolEntry) poolEntry.status = offerRecommended ? "offer-ready" : "pass";
          mem.save.systems.interviews.history.push({ candidateId: session.candidate.id, outcome: session.outcome, atTick: mem.save.game.timeline.tick });
        }
        await persistCurrent();
        return { kind: "INTERVIEW_STEP_RESULT", session };
      }
      case "GET_CONTRACTS":
        return { kind: "CONTRACTS", contracts: mem.save.systems.contracts.expiring ?? [] };
      case "SAVE_GAME":
        await persistCurrent();
        return { kind: "SAVE_STATUS", status: "Game saved." };
      case "NEW_GAME":
        await ensureLoaded(true);
        return { kind: "SAVE_STATUS", status: "Started new game." };
      case "RECOVER_SAVE": {
        try {
          const backup = await persistence.load(BACKUP_SAVE_ID);
          mem.save = backup;
          mem.leagueState = backup.systems?.phaseEngine ?? buildInitialLeagueState(backup);
          await persistCurrent(false);
          return { kind: "SAVE_STATUS", status: "Recovered from backup." };
        } catch {
          return { kind: "SAVE_STATUS", status: "No backup found to recover." };
        }
      }
      case "ADVANCE_WEEK": {
        try {
          const result = await advanceAsync(mem.leagueState, { type: "ADVANCE_WEEK", expectedPhaseVersion: desc.expectedPhaseVersion }, { saveId: SAVE_ID, checkpointPort: checkpointNowPort });
          mem.leagueState = result.state;
          mem.save.systems.phaseEngine = mem.leagueState;
          mem.save.game.timeline.tick += 1;
          mem.save.game.clock.week += 1;
          await persistCurrent();
          return { kind: "PHASE_SYNC", phaseVersion: mem.leagueState.phaseVersion };
        } catch (e: any) {
          if (e instanceof GateBlockedError || e?.kind === "GATE_BLOCKED") throw e;
          if (e instanceof PhaseVersionMismatchError || e?.kind === "PHASE_VERSION_MISMATCH") throw e;
          throw e;
        }
      }
      default:
        return { kind: "PHASE_SYNC", phaseVersion: mem.leagueState.phaseVersion };
    }
  }
};
