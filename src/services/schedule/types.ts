export type GameSlot = "SUN_EARLY" | "SUN_LATE" | "SUN_SN" | "MON";

export type ScheduledGameStatus = "SCHEDULED" | "PLAYED";

export type ScheduledGame = {
  id: string;
  week: number; // 1..18 regular season, 19..22 postseason
  slot: GameSlot;
  homeTeamId: string;
  awayTeamId: string;
  status: ScheduledGameStatus;
  score?: { home: number; away: number };
};

export type LeagueSchedule = {
  seasonYear: number; // e.g. 2026
  seasonWeeks: number; // 22 total (18 + 4 postseason)
  gamesByWeek: Record<number, ScheduledGame[]>;
  gamesById: Record<string, ScheduledGame>;
  byeByTeamId: Record<string, number>; // regular season bye week (5..14)
  meta?: { format: string; version: number };
};
