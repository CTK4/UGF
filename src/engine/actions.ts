import type { GameState, Role, StaffAssignment } from "@/engine/gameState";

export type SetCoachProfilePayload = {
  name: string;
  age: number;
  hometown: string;
  reputation: number;
  mediaStyle: string;
  personalityBaseline: string;
};

export type OffseasonPlanPayload = {
  priorities: string[];
  resignTargets: string[];
  shopTargets: string[];
  tradeNotes: string;
};

export type GameAction =
  | { type: "LOAD_STATE"; payload: { state: GameState } }
  | { type: "START_NEW"; payload?: { week?: number } }
  | { type: "SET_COACH_PROFILE"; payload: SetCoachProfilePayload }
  | { type: "SET_BACKGROUND"; payload: { backgroundKey: string } }
  | { type: "ACCEPT_OFFER"; payload: { ugfTeamKey: string; excelTeamKey: string } }
  | { type: "HIRE_COACH"; payload: { role: Role; assignment: StaffAssignment } }
  | { type: "SET_OFFSEASON_PLAN"; payload: OffseasonPlanPayload }
  | { type: "COMPLETE_TASK"; payload: { taskId: string } }
  | { type: "ADVANCE_WEEK"; payload?: { label?: string } };

export const gameActions = {
  loadState: (state: GameState): GameAction => ({ type: "LOAD_STATE", payload: { state } }),
  startNew: (week = 1): GameAction => ({ type: "START_NEW", payload: { week } }),
  setCoachProfile: (payload: SetCoachProfilePayload): GameAction => ({ type: "SET_COACH_PROFILE", payload }),
  setBackground: (backgroundKey: string): GameAction => ({ type: "SET_BACKGROUND", payload: { backgroundKey } }),
  acceptOffer: (ugfTeamKey: string, excelTeamKey: string): GameAction => ({ type: "ACCEPT_OFFER", payload: { ugfTeamKey, excelTeamKey } }),
  hireCoach: (role: Role, assignment: StaffAssignment): GameAction => ({ type: "HIRE_COACH", payload: { role, assignment } }),
  setOffseasonPlan: (payload: OffseasonPlanPayload): GameAction => ({ type: "SET_OFFSEASON_PLAN", payload }),
  completeTask: (taskId: string): GameAction => ({ type: "COMPLETE_TASK", payload: { taskId } }),
  advanceWeek: (label?: string): GameAction => ({ type: "ADVANCE_WEEK", payload: { label } }),
};
