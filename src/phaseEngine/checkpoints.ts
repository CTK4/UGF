import type { LeagueState, DomainEvent } from "./types";

export function shouldCheckpoint(state: LeagueState, actionType: string, events: DomainEvent[]): boolean {
  if (actionType === "DRAFT_MAKE_PICK" || actionType === "DRAFT_SKIP_PICK") return true;
  if (state.clock.phase === "regular_season" && actionType === "ADVANCE_WEEK") return true;
  if (state.clock.phase === "free_agency" && (actionType === "ADVANCE_DAY" || actionType === "ADVANCE_WEEK")) return true;
  if (events.some((e) => e.type === "FORCE_CHECKPOINT")) return true;
  return false;
}
