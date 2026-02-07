import type { TableRegistry } from "@/data/TableRegistry";

export type ContractV1 = {
  startYear: number;
  years: number;
  base: number[];
  rosterBonus: number[];
  signingBonus: number;
  prorationYears: number;
  guaranteedYears: number;
};

export type ContractYearRow = {
  year: number;
  yearIndex: number; // 0..years-1
  base: number;
  rosterBonus: number;
  proration: number;
  capHit: number;
  guaranteed: boolean;
  deadCapPreJune1: number;
  deadCapPostJune1ThisYear: number;
  deadCapPostJune1NextYear: number;
  savingsPreJune1: number;
  savingsPostJune1: number;
};

export type PlayerContractView = {
  playerId: string;
  playerName: string;
  teamId: string;
  pos: string;
  contract: ContractV1;
  rows: ContractYearRow[];
};

function toNum(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function money(v: unknown): number {
  const n = toNum(v);
  if (Math.abs(n) <= 500) return n * 1_000_000;
  return n;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function buildContractV1FromRosterRow(args: { rosterRow: any; startYear: number }): ContractV1 {
  const row = args.rosterRow;
  const yearsRemaining = Math.max(1, Math.round(toNum(row.ContractYearsRemaining ?? row.YearsRemaining ?? row["Original Contract Length"] ?? 1)));
  const years = yearsRemaining;

  const aav = money(row.AAV ?? row.AAV_M ?? 0);
  const totalValue = money(row.ContractTotalValue_M ?? row.TotalValue ?? row.TotalValue_M ?? 0);
  const inferredAav = aav > 0 ? aav : totalValue > 0 ? totalValue / years : 0;

  const totalGuarantee = money(row.Total_Guarantee ?? row.TotalGuarantee ?? row.Guarantee ?? 0);

  // V1 split: part of guarantee becomes signing bonus.
  const signingBonus = clamp(totalGuarantee * 0.55, 0, (inferredAav * years) * 0.45);
  const prorationYears = Math.min(years, 5);

  const base = Array.from({ length: years }, () => inferredAav);
  const rosterBonus = Array.from({ length: years }, () => 0);

  // Fully guaranteed years (simple): if meaningful guarantee, guarantee first year; if huge, first 2.
  let guaranteedYears = 0;
  if (totalGuarantee >= inferredAav * 0.8) guaranteedYears = 1;
  if (totalGuarantee >= inferredAav * 1.8) guaranteedYears = Math.min(2, years);
  if (years === 1 && totalGuarantee > 0) guaranteedYears = 1;

  return { startYear: args.startYear, years, base, rosterBonus, signingBonus, prorationYears, guaranteedYears };
}

export function prorationPerYear(c: ContractV1): number {
  return c.prorationYears > 0 ? c.signingBonus / c.prorationYears : 0;
}

export function capHit(c: ContractV1, yearIndex: number): number {
  const pr = prorationPerYear(c);
  const prAdd = yearIndex < c.prorationYears ? pr : 0;
  return (c.base[yearIndex] ?? 0) + (c.rosterBonus[yearIndex] ?? 0) + prAdd;
}

export function remainingProration(c: ContractV1, currentIndex: number): number {
  const pr = prorationPerYear(c);
  const remainingPrYears = Math.max(0, c.prorationYears - currentIndex);
  return pr * remainingPrYears;
}

export function guaranteedCashRemaining(c: ContractV1, currentIndex: number): number {
  let sum = 0;
  for (let i = currentIndex; i < Math.min(c.years, c.guaranteedYears); i++) {
    sum += (c.base[i] ?? 0) + (c.rosterBonus[i] ?? 0);
  }
  return sum;
}

export function deadCapPreJune1(c: ContractV1, currentIndex: number): number {
  return remainingProration(c, currentIndex) + guaranteedCashRemaining(c, currentIndex);
}

export function deadCapPostJune1(c: ContractV1, currentIndex: number): { thisYear: number; nextYear: number } {
  const pr = prorationPerYear(c);
  const rem = remainingProration(c, currentIndex);
  const thisYearPr = currentIndex < c.prorationYears ? pr : 0;
  const nextYear = Math.max(0, rem - thisYearPr);

  // For v1: guaranteed cash accelerates to current year for simplicity.
  const gCash = guaranteedCashRemaining(c, currentIndex);
  const thisYear = thisYearPr + gCash;

  return { thisYear, nextYear };
}

export function tradeDeadCapOriginalTeam(c: ContractV1, currentIndex: number): number {
  // signing bonus proration stays with original team
  return remainingProration(c, currentIndex);
}

export function acquiringTeamCapHit(c: ContractV1, yearIndex: number): number {
  // acquiring team pays base + roster bonus only
  return (c.base[yearIndex] ?? 0) + (c.rosterBonus[yearIndex] ?? 0);
}

export function restructureConvertBaseToBonus(c: ContractV1, currentIndex: number, amount: number): ContractV1 {
  const base = [...c.base];
  const x = clamp(amount, 0, base[currentIndex] ?? 0);
  base[currentIndex] = (base[currentIndex] ?? 0) - x;
  const signingBonus = c.signingBonus + x;
  const remainingYears = Math.max(1, c.years - currentIndex);
  const prorationYears = Math.min(remainingYears, 5);
  return { ...c, base, signingBonus, prorationYears };
}

export function buildRowsForContract(contract: ContractV1, currentYear: number): ContractYearRow[] {
  const currentIndex = Math.max(0, Math.min(contract.years - 1, currentYear - contract.startYear));
  const pr = prorationPerYear(contract);
  const rows: ContractYearRow[] = [];
  for (let i = 0; i < contract.years; i++) {
    const year = contract.startYear + i;
    const base = contract.base[i] ?? 0;
    const rosterBonus = contract.rosterBonus[i] ?? 0;
    const prAdd = i < contract.prorationYears ? pr : 0;
    const cap = base + rosterBonus + prAdd;
    const guaranteed = i < contract.guaranteedYears;

    const cutIndex = Math.max(0, Math.min(contract.years - 1, currentIndex));
    const pre = deadCapPreJune1(contract, cutIndex);
    const post = deadCapPostJune1(contract, cutIndex);
    const capThis = capHit(contract, cutIndex);
    const savingsPre = capThis - pre;
    const savingsPost = capThis - post.thisYear;

    rows.push({
      year,
      yearIndex: i,
      base,
      rosterBonus,
      proration: prAdd,
      capHit: cap,
      guaranteed,
      deadCapPreJune1: pre,
      deadCapPostJune1ThisYear: post.thisYear,
      deadCapPostJune1NextYear: post.nextYear,
      savingsPreJune1: savingsPre,
      savingsPostJune1: savingsPost,
    });
  }
  return rows;
}

export function buildPlayerContractView(reg: TableRegistry, rosterRow: any, startYear: number, currentYear: number): PlayerContractView | null {
  const teamId = String(rosterRow.Team ?? "").trim();
  const playerId = String(rosterRow["Player ID"] ?? rosterRow.PlayerID ?? rosterRow.ID ?? "");
  if (!teamId || !playerId) return null;

  const playerName = String(rosterRow.PlayerName ?? rosterRow.Name ?? "").trim() || `Player ${playerId}`;
  const pos = String(rosterRow.Position ?? rosterRow.Pos ?? rosterRow.PositionGroup ?? "").trim();

  const contract = buildContractV1FromRosterRow({ rosterRow, startYear });
  const currentIndex = Math.max(0, Math.min(contract.years - 1, currentYear - contract.startYear));

  const pr = prorationPerYear(contract);
  const rows: ContractYearRow[] = [];
  for (let i = 0; i < contract.years; i++) {
    const year = contract.startYear + i;
    const base = contract.base[i] ?? 0;
    const rosterBonus = contract.rosterBonus[i] ?? 0;
    const prAdd = i < contract.prorationYears ? pr : 0;
    const cap = base + rosterBonus + prAdd;
    const guaranteed = i < contract.guaranteedYears;

    const cutIndex = Math.max(0, Math.min(contract.years - 1, currentIndex));
    const pre = deadCapPreJune1(contract, cutIndex);
    const post = deadCapPostJune1(contract, cutIndex);
    const capThis = capHit(contract, cutIndex);
    const savingsPre = capThis - pre;
    const savingsPost = capThis - post.thisYear;

    rows.push({
      year,
      yearIndex: i,
      base,
      rosterBonus,
      proration: prAdd,
      capHit: cap,
      guaranteed,
      deadCapPreJune1: pre,
      deadCapPostJune1ThisYear: post.thisYear,
      deadCapPostJune1NextYear: post.nextYear,
      savingsPreJune1: savingsPre,
      savingsPostJune1: savingsPost,
    });
  }

  return { playerId, playerName, teamId, pos, contract, rows };
}

export function teamCapSummary(reg: TableRegistry, teamId: string, save: any): { capSpace: number; capHits: number; deadCap: number; capLimit: number } {
  const startYear = save.leagueStartYear ?? 2026;
  const currentYear = save.leagueYear ?? startYear;

  const teamRow = (reg.getTable("Team Summary") as any[]).find((r) => String(r.Team ?? "").trim() === teamId);
  const baseCapHits = money(teamRow?.["Current Cap Hits"] ?? 0);
  const baseCapSpace = money(teamRow?.["Cap Space"] ?? 0);

  const adj = (save.capAdjustments ?? {})[teamId] ?? { capHitsDelta: 0, deadCapDelta: 0 };
  const capHits = baseCapHits + toNum(adj.capHitsDelta);
  const capSpace = baseCapSpace - toNum(adj.capHitsDelta);
  const deadCap = toNum(adj.deadCapDelta);

  // league cap limit: fallback deterministic model (240M, 4.5%)
  const capLimit = (() => {
    let cap = 240_000_000;
    const y = Math.max(0, currentYear - startYear);
    for (let i = 0; i < y; i++) cap = Math.round(cap * 1.045);
    return cap;
  })();

  return { capSpace, capHits, deadCap, capLimit };
}

export function applyCapDelta(save: any, teamId: string, delta: { capHitsDelta?: number; deadCapDelta?: number }): any {
  const next = { ...(save.capAdjustments ?? {}) };
  const cur = next[teamId] ?? { capHitsDelta: 0, deadCapDelta: 0 };
  next[teamId] = {
    capHitsDelta: toNum(cur.capHitsDelta) + toNum(delta.capHitsDelta ?? 0),
    deadCapDelta: toNum(cur.deadCapDelta) + toNum(delta.deadCapDelta ?? 0),
  };
  return { ...save, capAdjustments: next };
}
