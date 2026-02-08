export const STAFF_ROLES = ["HC", "OC", "DC", "STC", "QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const MANDATORY_ADVANCE_ROLES: StaffRole[] = ["OC", "DC", "STC"];

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  HC: "Head Coach",
  OC: "Offensive Coordinator",
  DC: "Defensive Coordinator",
  STC: "Special Teams Coordinator",
  QB: "QB Coach",
  RB: "RB Coach",
  WR: "WR Coach",
  OL: "OL Coach",
  DL: "DL Coach",
  LB: "LB Coach",
  DB: "DB Coach",
  ASST: "Assistant Coach",
};

export const ASSISTANT_ROLES: StaffRole[] = ["QB", "RB", "WR", "OL", "DL", "LB", "DB", "ASST"];
