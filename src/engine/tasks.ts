import type { GameState, Task } from "@/engine/gameState";

type TaskTemplate = {
  type: string;
  title: string;
  description: string;
  routeHint?: string;
};

const OFFSEASON_TEMPLATES: TaskTemplate[] = [
  {
    type: "ROSTER_REVIEW",
    title: "Review roster needs",
    description: "Audit every position group and flag where starters or depth must be upgraded this offseason.",
    routeHint: "TeamSummary",
  },
  {
    type: "SCOUT_WATCHLIST",
    title: "Scout 3 prospects (All-Star watchlist)",
    description: "Create an initial All-Star watchlist with three prospects that fit team priorities.",
    routeHint: "PhoneInbox",
  },
  {
    type: "RESIGN_SHORTLIST",
    title: "Set re-sign shortlist",
    description: "Identify expiring players worth retaining and set a first-pass re-sign shortlist.",
    routeHint: "StaffTree",
  },
  {
    type: "TRADE_NOTES",
    title: "Set trade exploration notes",
    description: "Capture potential trade ideas by position and target range for the front office.",
    routeHint: "Hub",
  },
  {
    type: "COORDINATOR_SYNC",
    title: "Meet coordinators (install kickoff)",
    description: "Run install kickoff with OC/DC/STC and lock opening offseason priorities.",
    routeHint: "StaffTree",
  },
  {
    type: "CAP_REVIEW",
    title: "Review cap flexibility",
    description: "Check current commitments and identify one move to create cap space before free agency.",
    routeHint: "Hub",
  },
];

function deterministicSortValue(week: number, index: number): number {
  return (week * 97 + (index + 1) * 53) % 997;
}

function toTaskId(week: number, type: string): string {
  return `jan-offseason-w${week}-${type.toLowerCase()}`;
}

export function generateOffseasonTasks(state: GameState): Task[] {
  if (state.phase !== "JANUARY_OFFSEASON") return state.tasks;

  const taskCount = 3 + (state.time.week % 4);
  const selected = [...OFFSEASON_TEMPLATES]
    .map((template, index) => ({ template, score: deterministicSortValue(state.time.week, index) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, taskCount)
    .map(({ template }) => template);

  return selected.map((template) => ({
    id: toTaskId(state.time.week, template.type),
    title: template.title,
    description: template.description,
    status: "OPEN",
    routeHint: template.routeHint,
  }));
}
