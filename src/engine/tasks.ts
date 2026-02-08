import type { GameState, Task, TaskType } from "@/engine/gameState";

type TaskTemplate = {
  type: TaskType;
  title: string;
  description: string;
  gateId?: string;
};

const TASKS_BY_BEAT: Record<string, TaskTemplate[]> = {
  "OFFSEASON.JAN_STAFF_MEETING": [
    { type: "STAFF_MEETING", title: "Staff Meeting", description: "Meet with your staff and lock offseason priorities.", gateId: "GATE.STAFF_MEETING_DONE" },
  ],
  "OFFSEASON.JAN_SCOUTING_1": [{ type: "SCOUT_POSITION", title: "Scout Position Group", description: "Select one position and scout three prospects." }],
  "OFFSEASON.JAN_SCOUTING_2": [{ type: "SCOUT_POSITION", title: "Scout Position Group", description: "Select one position and scout three prospects." }],
  "OFFSEASON.FEB_ALL_STAR": [
    { type: "SCOUT_POSITION", title: "All-Star Scouting", description: "Scout one position from all-star week standouts." },
    { type: "WATCHLIST_UPDATE", title: "Update Watchlist", description: "Optional: update watchlist based on all-star practices." },
  ],
  "OFFSEASON.FEB_COMBINE": [
    { type: "COMBINE_REVIEW", title: "Combine Review", description: "Review combine metrics and update projections." },
    { type: "WATCHLIST_UPDATE", title: "Watchlist Update", description: "Refresh watchlist after combine interviews." },
  ],
  "OFFSEASON.MAR_FA_WAVE_1": [{ type: "FA_PRIORITIES", title: "FA Priorities", description: "Set first-wave free agency priorities." }],
  "OFFSEASON.MAR_FA_WAVE_2": [{ type: "FA_PRIORITIES", title: "FA Priorities", description: "Set second-wave free agency priorities." }],
  "OFFSEASON.APR_PRIVATE_WORKOUTS": [{ type: "SCOUT_POSITION", title: "Private Workout Scouting", description: "Scout one position from private workouts." }],
  "OFFSEASON.APR_DRAFT": [{ type: "DRAFT_BOARD_FINALIZE", title: "Finalize Draft Board", description: "Finalize the board and lock draft strategy." }],
  "OFFSEASON.MAY_ROOKIE_MINICAMP": [{ type: "WATCHLIST_UPDATE", title: "Rookie Minicamp Notes", description: "Light watchlist and combine note refresh." }],
  "OFFSEASON.JUN_CAMP_PREP": [{ type: "WATCHLIST_UPDATE", title: "Camp Prep Watchlist", description: "Final lightweight watchlist pass before camp." }],
};

export function generateBeatTasks(state: GameState): Task[] {
  const templates = TASKS_BY_BEAT[state.time.beatKey] ?? [];
  return templates.map((template) => ({
    id: `${state.time.season}.${state.time.beatIndex}.${template.type}`,
    type: template.type,
    title: template.title,
    description: template.description,
    status: "OPEN",
    gateId: template.gateId,
  }));
}
