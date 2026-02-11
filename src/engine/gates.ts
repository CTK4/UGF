import type { Role, GameState } from "@/engine/gameState";
import type { Route } from "@/ui/routes";

export type GateId = "GATE.COORDINATORS_HIRED" | "GATE.STAFF_MEETING_DONE";

export type GateFailure = { gateId: GateId; message: string; route: Route };

function missingCoordinatorRole(state: GameState): Role | null {
  const required: Role[] = ["OC", "DC", "STC"];
  return required.find((role) => !state.staff.assignments[role]) ?? null;
}

export function resolveGate(gateId: GateId, state: GameState): GateFailure | null {
  if (gateId === "GATE.COORDINATORS_HIRED") {
    const missingRole = missingCoordinatorRole(state);
    if (!missingRole) return null;
    return {
      gateId,
      message: `Advance blocked: ${missingRole} is not hired yet. Hire your coordinators in Staff Tree.`,
      route: { key: "StaffTree" },
    };
  }

  if (gateId === "GATE.STAFF_MEETING_DONE") {
    if (state.offseasonPlan) return null;
    const taskDone = state.tasks.some((task) => task.type === "STAFF_MEETING" && task.status === "DONE");
    if (taskDone) return null;
    return {
      gateId,
      message: "Advance blocked: Staff meeting is incomplete. Submit offseason priorities to continue.",
      route: { key: "StaffMeeting" },
    };
  }

  return null;
}

export function validateBeatGates(state: GameState, gates: string[] = []): GateFailure | null {
  for (const gateId of gates as GateId[]) {
    const result = resolveGate(gateId, state);
    if (result) return result;
  }
  return null;
}
