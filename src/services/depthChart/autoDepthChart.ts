import type { TableRegistry } from "@/data/TableRegistry";
import type { SaveState } from "@/ui/types";
import type { DepthChart, DepthChartSlot } from "./types";

type RosterRow = {
  playerId?: string;
  personId?: string;
  PlayerId?: string;
  PersonId?: string;
  teamId?: string;
  TeamId?: string;
  position?: string;
  Position?: string;
  ovr?: number;
  OVR?: number;
  pff?: number;
  PFF?: number;
};

function normPos(p: string | undefined): string {
  const s = (p ?? "").toUpperCase().trim();
  if (s === "OLB" || s === "DE") return "EDGE";
  if (s === "DT" || s === "NT") return "IDL";
  if (s === "FS" || s === "SS") return "S";
  if (s === "HB") return "RB";
  return s;
}

function slotOrderForPos(pos: string): DepthChartSlot[] {
  switch (pos) {
    case "QB": return ["QB1", "QB2"];
    case "RB": return ["RB1", "RB2", "RB3"];
    case "FB": return ["FB1"];
    case "WR": return ["WR1", "WR2", "WR3", "WR4", "WR5"];
    case "TE": return ["TE1", "TE2"];
    case "LT": return ["LT1", "LT2"];
    case "LG": return ["LG1", "LG2"];
    case "C": return ["C1", "C2"];
    case "RG": return ["RG1", "RG2"];
    case "RT": return ["RT1", "RT2"];
    case "EDGE": return ["EDGE1", "EDGE2", "EDGE3", "EDGE4"];
    case "IDL": return ["IDL1", "IDL2", "IDL3", "IDL4"];
    case "LB": return ["LB1", "LB2", "LB3", "LB4"];
    case "CB": return ["CB1", "CB2", "CB3", "CB4"];
    case "S": return ["S1", "S2", "S3"];
    case "K": return ["K1"];
    case "P": return ["P1"];
    case "LS": return ["LS1"];
    default: return [];
  }
}

function getRowId(r: any): string | undefined {
  return (r.playerId ?? r.PlayerId ?? r.personId ?? r.PersonId) as string | undefined;
}

function getRowTeam(r: any): string | undefined {
  return (r.teamId ?? r.TeamId) as string | undefined;
}

function getRowPos(r: any): string | undefined {
  return (r.position ?? r.Position) as string | undefined;
}

function getRowOvr(r: any): number {
  const v = r.ovr ?? r.OVR ?? r.pff ?? r.PFF;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 60;
}


function scoreRole(role: DepthChartSlot, pos: string, ovr: number, pff: number): number {
  // Deterministic, data-light scoring: prioritize PFF (performance) then OVR (talent proxy).
  const base = (pff || ovr || 50);
  const talent = (ovr || base);
  const perf = (pff || base);
  const posBias = (() => {
    if (role === "ROLE_3DRB") return pos === "RB" ? 4 : -10;
    if (role === "ROLE_GL_RB") return pos === "RB" || pos === "FB" ? 3 : -10;
    if (role === "ROLE_SLOT_WR") return pos === "WR" ? 4 : -10;
    if (role === "ROLE_X_WR") return pos === "WR" ? 4 : -10;
    if (role === "ROLE_MOVE_TE") return pos === "TE" ? 4 : -10;
    if (role === "ROLE_INLINE_TE") return pos === "TE" ? 4 : -10;
    if (role === "ROLE_NICKEL_CB") return pos === "CB" ? 4 : -10;
    if (role === "ROLE_SLOT_CB") return pos === "CB" ? 4 : -10;
    if (role === "ROLE_DIME_DB") return (pos === "CB" || pos === "S") ? 3 : -10;
    if (role === "ROLE_SUB_LB") return pos === "LB" ? 3 : -10;
    if (role === "ROLE_RUSH_EDGE") return pos === "EDGE" ? 4 : -10;
    if (role === "ROLE_IPR") return (pos === "IDL" || pos === "EDGE") ? 3 : -10;
    if (role === "ROLE_KR" || role === "ROLE_PR") return pos === "WR" || pos === "RB" ? 2 : -10;
    if (role.startsWith("ROLE_GUNNER")) return pos === "WR" || pos === "CB" || pos === "S" ? 2 : -10;
    return 0;
  })();

  // PFF-heavy roles (nickel, slot, 3DRB) should lean more on performance; GL roles lean slightly more on talent.
  const perfW = role in ({ ROLE_GL_RB: 1 } as any) ? 0.45 : 0.6;
  const score = perfW * perf + (1 - perfW) * talent + posBias;
  return score;
}

