export type PhaseKey = "OFFSEASON" | "DRAFT" | "REGULAR";
export type BeatKey = string;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type DayLabel = (typeof DAY_LABELS)[number];

export type BeatDef = {
  key: BeatKey;
  phase: PhaseKey;
  season: number;
  index: number;
  label: string;
  description: string;
  gates?: string[];
  uiVisible?: boolean;
};

const SEASON_2026_BEATS: BeatDef[] = [
  { key: "OFFSEASON.JAN_WEEK_1", phase: "OFFSEASON", season: 2026, index: 1, label: "January Week 1", description: "Roster review + staff planning.", gates: ["GATE.COORDINATORS_HIRED", "GATE.DELEGATION_SETUP_DONE", "GATE.STAFF_MEETING_DONE"], uiVisible: true },
  { key: "OFFSEASON.JAN_WEEK_2", phase: "OFFSEASON", season: 2026, index: 2, label: "January Week 2", description: "Scouting focus and early board.", uiVisible: true },
  { key: "OFFSEASON.JAN_WEEK_3", phase: "OFFSEASON", season: 2026, index: 3, label: "January Week 3", description: "FA priorities and cap planning.", uiVisible: true },
  { key: "OFFSEASON.JAN_WEEK_4", phase: "OFFSEASON", season: 2026, index: 4, label: "January Week 4", description: "Finalize plan. Draft next.", uiVisible: true },

  { key: "DRAFT.WEEK", phase: "DRAFT", season: 2026, index: 5, label: "Draft Week", description: "Make your first pick.", uiVisible: true },

  // Regular season weeks 1..17 -> indices 6..22
  ...Array.from({ length: 17 }).map((_, i) => {
    const w = i + 1;
    return {
      key: `REGULAR.WEEK_${w}`,
      phase: "REGULAR" as const,
      season: 2026,
      index: 6 + i,
      label: `Week ${w}`,
      description: "Game week cadence.",
      uiVisible: true,
    };
  }),
];

const CALENDAR_BY_SEASON: Record<number, BeatDef[]> = { 2026: SEASON_2026_BEATS };

export function getBeat(season: number, index: number): BeatDef {
  const beats = CALENDAR_BY_SEASON[season] ?? SEASON_2026_BEATS;
  const beat = beats.find((item) => item.index === index) ?? beats.at(-1);
  if (!beat) throw new Error(`Unknown beat season=${season} index=${index}`);
  return beat;
}

export function getBeatLabel(season: number, index: number): string {
  return getBeat(season, index).label;
}

export function getDayLabel(dayIndex: number): DayLabel {
  return DAY_LABELS[((dayIndex % DAY_LABELS.length) + DAY_LABELS.length) % DAY_LABELS.length];
}

export function buildTimeLabel(season: number, week: number, dayIndex: number): string {
  return `${getBeatLabel(season, week)} · ${getDayLabel(dayIndex)}`;
}

/**
 * Our MVV timeline:
 * - Beat indices:
 *   1..4 = January weeks
 *   5    = Draft Week
 *   6..22 = Regular season weeks 1..17
 */
export function getAdvanceTarget(time: { season: number; week: number; dayIndex: number }): { season: number; week: number; dayIndex: number } {
  const nextDay = time.dayIndex + 1;
  if (nextDay <= 6) return { season: time.season, week: time.week, dayIndex: nextDay };
  return { season: time.season, week: time.week + 1, dayIndex: 0 };
}
