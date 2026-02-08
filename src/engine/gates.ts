import type { GameState, Role } from "@/engine/gameState";

export type GateId = "GATE.COORDINATORS_HIRED" | "GATE.STAFF_MEETING_DONE";

type GateResult = { gateId: GateId; message: string; routeKey: "StaffTree" | "StaffMeeting" | "Hub" };

function missingCoordinatorRole(state: GameState): Role | null {
  const required: Role[] = ["OC", "DC", "STC"];
  return required.find((role) => !state.staff.assignments[role]) ?? null;
}

export function resolveGate(gateId: GateId, state: GameState): GateResult | null {
  if (state.completedGates.includes(gateId)) return null;

  if (gateId === "GATE.COORDINATORS_HIRED") {
    const missingRole = missingCoordinatorRole(state);
    if (!missingRole) return null;
    return { gateId, message: `Cannot advance beat: hire a ${missingRole} first.`, routeKey: "StaffTree" };
  }

  if (gateId === "GATE.STAFF_MEETING_DONE") {
    if (state.offseasonPlan) return null;
    const taskDone = state.tasks.some((task) => task.type === "STAFF_MEETING" && task.status === "DONE");
    if (taskDone) return null;
    return { gateId, message: "Cannot advance beat: complete your staff meeting plan first.", routeKey: "StaffMeeting" };
  }

  return null;
}

export function validateBeatGates(state: GameState, gates: string[] = []): GateResult | null {
  for (const gateId of gates as GateId[]) {
    const result = resolveGate(gateId, state);
    if (result) return result;
  }
  return null;
}
