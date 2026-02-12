export const STAFF_ROLES = ["HC", "OC", "DC", "STC", "QB", "WRRB", "OL", "DL", "LB", "DB", "ASST"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * The user is the Head Coach; HC is not hireable via the staff market UI.
 */
export const HIREABLE_STAFF_ROLES = ["OC", "DC", "STC", "QB", "WRRB", "OL", "DL", "LB", "DB", "ASST"] as const;
export type HireableStaffRole = (typeof HIREABLE_STAFF_ROLES)[number];

export const MANDATORY_STAFF_ROLES: StaffRole[] = ["OC", "DC", "STC"];

export const ASSISTANT_STAFF_ROLES: StaffRole[] = ["QB", "WRRB", "OL", "DL", "LB", "DB", "ASST"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  HC: "Head Coach",
  OC: "OC",
  DC: "DC",
  STC: "STC",
  QB: "QB Coach",
  WRRB: "WR/RB Coach",
  OL: "OL Coach",
  DL: "DL Coach",
  LB: "LB Coach",
  DB: "DB Coach",
  ASST: "Assistant Coach (Any)",
};