function assignRoleSlots(chart: DepthChart, rows: Array<{ playerId: string; pos: string; ovr: number; pff: number }>): DepthChart {
  const roleSlots: DepthChartSlot[] = [
    "ROLE_3DRB", "ROLE_GL_RB", "ROLE_SLOT_WR", "ROLE_X_WR", "ROLE_MOVE_TE", "ROLE_INLINE_TE",
    "ROLE_NICKEL_CB", "ROLE_SLOT_CB", "ROLE_DIME_DB", "ROLE_SUB_LB", "ROLE_RUSH_EDGE", "ROLE_IPR",
    "ROLE_KR", "ROLE_PR", "ROLE_GUNNER_L", "ROLE_GUNNER_R", "ROLE_KO_COVER_CORE", "ROLE_FG_BLOCK_EDGE",
  ];

  const taken = new Set<string>(Object.values(chart.slots).filter(Boolean) as string[]);

  const pickBest = (role: DepthChartSlot, candidates: typeof rows): string | undefined => {
    let best: { id: string; s: number } | undefined;
    for (const r of candidates) {
      if (taken.has(r.playerId)) continue;
      const s = scoreRole(role, r.pos, r.ovr, r.pff);
      if (!best || s > best.s) best = { id: r.playerId, s };
    }
    if (best) {
      taken.add(best.id);
      return best.id;
    }
    return undefined;
  };

  // Dedicated role pools
  const rb = rows.filter(r => r.pos === "RB" || r.pos === "FB");
  const wr = rows.filter(r => r.pos === "WR");
  const te = rows.filter(r => r.pos === "TE");
  const cb = rows.filter(r => r.pos === "CB");
  const db = rows.filter(r => r.pos === "CB" || r.pos === "S");
  const lb = rows.filter(r => r.pos === "LB");
  const edge = rows.filter(r => r.pos === "EDGE");
  const idl = rows.filter(r => r.pos === "IDL" || r.pos === "EDGE");

  const setIf = (slot: DepthChartSlot, id?: string) => { if (id) chart.slots[slot] = id; };

  setIf("ROLE_3DRB", pickBest("ROLE_3DRB", rb));
  setIf("ROLE_GL_RB", pickBest("ROLE_GL_RB", rb));
  setIf("ROLE_SLOT_WR", pickBest("ROLE_SLOT_WR", wr));
  setIf("ROLE_X_WR", pickBest("ROLE_X_WR", wr));
  setIf("ROLE_MOVE_TE", pickBest("ROLE_MOVE_TE", te));
  setIf("ROLE_INLINE_TE", pickBest("ROLE_INLINE_TE", te));

  setIf("ROLE_NICKEL_CB", pickBest("ROLE_NICKEL_CB", cb));
  setIf("ROLE_SLOT_CB", pickBest("ROLE_SLOT_CB", cb));
  setIf("ROLE_DIME_DB", pickBest("ROLE_DIME_DB", db));
  setIf("ROLE_SUB_LB", pickBest("ROLE_SUB_LB", lb));
  setIf("ROLE_RUSH_EDGE", pickBest("ROLE_RUSH_EDGE", edge));
  setIf("ROLE_IPR", pickBest("ROLE_IPR", idl));

  setIf("ROLE_KR", pickBest("ROLE_KR", [...wr, ...rb]));
  setIf("ROLE_PR", pickBest("ROLE_PR", [...wr, ...rb]));
  setIf("ROLE_GUNNER_L", pickBest("ROLE_GUNNER_L", [...wr, ...cb, ...db]));
  setIf("ROLE_GUNNER_R", pickBest("ROLE_GUNNER_R", [...wr, ...cb, ...db]));
  setIf("ROLE_KO_COVER_CORE", pickBest("ROLE_KO_COVER_CORE", rows));
  setIf("ROLE_FG_BLOCK_EDGE", pickBest("ROLE_FG_BLOCK_EDGE", [...edge, ...idl, ...lb]));

  return chart;
}
export function ensureDepthChart(reg: TableRegistry, save: SaveState, teamId: string): SaveState {
  const existing = (save as any).depthCharts?.[teamId] as DepthChart | undefined;
  if (existing?.slots && Object.keys(existing.slots).length > 0) return save;

  const inactive = new Set((save as any).inactivesByTeam?.[teamId] ?? []);

  const roster = (reg.getTable("Roster")?.rows ?? []) as RosterRow[];
  const players = roster
    .filter((r) => getRowTeam(r) === teamId)
    .map((r) => ({ id: getRowId(r), pos: normPos(getRowPos(r)), ovr: getRowOvr(r) }))
    .filter((x) => !!x.id && !!x.pos)
    .filter((x) => !inactive.has(x.id));

  const byPos: Record<string, Array<{ id: string; ovr: number }>> = {};
  for (const p of players) {
    byPos[p.pos] ??= [];
    byPos[p.pos].push({ id: p.id!, ovr: p.ovr });
  }
  for (const pos of Object.keys(byPos)) byPos[pos].sort((a, b) => b.ovr - a.ovr);

  const slots: any = {};
  for (const [pos, list] of Object.entries(byPos)) {
    const order = slotOrderForPos(pos);
    for (let i = 0; i < order.length && i < list.length; i++) {
      slots[order[i]] = list[i].id;
    }
  }

  const depthCharts = { ...((save as any).depthCharts ?? {}), [teamId]: { teamId, slots, updatedTick: save.tick ?? 0 } };
  return { ...(save as any), depthCharts };
}
