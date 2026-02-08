export type PhaseKey = "OFFSEASON" | "PRESEASON" | "REGULAR" | "POSTSEASON";
export type BeatKey = string;

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
    key: "OFFSEASON.JAN_STAFF_MEETING",
    phase: "OFFSEASON",
    season: 2026,
    index: 1,
    label: "January Staff Meeting",
    description: "Align with front office and coordinators on offseason priorities.",
    gates: ["GATE.COORDINATORS_HIRED"],
    uiVisible: true,
  },
  { key: "OFFSEASON.JAN_SCOUTING_1", phase: "OFFSEASON", season: 2026, index: 2, label: "January Scouting I", description: "First regional scouting pass.", uiVisible: true },
  { key: "OFFSEASON.JAN_SCOUTING_2", phase: "OFFSEASON", season: 2026, index: 3, label: "January Scouting II", description: "Second regional scouting pass.", uiVisible: true },
  { key: "OFFSEASON.FEB_ALL_STAR", phase: "OFFSEASON", season: 2026, index: 4, label: "All-Star Week", description: "Review all-star practices and update board.", uiVisible: true },
  { key: "OFFSEASON.FEB_COMBINE", phase: "OFFSEASON", season: 2026, index: 5, label: "Combine", description: "Evaluate combine testing and interviews.", uiVisible: true },
  { key: "OFFSEASON.MAR_FA_WAVE_1", phase: "OFFSEASON", season: 2026, index: 6, label: "Free Agency Wave 1", description: "Set first-wave free agency priorities.", uiVisible: true },
  { key: "OFFSEASON.MAR_FA_WAVE_2", phase: "OFFSEASON", season: 2026, index: 7, label: "Free Agency Wave 2", description: "Adjust priorities for second-wave opportunities.", uiVisible: true },
  { key: "OFFSEASON.APR_PRIVATE_WORKOUTS", phase: "OFFSEASON", season: 2026, index: 8, label: "Private Workouts", description: "Host and evaluate private workouts.", uiVisible: true },
  { key: "OFFSEASON.APR_DRAFT", phase: "OFFSEASON", season: 2026, index: 9, label: "Draft Week", description: "Finalize draft board and execute draft strategy.", uiVisible: true },
  { key: "OFFSEASON.MAY_ROOKIE_MINICAMP", phase: "OFFSEASON", season: 2026, index: 10, label: "Rookie Minicamp", description: "First development checkpoint for rookies.", uiVisible: true },
  {
    key: "OFFSEASON.JUN_CAMP_PREP",
    phase: "OFFSEASON",
    season: 2026,
    index: 11,
    label: "Training Camp Prep",
    description: "Prepare final watchlists and camp focus areas.",
    gates: ["GATE.STAFF_MEETING_DONE"],
    uiVisible: true,
  },
];

const CALENDAR_BY_SEASON: Record<number, BeatDef[]> = { 2026: SEASON_2026_BEATS };

export function getBeat(season: number, index: number): BeatDef {
  const beats = CALENDAR_BY_SEASON[season] ?? [];
  const beat = beats.find((item) => item.index === index);
  if (!beat) {
    throw new Error(`Unknown beat season=${season} index=${index}`);
  }
  return beat;
}

export function getNextBeat(season: number, index: number): BeatDef {
  return getBeat(season, index + 1);
}

export function getBeatLabel(season: number, index: number): string {
  return getBeat(season, index).label;
}
