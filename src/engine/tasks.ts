import type { GameState, Task, TaskType } from "@/engine/gameState";

type TaskTemplate = {
  type: TaskType;
  title: string;
  description: string;
};

const TASKS_BY_WEEK: Record<number, TaskTemplate[]> = {
  1: [{ type: "STAFF_MEETING", title: "Staff Meeting", description: "Meet with your staff and lock offseason priorities." }],
  2: [{ type: "SCOUT_POSITION", title: "Scout Position Group", description: "Select one position and scout three prospects." }],
};

export function generateBeatTasks(state: GameState): Task[] {
  const templates = TASKS_BY_WEEK[state.time.week] ?? [];
  return templates.map((template) => ({
    id: `${state.time.season}.${state.time.week}.${template.type}`,
    type: template.type,
    title: template.title,
    description: template.description,
    status: "OPEN",
  }));
}
