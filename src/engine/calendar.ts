export type PhaseKey = "OFFSEASON" | "PRESEASON" | "REGULAR" | "POSTSEASON";
export type BeatKey = string;

export const JANUARY_DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type JanuaryDayLabel = (typeof JANUARY_DAY_LABELS)[number];

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
  {
    key: "OFFSEASON.JAN_WEEK_1",
    phase: "OFFSEASON",
    season: 2026,
    index: 1,
    label: "January Week 1",
    description: "Kick off offseason planning and roster review.",
    gates: ["GATE.COORDINATORS_HIRED", "GATE.DELEGATION_SETUP_DONE"],
    uiVisible: true,
  },
  {
    key: "OFFSEASON.JAN_WEEK_2",
    phase: "OFFSEASON",
    season: 2026,
    index: 2,
    label: "January Week 2",
    description: "Set scouting focus and draft discovery priorities.",
    uiVisible: true,
  },
  {
    key: "OFFSEASON.JAN_WEEK_3",
    phase: "OFFSEASON",
    season: 2026,
    index: 3,
    label: "January Week 3",
    description: "Prepare free agency plans with staff.",
    uiVisible: true,
  },
  {
    key: "OFFSEASON.JAN_WEEK_4",
    phase: "OFFSEASON",
    season: 2026,
    index: 4,
    label: "January Week 4",
    description: "Finalize draft board and prep for transition.",
    uiVisible: true,
  },
];

const CALENDAR_BY_SEASON: Record<number, BeatDef[]> = { 2026: SEASON_2026_BEATS };

export function getBeat(season: number, index: number): BeatDef {
  const beats = CALENDAR_BY_SEASON[season] ?? SEASON_2026_BEATS;
  const beat = beats.find((item) => item.index === index) ?? beats.at(-1);
  if (!beat) {
    throw new Error(`Unknown beat season=${season} index=${index}`);
  }
  return beat;
}

export function getBeatLabel(season: number, index: number): string {
  return getBeat(season, index).label;
}

export function getJanuaryDayLabel(dayIndex: number): JanuaryDayLabel {
  return JANUARY_DAY_LABELS[((dayIndex % JANUARY_DAY_LABELS.length) + JANUARY_DAY_LABELS.length) % JANUARY_DAY_LABELS.length];
}

export function buildTimeLabel(season: number, week: number, dayIndex: number): string {
  return `${getBeatLabel(season, week)} · ${getJanuaryDayLabel(dayIndex)}`;
}

export function getAdvanceTarget(time: { season: number; week: number; dayIndex: number }): { season: number; week: number; dayIndex: number } {
  const nextDay = time.dayIndex + 1;
  if (nextDay <= 6) {
    return { season: time.season, week: time.week, dayIndex: nextDay };
  }
  const nextWeek = time.week + 1;
  if (nextWeek <= 4) {
    return { season: time.season, week: nextWeek, dayIndex: 0 };
  }
  return { season: time.season + 1, week: 1, dayIndex: 0 };
}
