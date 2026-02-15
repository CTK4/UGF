import type { GameState, Task, TaskType } from "@/engine/gameState";

type TaskTemplate = {
  type: TaskType;
  title: string;
  description: string;
  routeHint?: string;
};

const JANUARY_WEEK_TASKS: Record<number, TaskTemplate[]> = {
  1: [{ type: "ROSTER_REVIEW", title: "Roster Review", description: "Review your current roster strengths and weaknesses.", routeHint: "Roster" }],
  2: [{ type: "SCOUTING_SETUP", title: "Scouting Setup", description: "Set January scouting focus and your top position need.", routeHint: "Scouting" }],
  3: [{ type: "FREE_AGENCY_PREP", title: "Free Agency Prep", description: "Prepare free agency target tiers and budget guardrails.", routeHint: "Staff" }],
  4: [{ type: "DRAFT_PREP", title: "Draft Prep", description: "Finalize your draft board priorities and shortlist.", routeHint: "Draft Board" }],
};

function buildTaskId(state: GameState, key: string): string {
  return `${state.time.season}.${state.time.week}.${key}`;
}

function addCoordinatorTaskIfNeeded(state: GameState, items: TaskTemplate[]): TaskTemplate[] {
  const missingCoordinator = ["OC", "DC", "STC"].some((role) => !state.staff.assignments[role as "OC" | "DC" | "STC"]);
  if (!missingCoordinator) return items;
  return [
    {
      type: "HIRE_COORDINATORS",
      title: "Hire coordinators",
      description: "Fill all coordinator roles (OC/DC/STC) to keep offseason progression available.",
      routeHint: "Staff Tree",
    },
    ...items,
  ];
}

export function syncJanuaryTasks(state: GameState): Task[] {
  const templates = addCoordinatorTaskIfNeeded(state, JANUARY_WEEK_TASKS[state.time.week] ?? []);
  const existingById = new Map(state.tasks.map((task) => [task.id, task]));

  return templates.map((template) => {
    const id = buildTaskId(state, template.type);
    const existing = existingById.get(id);
    return {
      id,
      type: template.type,
      title: template.title,
      description: template.description,
      routeHint: template.routeHint,
      status: existing?.status === "DONE" ? "DONE" : "OPEN",
    };
  });
}

export const generateBeatTasks = syncJanuaryTasks;
