export type TeamGameResult = {
  teamId: string;
  pointsFor: number;
  pointsAgainst: number;
  win: boolean;
};

export type PlayResult = {
  id: string;
  offenseTeamId: string;
  defenseTeamId: string;
  offenseCall: string;
  defenseCall: string;
  yards: number;
  type: "RUN" | "PASS";
  turnover?: "INT" | "FUM";
  sack?: boolean;
  penalty?: boolean;
  note: string;
};

export type GameResult = {
  gameId: string;
  week: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  plays: PlayResult[];
  summary: string[];
};
