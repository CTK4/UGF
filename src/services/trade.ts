import type { TableRegistry } from "@/data/TableRegistry";
import { buildPlayerContractView, teamCapSummary, applyCapDelta, tradeDeadCapOriginalTeam, acquiringTeamCapHit } from "@/services/contracts";
import { getOwnerConfidence } from "@/services/owner";
import type { SaveStateV3 } from "@/ui/types";

export type TradeAsset =
  | { kind: "pick"; yearOffset: number; round: number; overall?: number; ownerTeamId?: string }
  | { kind: "player"; playerId: string; ownerTeamId?: string };

export type TradeOffer = {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  give: TradeAsset[]; // assets from fromTeam -> toTeam
  get: TradeAsset[]; // assets from toTeam -> fromTeam
  createdTick: number;
  phase: "draft" | "season";
  rationale?: string;
  status: "pending" | "accepted" | "rejected" | "countered";
  eval?: {
    from: TradeEval;
    to: TradeEval;
  };
};

export type TradeEval = {
  netGain: number;
  threshold: number;
  friction: number;
  riskBuffer: number;
  effIn: number;
  effOut: number;
  drivers: string[];
};

function hash32(seed: number, ...parts: Array<string | number | undefined | null>): number {
  let h = 2166136261 >>> 0;
  const s = `${seed}|${parts.map((p) => String(p ?? "")).join("|")}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function unit(seed: number, ...parts: Array<string | number | undefined | null>): number {
  return (hash32(seed, ...parts) % 1_000_000) / 1_000_000;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// ---- Draft pick value curve (TVU) ----
export function pickBaseTVU(pOverall: number): number {
  const A = 10000;
  const B = 10;
  const k = 0.62;
  return A * Math.pow(pOverall + B, -k);
}

export function futureFactor(yearOffset: number): number {
  const d = 0.15;
  return Math.pow(1 - d, Math.max(0, yearOffset));
}

export function estimateStrengthScore(reg: TableRegistry, teamId: string): number {
  // 0..1 (very weak..very strong)
  const rows = reg.getTable("Team Summary") as any[];
  const r = rows.find((x) => String(x.Team ?? "").trim() === teamId) ?? (rows[0] ?? {});
  const wins = Number(r.Wins ?? r.W ?? 0);
  const losses = Number(r.Losses ?? r.L ?? 0);
  const games = Math.max(1, wins + losses);

  const winPct = wins / games; // 0..1
  const ovr = Number(r.OVR ?? r.Overall ?? 70);
  const ovr01 = clamp(ovr / 100, 0, 1);

  // blend: win pct dominates if present; otherwise use ovr
  return clamp(0.65 * winPct + 0.35 * ovr01, 0.05, 0.95);
}

export function estimateFuturePickOverall(reg: TableRegistry, teamId: string, round: number): number {
  const s = estimateStrengthScore(reg, teamId);
  // buckets
  const slot =
    s <= 0.20 ? 6 :
    s <= 0.35 ? 10 :
    s <= 0.60 ? 16 :
    s <= 0.78 ? 23 :
    27;
  return (Math.max(1, round) - 1) * 32 + slot;
}

export function pickTVU(reg: TableRegistry, asset: Extract<TradeAsset, { kind: "pick" }>): number {
  const overall = asset.overall ?? estimateFuturePickOverall(reg, asset.ownerTeamId ?? "Unknown", asset.round);
  return pickBaseTVU(overall) * futureFactor(asset.yearOffset);
}

// ---- Player value (surplus-based) ----
const POS_MULT: Record<string, number> = {
  QB: 1.55, EDGE: 1.25, OT: 1.20, CB: 1.18, WR: 1.12, DI: 1.05, S: 1.02, OGC: 0.98, LB: 0.95, TE: 0.92, RB: 0.75, K: 0.25,
};
const POS_SHARE: Record<string, number> = {
  QB: 0.20, EDGE: 0.12, OT: 0.11, CB: 0.10, WR: 0.10, DI: 0.09, OGC: 0.08, LB: 0.08, S: 0.07, TE: 0.07, RB: 0.05, K: 0.01,
};
const PRIME: Record<string, number> = { QB: 30, OT: 29, OGC: 29, WR: 27, CB: 27, S: 27, EDGE: 28, DI: 28, LB: 28, TE: 28, RB: 25, K: 31 };

function posGroup(pos: string): string {
  const p = String(pos ?? "").toUpperCase();
  if (p === "QB") return "QB";
  if (["EDGE", "DE", "OLB"].includes(p)) return "EDGE";
  if (["OT", "T"].includes(p)) return "OT";
  if (["CB"].includes(p)) return "CB";
  if (["WR"].includes(p)) return "WR";
  if (["DI", "DT", "IDL"].includes(p)) return "DI";
  if (["S", "FS", "SS"].includes(p)) return "S";
  if (["OG", "C", "G"].includes(p)) return "OGC";
  if (["LB", "ILB", "MLB"].includes(p)) return "LB";
  if (["TE"].includes(p)) return "TE";
  if (["RB", "HB"].includes(p)) return "RB";
  if (["K", "P", "LS"].includes(p)) return "K";
  return p || "UNK";
}

function perfFactor(ovr: number): number {
  const x = clamp((ovr - 60) / 35, 0, 1);
  return 0.30 + 0.75 * Math.pow(x, 1.7);
}

function ageFactor(pos: string, age: number): number {
  const g = posGroup(pos);
  const prime = PRIME[g] ?? 28;
  const gamma = g === "RB" ? 0.010 : 0.006;
  const v = 1 - gamma * Math.pow(age - prime, 2);
  return clamp(v, 0.70, 1.05);
}

export function estimateMarketAAV(cap: number, pos: string, ovr: number, age: number): number {
  const g = posGroup(pos);
  const share = POS_SHARE[g] ?? 0.07;
  const a = ageFactor(g, age);
  const p = perfFactor(ovr);
  return cap * share * p * a;
}

export function playerTVU(reg: TableRegistry, save: SaveStateV3, asset: Extract<TradeAsset, { kind: "player" }>, perspectiveTeamId: string): number {
  const roster = reg.getTable("Roster") as any[];
  const adds = (save.rosterAdditions ?? []) as any[];
  const id = String(asset.playerId).replace(/^p:/, "");
  const row = roster.find((r) => String(r["Player ID"] ?? "") === id) ?? adds.find((r) => String(r["Player ID"] ?? "") === id);
  if (!row) return 0;

  const pos = String(row.Pos ?? row.Position ?? "");
  const age = Number(row.Age ?? 26);
  const ovr = Number(row.OVR ?? row.Overall ?? 70);

  const cap = 240; // mm
  const market = estimateMarketAAV(cap, pos, ovr, age);
  const capHit = Number((row as any).CapHit ?? (row as any).AAV ?? market * 0.85);
  const impactDollars = market * 1.05 * (POS_MULT[posGroup(pos)] ?? 1.0);

  const surplus = Math.max(0, impactDollars - capHit);

  // convert dollars->TVU. 1 "cap unit" ~ 25 TVU (tunable)
  const dollarsToTVU = 25;
  let base = surplus * dollarsToTVU;

  // certainty: user doesn't know true value; small team-specific modifier
  const cert = clamp(0.85 + unit(save.seed ?? 2026, "player:cert", perspectiveTeamId, id) * 0.20, 0.75, 1.05);
  base *= cert;

  return base;
}

// ---- Team context modifiers ----
export function needMultiplier(reg: TableRegistry, teamId: string, posGroupKey: string): number {
  // 0.85..1.25 based on simple roster stress
  const roster = reg.getTable("Roster") as any[];
  const desired: Record<string, number> = { QB: 3, WR: 10, RB: 5, TE: 5, OT: 6, OGC: 9, EDGE: 7, DI: 6, LB: 7, CB: 7, S: 6, K: 3 };
  const counts: Record<string, number> = {};
  for (const r of roster) {
    const t = String(r.Team ?? "").trim();
    if (t !== teamId) continue;
    const g = posGroup(String(r.Pos ?? r.Position ?? ""));
    counts[g] = (counts[g] ?? 0) + 1;
  }
  const want = desired[posGroupKey] ?? 6;
  const c = counts[posGroupKey] ?? 0;
  const need = clamp(1 - clamp(c / want, 0, 1), 0, 1);
  return clamp(0.85 + need * 0.40, 0.85, 1.25);
}

export function windowMultiplier(reg: TableRegistry, teamId: string): number {
  // rebuilding teams value future picks more; contenders value current value more
  const s = estimateStrengthScore(reg, teamId); // higher => contender
  return clamp(0.90 + (0.60 - s) * 0.25, 0.80, 1.15);
}

export type TeamTradeProfile = {
  aggression: number; // 0..1
  riskTolerance: number; // 0..1
  personality: "aggressive" | "normal" | "conservative";
};

export function tradeProfile(seed: number, teamId: string): TeamTradeProfile {
  const aggression = clamp(0.15 + unit(seed, "trade:agg", teamId) * 0.80, 0, 1);
  const riskTolerance = clamp(0.15 + unit(seed, "trade:risk", teamId) * 0.80, 0, 1);
  const r = unit(seed, "trade:personality", teamId);
  const personality = r < 0.25 ? "conservative" : r < 0.75 ? "normal" : "aggressive";
  return { aggression, riskTolerance, personality };
}

function thresholdBase(personality: TeamTradeProfile["personality"]): number {
  const T0 = 60;
  const mult = personality === "aggressive" ? 0.7 : personality === "conservative" ? 1.3 : 1.0;
  return T0 * mult;
}

function friction(assets: TradeAsset[]): number {
  const c0 = 40;
  const c1 = 15;
  const c2 = 25;
  const players = assets.filter((a) => a.kind === "player").length;
  return c0 + c1 * assets.length + c2 * players;
}

function uncertaintyScore(assets: TradeAsset[], save: SaveStateV3, teamId: string): number {
  let u = 0;
  for (const a of assets) {
    if (a.kind === "pick") u += 1 + a.yearOffset * 0.8;
    if (a.kind === "player") u += 1.2;
  }
  // small team noise
  u *= 0.95 + unit(save.seed ?? 2026, "uncert", teamId) * 0.10;
  return u;
}

export function assetTVU(reg: TableRegistry, save: SaveStateV3, asset: TradeAsset, perspectiveTeamId: string): number {
  if (asset.kind === "pick") return pickTVU(reg, { ...asset, ownerTeamId: asset.ownerTeamId ?? perspectiveTeamId });
  return playerTVU(reg, save, { ...asset, ownerTeamId: asset.ownerTeamId ?? perspectiveTeamId }, perspectiveTeamId);
}

export function evalOffer(reg: TableRegistry, save: SaveStateV3, offer: TradeOffer, perspectiveTeamId: string): TradeEval {
  const seed = save.seed ?? 2026;
  const prof = tradeProfile(seed, perspectiveTeamId);
  const leverage = offer.toTeamId === perspectiveTeamId ? 1.1 : 1.0;
  const threshold = thresholdBase(prof.personality) * leverage;

  const incoming = perspectiveTeamId === offer.fromTeamId ? offer.get : offer.give;
  const outgoing = perspectiveTeamId === offer.fromTeamId ? offer.give : offer.get;

  const effValue = (a: TradeAsset, isIncoming: boolean) => {
    const base = assetTVU(reg, save, a, perspectiveTeamId);
    if (a.kind === "player") {
      const roster = reg.getTable("Roster") as any[];
      const adds = (save.rosterAdditions ?? []) as any[];
      const id = String(a.playerId).replace(/^p:/, "");
      const row = roster.find((r) => String(r["Player ID"] ?? "") === id) ?? adds.find((r) => String(r["Player ID"] ?? "") === id);
      const g = posGroup(String(row?.Pos ?? row?.Position ?? ""));
      const needM = needMultiplier(reg, perspectiveTeamId, g);
      return base * needM;
    }
    // pick: rebuilding vs contending
    const winM = windowMultiplier(reg, perspectiveTeamId);
    const futM = a.yearOffset > 0 ? winM : (2 - winM);
    return base * clamp(futM, 0.80, 1.25);
  };

  const effIn = incoming.reduce((acc, a) => acc + effValue(a, true), 0);
  const effOut = outgoing.reduce((acc, a) => acc + effValue(a, false), 0);

  const allAssets = [...offer.give, ...offer.get];
  const fr = friction(allAssets);
  const rho = 35;
  const riskBuffer = rho * uncertaintyScore(allAssets, save, perspectiveTeamId);

  // bounded valuation noise (2..6% of total)
  const noisePct = 0.02 + unit(seed, "noisePct", perspectiveTeamId, offer.id) * 0.04;
  const noise = (unit(seed, "noiseSign", perspectiveTeamId, offer.id) - 0.5) * 2 * (effIn + effOut) * noisePct * 0.20;

  const netGain = (effIn - effOut) - fr - riskBuffer + noise;

  const drivers: string[] = [];
  drivers.push(`EffIn ${Math.round(effIn)} vs EffOut ${Math.round(effOut)}`);
  drivers.push(`Friction ${Math.round(fr)}; Risk ${Math.round(riskBuffer)}`);
  drivers.push(`Threshold ${Math.round(threshold)}`);

  return { netGain, threshold, friction: fr, riskBuffer, effIn, effOut, drivers };
}

export function acceptDecision(reg: TableRegistry, save: SaveStateV3, offer: TradeOffer, teamId: string): { accept: boolean; eval: TradeEval; rationale: string } {
  const ev = evalOffer(reg, save, offer, teamId);
  const gap = ev.threshold - ev.netGain;
  const accept = ev.netGain >= ev.threshold;

  if (accept) return { accept: true, eval: ev, rationale: "Accepted: value meets threshold." };
  if (gap > 220) return { accept: false, eval: ev, rationale: "Rejected: too far apart." };

  const reasons: string[] = [];
  if (ev.effOut > ev.effIn) reasons.push("Value short on our side.");
  if (ev.riskBuffer > 180) reasons.push("Too much uncertainty.");
  if (offer.get.some((a) => a.kind === "player")) reasons.push("Player cost/fit concerns.");
  const rationale = reasons.slice(0, 2).join(" ") || "We need more value to make this deal work.";

  return { accept: false, eval: ev, rationale };
}

// ---- Offer generation (draft-day, user on the clock) ----
export function generateInboundDraftOffers(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  fromTeamId: string; // user
  pickNo: number;
  seed: number;
  maxOffers?: number;
}): TradeOffer[] {
  const maxOffers = args.maxOffers ?? 3;
  const order = args.save.draft?.order ?? [];
  const idx = order.findIndex((o) => o.pickNo === args.pickNo);
  if (idx < 0) return [];

  const userTeam = args.fromTeamId;
  const partners = order.slice(idx + 1, idx + 10).map((o) => o.teamId);
  const uniquePartners = Array.from(new Set(partners)).filter((t) => t !== userTeam);

  const offers: TradeOffer[] = [];

  for (let pi = 0; pi < uniquePartners.length && offers.length < maxOffers; pi++) {
    const partner = uniquePartners[pi];
    const prof = tradeProfile(args.seed, partner);
    const wantMove = unit(args.seed, "draft:wantMove", args.pickNo, partner) < (0.10 + prof.aggression * 0.25);
    if (!wantMove) continue;

    // build ladder: swap picks + sweeteners from partner
    const partnerPick = order.find((o) => o.teamId === partner && o.pickNo > args.pickNo);
    if (!partnerPick) continue;

    const baseOffer: TradeOffer = {
      id: `draftOffer-${args.pickNo}-${partner}`,
      fromTeamId: userTeam,
      toTeamId: partner,
      phase: "draft",
      createdTick: args.save.tick ?? 0,
      status: "pending",
      give: [{ kind: "pick", yearOffset: 0, round: partnerPick.round, overall: args.pickNo, ownerTeamId: userTeam }],
      get: [{ kind: "pick", yearOffset: 0, round: partnerPick.round, overall: partnerPick.pickNo, ownerTeamId: partner }],
    };

    const sweeteners: TradeAsset[] = [
      { kind: "pick", yearOffset: 0, round: partnerPick.round + 1, overall: partnerPick.pickNo + 32, ownerTeamId: partner },
      { kind: "pick", yearOffset: 1, round: 3, ownerTeamId: partner },
      { kind: "pick", yearOffset: 1, round: 2, ownerTeamId: partner },
    ];

    let built: TradeOffer | null = null;
    for (let si = 0; si <= sweeteners.length; si++) {
      const candidate = { ...baseOffer, get: [...baseOffer.get, ...sweeteners.slice(0, si)] };
      const partnerDecision = acceptDecision(args.reg, args.save, candidate, partner);
      if (partnerDecision.accept) {
        const userDecision = acceptDecision(args.reg, args.save, candidate, userTeam);
        candidate.eval = { from: userDecision.eval, to: partnerDecision.eval };
        candidate.rationale = `They want to move up (tier pressure). ${partnerDecision.rationale}`;
        built = candidate;
        break;
      }
    }

    if (built) offers.push(built);
  }

  return offers;
}

// ---- Apply trade (mutate save + draft order) ----
export function applyTrade(args: { reg: TableRegistry; save: SaveStateV3; offer: TradeOffer }): SaveStateV3 {
  const save = args.save;
  const o = args.offer;

  const movePickOwnership = (asset: TradeAsset, newOwner: string) => {
    if (asset.kind !== "pick") return;
    if (asset.yearOffset !== 0 || !asset.overall) return;
    // update draft order owner for that pick
    const d = save.draft;
    if (!d) return;
    const idx = d.order.findIndex((x) => x.pickNo === asset.overall);
    if (idx >= 0) d.order[idx] = { ...d.order[idx], teamId: newOwner };
  };

  const playerTeamOverride = { ...(save.playerTeamOverride ?? {}) } as Record<string, string>;
  const inv = { ...(save.pickInventory ?? {}) } as any;

    const movePickInventory = (asset: TradeAsset, fromOwner: string, toOwner: string) => {
      if (asset.kind !== "pick") return;
      const removeFrom = (inv[fromOwner] ?? []).filter((p: any) => !(p.yearOffset === asset.yearOffset && p.round === asset.round && (asset.overall ? p.overall === asset.overall : true)));
      inv[fromOwner] = removeFrom;
      (inv[toOwner] ??= []).push({ yearOffset: asset.yearOffset, round: asset.round, overall: asset.overall });
    };

    const movePlayer = (asset: TradeAsset, newOwner: string) => {
    if (asset.kind !== "player") return;
    const id = String(asset.playerId).replace(/^p:/, "");
    playerTeamOverride[id] = newOwner;
  };

  // fromTeam gives -> toTeam
  for (const a of o.give) {
    if (a.kind === "pick") { movePickOwnership(a, o.toTeamId); movePickInventory(a, o.fromTeamId, o.toTeamId); }
    if (a.kind === "player") movePlayer(a, o.toTeamId);
  }
  // toTeam gives -> fromTeam
  for (const a of o.get) {
    if (a.kind === "pick") { movePickOwnership(a, o.fromTeamId); movePickInventory(a, o.toTeamId, o.fromTeamId); }
    if (a.kind === "player") movePlayer(a, o.fromTeamId);
  }

  
// Cap deltas: move AAV cap hits with players; apply dead cap to sending team.
let capSave: any = save;
for (const o of normalized) {
  for (const a of o.assets) {
    if (a.kind !== "player") continue;
    const row = (reg.getTable("Roster") as any[]).find((r) => String(r["Player ID"] ?? "") === a.playerId);
    const contract = row ? buildPlayerContract(reg, row) : null;
    const aav = contract?.aav ?? 0;
    const dead = contract?.deadCapNow ?? 0;

    // from loses cap hit; may eat dead cap
    capSave = applyCapDelta(capSave, o.fromTeamId, { capHitsDelta: -aav, deadCapDelta: dead * 0.15 });
    // to gains cap hit
    capSave = applyCapDelta(capSave, o.toTeamId, { capHitsDelta: +aav });
  }
}
return { ...(capSave as any), playerTeamOverride, pickInventory: inv };
}

export function openTradeThread(save: SaveStateV3, otherTeamId: string, seed: number): { threadId: string; save: SaveStateV3 } {
  const threads = { ...(save.tradeThreads ?? {}) } as any;
  const existing = Object.values(threads).find((t: any) => t.otherTeamId === otherTeamId && t.status === "open");
  if (existing) return { threadId: existing.id, save };

  const tick = save.tick ?? 0;
  const threadId = `trade-${tick}-${otherTeamId}-${Math.floor(unit(seed, "thread", otherTeamId, tick) * 1e6)}`;
  threads[threadId] = {
    id: threadId,
    otherTeamId,
    offers: [],
    status: "open",
    createdTick: tick,
    updatedTick: tick,
    countersUsed: 0,
  };
  return { threadId, save: { ...save, tradeThreads: threads } };
}

export function appendOfferToThread(save: SaveStateV3, threadId: string, offer: TradeOffer): SaveStateV3 {
  const threads = { ...(save.tradeThreads ?? {}) } as any;
  const t = threads[threadId];
  if (!t) return save;
  t.offers = [...(t.offers ?? []), offer];
  t.updatedTick = save.tick ?? 0;
  threads[threadId] = t;
  return { ...save, tradeThreads: threads };
}

export function closeThread(save: SaveStateV3, threadId: string): SaveStateV3 {
  const threads = { ...(save.tradeThreads ?? {}) } as any;
  const t = threads[threadId];
  if (!t) return save;
  t.status = "closed";
  t.updatedTick = save.tick ?? 0;
  threads[threadId] = t;
  return { ...save, tradeThreads: threads };
}

function pickValueForTeam(reg: TableRegistry, save: SaveStateV3, teamId: string, asset: Extract<TradeAsset, { kind: "pick" }>) {
  return assetTVU(reg, save, { ...asset, ownerTeamId: teamId }, teamId);
}

// Try to build a counter by adding a sweetener on the side that's short.
export function buildCounterOffer(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  threadId: string;
  lastOffer: TradeOffer;
  counteringTeamId: string;
  maxCounters: number;
}): { offer: TradeOffer | null; rationale: string } {
  const seed = args.save.seed ?? 2026;
  const last = args.lastOffer;

  const ev = evalOffer(args.reg, args.save, last, args.counteringTeamId);
  const gap = ev.threshold - ev.netGain;
  if (gap > 220) return { offer: null, rationale: "Too far apart to counter." };

  // Determine which side should add value from countering perspective
  // If I'm the receiver (toTeamId), and netGain is low, I ask for more (increase what I receive).
  const wantMoreFromOther = true;

  // Sweetener candidates: future picks from the other team (simple, deterministic)
  const otherTeamId = args.counteringTeamId === last.toTeamId ? last.fromTeamId : last.toTeamId;
  const candidates: TradeAsset[] = [
    { kind: "pick", yearOffset: 1, round: 4, ownerTeamId: otherTeamId },
    { kind: "pick", yearOffset: 1, round: 3, ownerTeamId: otherTeamId },
    { kind: "pick", yearOffset: 1, round: 2, ownerTeamId: otherTeamId },
    { kind: "pick", yearOffset: 0, round: 4, overall: undefined, ownerTeamId: otherTeamId },
  ];

  let best: TradeOffer | null = null;

  for (const c of candidates) {
    const candidate: TradeOffer = {
      ...last,
      id: `${last.id}-counter-${args.counteringTeamId}-${c.kind}-${c.kind === "pick" ? `${c.yearOffset}-${c.round}` : ""}`,
      status: "countered",
      createdTick: args.save.tick ?? 0,
    };

    // Counter: add sweetener from other side to me (increase my incoming)
    if (args.counteringTeamId === candidate.toTeamId) {
      // toTeam is evaluating. Improve by asking for more from fromTeam: add to candidate.get (assets to fromTeam)?? careful:
      // offer.give: from->to. offer.get: to->from.
      // If counteringTeamId is toTeamId, they receive offer.give. To ask for more, add asset to offer.give from other team (fromTeam).
      candidate.give = [...candidate.give, c];
    } else {
      // counteringTeam is fromTeam. They receive offer.get; ask for more from toTeam: add to offer.get (to->from)
      candidate.get = [...candidate.get, c];
    }

    const dec = acceptDecision(args.reg, args.save, candidate, args.counteringTeamId);
    if (dec.accept) {
      best = candidate;
      best.eval = best.eval ?? ({} as any);
      break;
    }
  }

  if (!best) return { offer: null, rationale: "Could not construct a reasonable counter." };
  return { offer: best, rationale: "Counter: value gap was small; requesting additional compensation." };
}

// CPU↔CPU draft trades: limited frequency; swap picks when tier pressure hits.
export function simulateCpuCpuDraftTrades(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  seed: number;
  maxPerRound?: number;
}): { save: SaveStateV3; events: string[] } {
  const d = args.save.draft;
  if (!d) return { save: args.save, events: [] };

  const events: string[] = [];
  const maxPerRound = args.maxPerRound ?? 1;

  const cur = d.order[d.currentPickIndex];
  if (!cur) return { save: args.save, events };

  const round = cur.round;
  let used = 0;

  for (let i = d.currentPickIndex; i < Math.min(d.currentPickIndex + 6, d.order.length) && used < maxPerRound; i++) {
    const slot = d.order[i];
    const team = slot.teamId;
    const prof = tradeProfile(args.seed, team);
    const wants = unit(args.seed, "cpu-cpu:try", round, slot.pickNo, team) < (0.03 + prof.aggression * 0.06);
    if (!wants) continue;

    // find partner within next 10 picks
    const partnerSlot = d.order.slice(i + 1, i + 11).find((p) => p.teamId !== team);
    if (!partnerSlot) continue;

    // Occasionally bundle an extra pick or request a swap (player+pick bundle behavior)
const bundleRoll = unit(seed, "season:bundle", t, partner, args.save.tick ?? 0);
const extraPick: TradeAsset | null =
  bundleRoll < 0.33 ? { kind: "pick", yearOffset: 1, round: 6, ownerTeamId: t } :
  bundleRoll < 0.66 ? { kind: "pick", yearOffset: 1, round: 5, ownerTeamId: t } :
  null;

const askSwap: boolean = bundleRoll > 0.70;


          const offer: TradeOffer = {
      id: `cpu-cpu-${round}-${slot.pickNo}-${team}-to-${partnerSlot.teamId}`,
      fromTeamId: team,
      toTeamId: partnerSlot.teamId,
      phase: "draft",
      createdTick: args.save.tick ?? 0,
      status: "pending",
      give: [{ kind: "pick", yearOffset: 0, round: slot.round, overall: slot.pickNo, ownerTeamId: team }],
      get: [{ kind: "pick", yearOffset: 0, round: partnerSlot.round, overall: partnerSlot.pickNo, ownerTeamId: partnerSlot.teamId }],
    };

    // Add sweetener from mover if needed (trade up)
    const sweet = { kind: "pick" as const, yearOffset: 1, round: 3, ownerTeamId: team };
    const offer2 = { ...offer, give: [...offer.give, sweet] };

    const a1 = acceptDecision(args.reg, args.save, offer2, team);
    const a2 = acceptDecision(args.reg, args.save, offer2, partnerSlot.teamId);
    if (!a1.accept || !a2.accept) continue;

    const applied = applyTrade({ reg: args.reg, save: args.save, offer: offer2 });
    args.save = applied;
    events.push(`${team} traded with ${partnerSlot.teamId} (draft picks swapped).`);
    used++;
  }

  return { save: args.save, events };
}

export function buildDraftTradeUpLadder(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  fromTeamId: string;
  toTeamId: string;
  fromPickNo: number;
  toPickNo: number;
  seed: number;
}): TradeOffer[] {
  // Template ladder:
  // A: swap picks
  // B: + current-year later pick
  // C: + next-year mid pick
  // D: + two sweeteners
  const base: TradeOffer = {
    id: `ladder-${args.fromPickNo}-to-${args.toPickNo}-${args.toTeamId}-A`,
    fromTeamId: args.fromTeamId,
    toTeamId: args.toTeamId,
    phase: "draft",
    createdTick: args.save.tick ?? 0,
    status: "pending",
    give: [{ kind: "pick", yearOffset: 0, round: 1, overall: args.fromPickNo, ownerTeamId: args.fromTeamId }],
    get: [{ kind: "pick", yearOffset: 0, round: 1, overall: args.toPickNo, ownerTeamId: args.toTeamId }],
    rationale: "Offer A: swap picks.",
  };

  const sweet1: TradeAsset = { kind: "pick", yearOffset: 0, round: 3, overall: args.fromPickNo + 64, ownerTeamId: args.fromTeamId };
  const sweet2: TradeAsset = { kind: "pick", yearOffset: 1, round: 3, ownerTeamId: args.fromTeamId };
  const sweet3: TradeAsset = { kind: "pick", yearOffset: 1, round: 2, ownerTeamId: args.fromTeamId };

  const offers: TradeOffer[] = [
    base,
    { ...base, id: base.id.replace("-A", "-B"), give: [...base.give, sweet1], rationale: "Offer B: add current-year sweetener." },
    { ...base, id: base.id.replace("-A", "-C"), give: [...base.give, sweet2], rationale: "Offer C: add future sweetener." },
    { ...base, id: base.id.replace("-A", "-D"), give: [...base.give, sweet2, sweet3], rationale: "Offer D: add two future sweeteners." },
  ];

  for (const o of offers) {
    const fromEval = evalOffer(args.reg, args.save, o, args.fromTeamId);
    const toEval = evalOffer(args.reg, args.save, o, args.toTeamId);
    o.eval = { from: fromEval as any, to: toEval as any };
  }
  return offers;
}

export function simulateCpuCpuSeasonTrades(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  seed: number;
  maxTradesPerWeek?: number;
}): { save: SaveStateV3; events: string[] } {
  const maxTrades = args.maxTradesPerWeek ?? 2;
  const events: string[] = [];
  const seed = args.seed;

  const teams = Array.from(new Set((args.reg.getTable("Team Summary") as any[]).map((r) => String(r.Team ?? "").trim()).filter(Boolean)));
  if (!teams.length) return { save: args.save, events };

  // sample a few initiators
  const initiators = teams
    .map((t) => ({ t, roll: unit(seed, "season:init", args.save.tick ?? 0, t) }))
    .sort((a, b) => a.roll - b.roll)
    .slice(0, 6)
    .map((x) => x.t);

  let save = args.save;

  for (const t of initiators) {
    if (events.length >= maxTrades) break;
    const prof = tradeProfile(seed, t);
    const tryTrade = unit(seed, "season:try", args.save.tick ?? 0, t) < (0.04 + prof.aggression * 0.06);
    if (!tryTrade) continue;

    // pick partner with complementary window
    const sT = estimateStrengthScore(args.reg, t);
    const candidates = teams.filter((x) => x !== t);
    const partner = candidates
      .map((p) => ({ p, d: Math.abs(estimateStrengthScore(args.reg, p) - (1 - sT)) + unit(seed, "season:partner", t, p) * 0.05 }))
      .sort((a, b) => a.d - b.d)[0]?.p;

    if (!partner) continue;

    // choose a player from t (top 20 roster) and offer for a pick from partner
    const roster = args.reg.getTable("Roster") as any[];
    const tPlayers = roster.filter((r) => String(r.Team ?? "").trim() === t).slice(0, 30);
    const pPlayers = roster.filter((r) => String(r.Team ?? "").trim() === partner).slice(0, 30);

    const pickRound = unit(seed, "season:pickRound", t, partner, args.save.tick ?? 0) < 0.5 ? 3 : 4;
    const desiredPick: TradeAsset = { kind: "pick", yearOffset: 1, round: pickRound, ownerTeamId: partner };

    // choose player that partner might need: try match need multipliers by position
    const scored = tPlayers
      .map((r) => {
        const pos = String(r.Pos ?? "");
        const g = posGroup(pos);
        const needM = needMultiplier(args.reg, partner, g);
        const id = String(r["Player ID"] ?? "");
        const tvu = playerTVU(args.reg, save, { kind: "player", playerId: id, ownerTeamId: t }, partner);
        return { r, id, score: needM * tvu };
      })
      .filter((x) => x.id)
      .sort((a, b) => b.score - a.score);

    const chosen = scored[0];
    if (!chosen) continue;

    // Occasionally bundle an extra pick or request a swap (player+pick bundle behavior)
const bundleRoll = unit(seed, "season:bundle", t, partner, args.save.tick ?? 0);
const extraPick: TradeAsset | null =
  bundleRoll < 0.33 ? { kind: "pick", yearOffset: 1, round: 6, ownerTeamId: t } :
  bundleRoll < 0.66 ? { kind: "pick", yearOffset: 1, round: 5, ownerTeamId: t } :
  null;

const askSwap: boolean = bundleRoll > 0.70;


          const offer: TradeOffer = {
      id: `season-${args.save.tick ?? 0}-${t}-to-${partner}`,
      fromTeamId: t,
      toTeamId: partner,
      phase: "season",
      createdTick: args.save.tick ?? 0,
      status: "pending",
      give: [{ kind: "player", playerId: chosen.id, ownerTeamId: t }, ...(extraPick ? [extraPick] : [])],
      get: [desiredPick, ...(askSwap ? [{ kind: "pick", yearOffset: 1, round: 7, ownerTeamId: partner } as any] : [])],
      rationale: extraPick ? "CPU offer: player + pick bundle for future pick." : askSwap ? "CPU offer: player for pick bundle (swap sweetener)." : "CPU offer: player for future pick.",
    };

    const a1 = acceptDecision(args.reg, save, offer, t);
    const a2 = acceptDecision(args.reg, save, offer, partner);

    if (!a1.accept || !a2.accept) continue;

    save = applyTrade({ reg: args.reg, save, offer });
    events.push(`${t} traded ${String(chosen.r.Name ?? "a player")} to ${partner} for a future Round ${pickRound} pick.`);
  }

  return { save, events };
}

export function generateInboundSeasonOffersFromBlock(args: {
  reg: TableRegistry;
  save: SaveStateV3;
  userTeamId: string;
  playerIds: string[];
  seed: number;
  maxOffers?: number;
}): TradeOffer[] {
  const maxOffers = args.maxOffers ?? 4;
  const offers: TradeOffer[] = [];
  const inv = args.save.pickInventory ?? {};
  const roster = args.reg.getTable("Roster") as any[];

  const candidateTeams = Array.from(new Set((args.reg.getTable("Team Summary") as any[]).map((r) => String(r.Team ?? "").trim()).filter(Boolean)))
    .filter((t) => t && t !== args.userTeamId);

  for (const pid0 of args.playerIds) {
    if (offers.length >= maxOffers) break;
    const pid = String(pid0).replace(/^p:/, "");

    const row = roster.find((r) => String(r["Player ID"] ?? "") === pid);
    const pos = String(row?.Pos ?? "");
    const g = posGroup(pos);

    // pick 2 best-fit teams by need*value
    const scored = candidateTeams
      .map((t) => {
        const needM = needMultiplier(args.reg, t, g);
        const v = playerTVU(args.reg, args.save, { kind: "player", playerId: pid, ownerTeamId: args.userTeamId }, t);
        const roll = unit(args.seed, "block:team", pid, t) * 0.05;
        return { t, score: needM * v + roll };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    for (const s of scored) {
      if (offers.length >= maxOffers) break;

      // Build bundle offers (player+pick, multi-pick) from team -> user
      const theirPicks = (inv[s.t] ?? []).filter((p: any) => p.yearOffset >= 0).slice(0, 10);
      const basePick = theirPicks.find((p: any) => p.yearOffset === 1 && (p.round === 2 || p.round === 3)) ?? theirPicks.find((p: any) => p.yearOffset === 1 && p.round === 4);
      if (!basePick) continue;

      const offerA: TradeOffer = {
        id: `block-${pid}-${s.t}-A`,
        fromTeamId: args.userTeamId,
        toTeamId: s.t,
        phase: "season",
        createdTick: args.save.tick ?? 0,
        status: "pending",
        give: [{ kind: "player", playerId: pid, ownerTeamId: args.userTeamId }],
        get: [{ kind: "pick", yearOffset: basePick.yearOffset, round: basePick.round, overall: basePick.overall, ownerTeamId: s.t }],
        rationale: "Inbound: player for pick.",
        message: "We’re interested. Here’s our offer.",
      };

      // Offer B: player for pick + late pick (bundle)
      const late = theirPicks.find((p: any) => p.yearOffset === 1 && (p.round === 5 || p.round === 6 || p.round === 7));
      const offerB: TradeOffer = late
        ? {
            ...offerA,
            id: offerA.id.replace("-A", "-B"),
            get: [...offerA.get, { kind: "pick", yearOffset: late.yearOffset, round: late.round, overall: late.overall, ownerTeamId: s.t }],
            rationale: "Inbound: player for pick bundle.",
          }
        : offerA;

      // Offer C: player + your late pick for better pick (bundle both sides)
      const theirBetter = theirPicks.find((p: any) => p.yearOffset === 1 && p.round === 2) ?? basePick;
      const userLate: TradeAsset = { kind: "pick", yearOffset: 1, round: 6, ownerTeamId: args.userTeamId };
      const offerC: TradeOffer = {
        ...offerA,
        id: offerA.id.replace("-A", "-C"),
        give: [...offerA.give, userLate],
        get: [{ kind: "pick", yearOffset: theirBetter.yearOffset, round: theirBetter.round, overall: theirBetter.overall, ownerTeamId: s.t }],
        rationale: "Inbound: player + late pick for better pick.",
      };

      // Choose the first acceptable offer for them + not terrible for user
      const ladder = [offerA, offerB, offerC];

      let chosen: TradeOffer | null = null;
      for (const cand of ladder) {
        const them = acceptDecision(args.reg, args.save, cand, s.t);
        if (!them.accept) continue;

        const you = acceptDecision(args.reg, args.save, cand, args.userTeamId);
        cand.eval = { from: you.eval as any, to: them.eval as any };
        // avoid spam of offers that are clearly awful for user
        if (you.eval.netGain < you.eval.threshold * 0.6) continue;

        chosen = cand;
        break;
      }

      if (chosen) offers.push(chosen);
    }
  }

  return offers;
}
