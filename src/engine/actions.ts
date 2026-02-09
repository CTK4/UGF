import type { GameState, Role, StaffAssignment } from "@/engine/gameState";

export type SetCoachProfilePayload = {
  name: string;
  age: number;
  hometown: string;
  reputation: number;
  mediaStyle: string;
  personalityBaseline: string;
  hometownId?: string;
  hometownLabel?: string;
  hometownTeamKey?: string;
};

export type OffseasonPlanPayload = {
  priorities: string[];
  resignTargets: string[];
  shopTargets: string[];
  tradeNotes: string;
};

export type GameAction =
  | { type: "LOAD_STATE"; payload: { state: GameState } }
  | { type: "START_NEW" }
  | { type: "SET_COACH_PROFILE"; payload: SetCoachProfilePayload }
  | { type: "SET_BACKGROUND"; payload: { backgroundKey: string } }
  | { type: "ACCEPT_OFFER"; payload: { ugfTeamKey: string; excelTeamKey: string } }
  | { type: "HIRE_COACH"; payload: { role: Role; assignment: StaffAssignment } }
  | { type: "SET_OFFSEASON_PLAN"; payload: OffseasonPlanPayload }
  | { type: "ENTER_JANUARY_OFFSEASON" }
  | { type: "COMPLETE_TASK"; payload: { taskId: string; positions?: string[] } }
  | { type: "MARK_THREAD_READ"; payload: { threadId: string } }
  | { type: "ADVANCE_WEEK"; payload?: { label?: string } };

export const gameActions = {
  loadState: (state: GameState): GameAction => ({ type: "LOAD_STATE", payload: { state } }),
  startNew: (): GameAction => ({ type: "START_NEW" }),
  setCoachProfile: (payload: SetCoachProfilePayload): GameAction => ({ type: "SET_COACH_PROFILE", payload }),
  setBackground: (backgroundKey: string): GameAction => ({ type: "SET_BACKGROUND", payload: { backgroundKey } }),
  acceptOffer: (ugfTeamKey: string, excelTeamKey: string): GameAction => ({ type: "ACCEPT_OFFER", payload: { ugfTeamKey, excelTeamKey } }),
  hireCoach: (role: Role, assignment: StaffAssignment): GameAction => ({ type: "HIRE_COACH", payload: { role, assignment } }),
  setOffseasonPlan: (payload: OffseasonPlanPayload): GameAction => ({ type: "SET_OFFSEASON_PLAN", payload }),
  enterJanuaryOffseason: (): GameAction => ({ type: "ENTER_JANUARY_OFFSEASON" }),
  completeTask: (taskId: string, positions?: string[]): GameAction => ({ type: "COMPLETE_TASK", payload: { taskId, positions } }),
  markThreadRead: (threadId: string): GameAction => ({ type: "MARK_THREAD_READ", payload: { threadId } }),
  advanceWeek: (label?: string): GameAction => ({ type: "ADVANCE_WEEK", payload: { label } }),
};
