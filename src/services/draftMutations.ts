import type { TableRegistry } from "@/data/TableRegistry";
import type { DraftState } from "@/ui/types";
import { buildPlayerContract } from "@/services/contracts";

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function posGroup(pos: string): string {
  const p = pos.toUpperCase();
  if (p === "QB") return "QB";
  if (["LT","RT","OT"].includes(p)) return "OT";
  if (["LG","RG","C","OL","G"].includes(p)) return "OG/C";
  if (["WR"].includes(p)) return "WR";
  if (["TE"].includes(p)) return "TE";
  if (["RB","HB","FB"].includes(p)) return "RB";
  if (["CB"].includes(p)) return "CB";
  if (["FS","SS","S"].includes(p)) return "S";
  if (["DE","EDGE","OLB"].includes(p)) return "EDGE";
  if (["DT","NT","IDL","DI"].includes(p)) return "DI";
  if (["ILB","MLB","LB"].includes(p)) return "LB";
  if (["K","P","LS"].includes(p)) return "K/P/LS";
  return "UNK";
}

// Deterministic rookie contract proxy based on pick slot.
function rookieContractFromPick(pickNo: number): { years: number; totalValueM: number; guaranteeM: number; aavM: number } {
  const years = pickNo <= 32 ? 4 : 3;
  // Smooth curve: early picks bigger. Values in millions.
  const base = 28 - Math.log(pickNo + 1) * 4.2; // ~25 at pick 1, ~9 at pick 32, ~4-6 later
  const totalValueM = Math.max(1.6, base) * years;
  const guaranteeM = totalValueM * (pickNo <= 32 ? 0.70 : 0.55);
  const aavM = totalValueM / years;
  return { years, totalValueM, guaranteeM, aavM };
}

export function applyDraftPickToLeague(args: {
  reg: TableRegistry;
  save: any;
  draft: DraftState;
  pickNo: number;
  teamId: string;
  playerId: string;
}): { save: any; headline: string; body: string } {
  const dc = args.reg.getTable("2026 Draft Class") as any[];
  const pRow = dc.find((r) => String(r["Player ID"] ?? "").trim() === args.playerId);
  const name = String(pRow?.Name ?? `Prospect ${args.playerId}`);
  const pos = String(pRow?.POS ?? "UNK");
  const tier = String(pRow?.DraftTier ?? "");
  const college = String(pRow?.College ?? "");

  const belief = args.draft.beliefByTeam?.[args.teamId]?.[args.playerId];
  const grade = belief?.grade ?? Math.round(toNum(pRow?.Rank ? 80 - (toNum(pRow.Rank) / 20) : 72));

  const { years, totalValueM, guaranteeM, aavM } = rookieContractFromPick(args.pickNo);

  const rosterAdditions = [...(args.save.rosterAdditions ?? [])];
  rosterAdditions.push({
    Team: args.teamId,
    Conference: "",
    Division: "",
    Market: "",
    PositionGroup: posGroup(pos),
    Position: pos,
    Pos: pos,
    Role: "Rookie",
    "Depth Chart": "R",
    PlayerName: name,
    Name: name,
    "Player ID": args.playerId,
    Age: 21,
    Rating: grade,
    "Original Contract Length": years,
    ContractYearsRemaining: years,
    ContractTotalValue_M: totalValueM,
    AAV: aavM,
    Total_Guarantee: guaranteeM,
    "Dead Cap": guaranteeM,
    Expiring: years <= 1 ? "TRUE" : "FALSE",
    ContractStatus: "Rookie",
    College: college,
    DraftTier: tier,
    DraftPickNo: args.pickNo,
    DraftYear: args.draft.year,
  });

  const rookieRights = { ...(args.save.rookieRights ?? {}) };
  rookieRights[args.playerId] = { teamId: args.teamId, year: args.draft.year, pickNo: args.pickNo };

  // Cap delta: add rookie AAV to cap hits, and guarantees add to dead cap proxy.
  const capAdjustments = { ...(args.save.capAdjustments ?? {}) };
  const cur = capAdjustments[args.teamId] ?? { capHitsDelta: 0, deadCapDelta: 0 };
  capAdjustments[args.teamId] = { capHitsDelta: (cur.capHitsDelta ?? 0) + aavM * 1_000_000, deadCapDelta: (cur.deadCapDelta ?? 0) + guaranteeM * 1_000_000 };

  const save = { ...args.save, rosterAdditions, rookieRights, capAdjustments };

  // News classification: reach/steal vs public rank
  const publicRank = toNum(pRow?.Rank ?? 999);
  let cls = "pick";
  if (publicRank <= args.pickNo - 10) cls = "steal";
  else if (publicRank >= args.pickNo + 12) cls = "reach";

  const headline = `Pick #${args.pickNo}: ${args.teamId} — ${name} (${pos})`;
  const body = `${cls.toUpperCase()}: ${name} (${pos}, ${college}) Tier ${tier || "?"}. Team grade: ${Math.round(grade)}.`;

  return { save, headline, body };
}
