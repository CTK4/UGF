import type { StaffState, StaffRole } from "@/services/staff";

export type TeamStaffEffects = {
  offenseBonus: number; // -10..+10 rating points
  defenseBonus: number;
  devByPos: Record<string, number>; // POS group -> weekly dev points (0..3)
  summary: Array<{ role: StaffRole; coach?: { id: string; name: string; rating: number; tier?: string } }>;
};

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

function posKeyFromRole(role: StaffRole): string | null {
  switch (role) {
    case "QB_COACH":
      return "QB";
    case "WR_RB":
      return "WR/RB";
    case "OL":
      return "OL";
    case "DL":
      return "DL";
    case "LB":
      return "LB";
    case "DB":
      return "DB";
    default:
      return null;
  }
}

function ratingToBonus(rating: number, scale = 7): number {
  // rating 70 => 0, 85 => +2, 55 => -2 (approx)
  return clamp(Math.round((rating - 70) / scale), -6, 6);
}

function ratingToDev(rating: number): number {
  // rating 60 => 0, 75 => 1, 85 => 2, 92+ => 3
  return clamp(Math.floor((rating - 60) / 10), 0, 3);
}

export function computeTeamStaffEffects(staff: StaffState | undefined, teamId: string): TeamStaffEffects {
  const empty: TeamStaffEffects = { offenseBonus: 0, defenseBonus: 0, devByPos: {}, summary: [] };
  if (!staff) return empty;

  const slots = staff.teamStaff[teamId];
  if (!slots) return empty;

  const byId = staff.staffById;

  const hc = slots.HC ? byId[slots.HC] : undefined;
  const oc = slots.OC ? byId[slots.OC] : undefined;
  const dc = slots.DC ? byId[slots.DC] : undefined;

  const hcB = hc ? ratingToBonus(hc.rating, 8) : 0;
  const ocB = oc ? ratingToBonus(oc.rating, 7) : 0;
  const dcB = dc ? ratingToBonus(dc.rating, 7) : 0;

  const offenseBonus = clamp(ocB + Math.round(hcB * 0.5), -10, 10);
  const defenseBonus = clamp(dcB + Math.round(hcB * 0.5), -10, 10);

  const devByPos: Record<string, number> = {};
  const roles: StaffRole[] = ["QB_COACH", "WR_RB", "OL", "DL", "LB", "DB"];
  for (const r of roles) {
    const key = posKeyFromRole(r);
    if (!key) continue;
    const id = (slots as any)[r] as string | undefined;
    const m = id ? byId[id] : undefined;
    devByPos[key] = m ? ratingToDev(m.rating) : 0;
  }

  const summary: TeamStaffEffects["summary"] = (["HC", "OC", "DC", "QB_COACH", "WR_RB", "OL", "DL", "LB", "DB", "ST"] as StaffRole[]).map((role) => {
    const id = (slots as any)[role] as string | undefined;
    const m = id ? byId[id] : undefined;
    return { role, coach: m ? { id: m.id, name: m.name, rating: m.rating, tier: m.tier } : undefined };
  });

  return { offenseBonus, defenseBonus, devByPos, summary };
}
