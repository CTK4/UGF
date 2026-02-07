import type { DepthChartSlot } from "./types";

/**
 * Canonical ordering for depth chart slots.
 * Kept as data so UI can render deterministically.
 */
export const DEPTH_CHART_SLOTS: DepthChartSlot[] = [
  // Offense primary
  "QB1","QB2",
  "RB1","RB2","RB3",
  "FB1",
  "WR1","WR2","WR3","WR4","WR5",
  "TE1","TE2",
  "LT1","LT2",
  "LG1","LG2",
  "C1","C2",
  "RG1","RG2",
  "RT1","RT2",

  // Defense primary
  "EDGE1","EDGE2","EDGE3","EDGE4",
  "IDL1","IDL2","IDL3","IDL4",
  "LB1","LB2","LB3","LB4",
  "CB1","CB2","CB3","CB4",
  "S1","S2","S3",

  // Special teams primary
  "K1","P1","LS1",

  // Roles
  "ROLE_3DRB","ROLE_GL_RB","ROLE_SLOT_WR","ROLE_X_WR","ROLE_MOVE_TE","ROLE_INLINE_TE",
  "ROLE_NICKEL_CB","ROLE_DIME_DB","ROLE_SLOT_CB","ROLE_SUB_LB","ROLE_RUSH_EDGE","ROLE_IPR",
  "ROLE_KR","ROLE_PR","ROLE_GUNNER_L","ROLE_GUNNER_R","ROLE_KO_COVER_CORE","ROLE_FG_BLOCK_EDGE",
];
