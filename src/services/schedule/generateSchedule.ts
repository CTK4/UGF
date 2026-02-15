import { LEAGUE_TEAMS, type Conference, type Division } from "@/services/league/teams";
import { mulberry32 } from "@/services/rng";
import type { LeagueSchedule, ScheduledGame, GameSlot } from "@/services/schedule/types";

type DivKey = `${Conference}-${Division}`;

function divKey(c: Conference, d: Division): DivKey {
  return `${c}-${d}` as DivKey;
}

function pickSlotCounts(week: number): { primetime: number; sunday: number } {
  // Always 1 SNF + 1 MNF. Remaining are Sunday afternoon.
  return { primetime: 2, sunday: 14 };
}

function stableStrength(seed: number, teamId: string, year: number): number {
  // 0..1 deterministic "team strength" proxy for placeholder seeding.
  const s = `${seed}:${year}:${teamId}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // unsigned -> [0,1)
  return (h >>> 0) / 2 ** 32;
}

function roundRobinPairings(teamIds: string[], rng: () => number): Array<[string, string]> {
  // Circle method. Returns one "round" of pairings with random home/away assignment.
  const ids = [...teamIds];
  if (ids.length % 2 === 1) ids.push("BYE");
  const n = ids.length;
  const half = n / 2;

  const left = ids.slice(0, half);
  const right = ids.slice(half).reverse();

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < half; i++) {
    const a = left[i];
    const b = right[i];
    if (a === "BYE" || b === "BYE") continue;
    // randomize home
    pairs.push(rng() < 0.5 ? [a, b] : [b, a]);
  }
  return pairs;
}

function buildRotationDivisions(): Record<DivKey, Division[]> {
  // For each division, list the other divisions in a stable order.
  const divs: Division[] = ["East", "North", "South", "West"];
  const out: Record<DivKey, Division[]> = {} as any;
  for (const c of ["NC", "AC"] as Conference[]) {
    for (const d of divs) {
      out[divKey(c, d)] = divs.filter((x) => x !== d);
    }
  }
  return out;
}

function chooseRotations(year: number) {
  const divs: Division[] = ["East", "North", "South", "West"];
  const intra = buildRotationDivisions();
  const intraIndex = (year - 2026) % 3;
  const interIndex = (year - 2026) % 4;
  const interAltIndex = (interIndex + 1) % 4;

  return {
    intraDivOpponent: (c: Conference, d: Division) => intra[divKey(c, d)][intraIndex],
    interDivOpponent: (c: Conference) => divs[interIndex],
    inter17thDiv: (c: Conference) => divs[interAltIndex],
  };
}

function teamLists() {
  const byId = new Map(LEAGUE_TEAMS.map((t) => [t.id, t]));
  const byConfDiv: Record<DivKey, string[]> = {} as any;
  for (const t of LEAGUE_TEAMS) {
    const k = divKey(t.conference, t.division);
    byConfDiv[k] = byConfDiv[k] ?? [];
    byConfDiv[k].push(t.id);
  }
  return { byId, byConfDiv };
}

function makeGame(id: string, week: number, homeTeamId: string, awayTeamId: string, slot: GameSlot): ScheduledGame {
  return { id, week, homeTeamId, awayTeamId, slot, status: "SCHEDULED" };
}

function addGame(
  games: ScheduledGame[],
  seen: Set<string>,
  week: number,
  home: string,
  away: string,
  slot: GameSlot
) {
  const k = `${home}-${away}-${week}`;
  if (seen.has(k)) return;
  seen.add(k);
  games.push(makeGame(`W${week}:${away}@${home}`, week, home, away, slot));
}

function buildRegularSeasonMatchups(seed: number, year: number): ScheduledGame[] {
  const { byId, byConfDiv } = teamLists();
  const rot = chooseRotations(year);

  const games: ScheduledGame[] = [];
  const seen = new Set<string>();
  const rng = mulberry32(seed ^ (year * 2654435761));

  // 1) Divisional home-and-home (6 games)
  for (const c of ["NC", "AC"] as Conference[]) {
    for (const d of ["East", "North", "South", "West"] as Division[]) {
      const ids = byConfDiv[divKey(c, d)] ?? [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = ids[i];
          const b = ids[j];
          // two games, swap home
          addGame(games, seen, 0, a, b, "SUN_EARLY"); // week assigned later
          addGame(games, seen, 0, b, a, "SUN_EARLY");
        }
      }
    }
  }

  // Helper: pair two equal-size lists in randomized order
  const pairLists = (homeIds: string[], awayIds: string[]) => {
    const h = [...homeIds];
    const a = [...awayIds];
    // shuffle both deterministically
    for (let i = h.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [h[i], h[j]] = [h[j], h[i]];
    }
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < Math.min(h.length, a.length); i++) pairs.push([h[i], a[i]]);
    return pairs;
  };

  // 2) Intra-conference rotation: each division plays one other division (4 games)
  for (const c of ["NC", "AC"] as Conference[]) {
    for (const d of ["East", "North", "South", "West"] as Division[]) {
      const oppDiv = rot.intraDivOpponent(c, d);
      const a = byConfDiv[divKey(c, d)] ?? [];
      const b = byConfDiv[divKey(c, oppDiv)] ?? [];
      // To avoid double-adding (d vs oppDiv and oppDiv vs d), only add when d < oppDiv lexicographically
      if (d > oppDiv) continue;
      const pairs = pairLists(a, b);
      for (const [t1, t2] of pairs) {
        // two games? No, rotation is single meeting. Alternate home by RNG.
        addGame(games, seen, 0, rng() < 0.5 ? t1 : t2, rng() < 0.5 ? t2 : t1, "SUN_EARLY");
      }
    }
  }

  // 3) Inter-conference rotation: each division plays one division from other conference (4 games)
  const confOpp = (c: Conference) => (c === "NC" ? ("AC" as Conference) : ("NC" as Conference));
  for (const c of ["NC", "AC"] as Conference[]) {
    const oppConf = confOpp(c);
    const oppDiv = rot.interDivOpponent(c);
    for (const d of ["East", "North", "South", "West"] as Division[]) {
      const a = byConfDiv[divKey(c, d)] ?? [];
      const b = byConfDiv[divKey(oppConf, oppDiv)] ?? [];
      // Add only from one conference to avoid dupes.
      if (c !== "NC") continue;
      const pairs = pairLists(a, b);
      for (const [nc, ac] of pairs) {
        addGame(games, seen, 0, rng() < 0.5 ? nc : ac, rng() < 0.5 ? ac : nc, "SUN_EARLY");
      }
    }
  }

  // 4) Same-place games (2): each team plays two teams in its conference from the remaining divisions that finished same place.
  // We don't have standings yet; we approximate place by deterministic strength ranking within division (1..4).
  const placeByTeam = new Map<string, number>();
  for (const c of ["NC", "AC"] as Conference[]) {
    for (const d of ["East", "North", "South", "West"] as Division[]) {
      const ids = (byConfDiv[divKey(c, d)] ?? []).slice();
      ids.sort((a, b) => stableStrength(seed, b, year) - stableStrength(seed, a, year));
      ids.forEach((id, idx) => placeByTeam.set(id, idx + 1));
    }
  }

  const samePlaceOppsInConf = (teamId: string) => {
    const t = byId.get(teamId)!;
    const others = (["East", "North", "South", "West"] as Division[]).filter((x) => x !== t.division);
    const fixed = rot.intraDivOpponent(t.conference, t.division);
    const remaining = others.filter((x) => x !== fixed);
    return remaining;
  };

  const addedSamePlace = new Set<string>();
  for (const team of LEAGUE_TEAMS) {
    const key = team.id;
    if (addedSamePlace.has(key)) continue;
    const place = placeByTeam.get(team.id) ?? 4;
    const conf = team.conference;
    const remDivs = samePlaceOppsInConf(team.id);
    // match against same-place team in each remaining division (2 games)
    for (const d of remDivs) {
      const opp = (byConfDiv[divKey(conf, d)] ?? []).find((id) => (placeByTeam.get(id) ?? 4) === place);
      if (!opp) continue;
      const pairKey = [team.id, opp].sort().join("-");
      if (addedSamePlace.has(pairKey)) continue;
      addedSamePlace.add(pairKey);
      addGame(games, seen, 0, rng() < 0.5 ? team.id : opp, rng() < 0.5 ? opp : team.id, "SUN_EARLY");
    }
  }

  // 5) 17th game: cross-conference same-place vs a division from the other conference not already played.
  // Using a fixed alternate division rotation for determinism.
  const inter17DivNC = rot.inter17thDiv("NC");
  const inter17DivAC = rot.inter17thDiv("AC");
  const added17 = new Set<string>();
  for (const team of LEAGUE_TEAMS) {
    const place = placeByTeam.get(team.id) ?? 4;
    const oppConf = confOpp(team.conference);
    const oppDiv = team.conference === "NC" ? inter17DivNC : inter17DivAC;
    const opp = (byConfDiv[divKey(oppConf, oppDiv)] ?? []).find((id) => (placeByTeam.get(id) ?? 4) === place);
    if (!opp) continue;
    const k = [team.id, opp].sort().join("-");
    if (added17.has(k)) continue;
    added17.add(k);
    addGame(games, seen, 0, rng() < 0.5 ? team.id : opp, rng() < 0.5 ? opp : team.id, "SUN_EARLY");
  }

  // By now: each team should have 17 games, but week=0 placeholder.
  return games.map((g) => ({ ...g, week: 0 }));
}

function assignByes(seed: number, year: number): Record<string, number> {
  // Weeks 5..14 inclusive. 10 weeks. 32 teams => 3 or 4 byes per week.
  const rng = mulberry32(seed ^ 0xBEEFBEEF ^ year);
  const weeks = Array.from({ length: 10 }, (_, i) => i + 5);
  const teamIds = LEAGUE_TEAMS.map((t) => t.id);
  // shuffle teams
  for (let i = teamIds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]];
  }
  const byes: Record<string, number> = {};
  for (let i = 0; i < teamIds.length; i++) {
    byes[teamIds[i]] = weeks[i % weeks.length];
  }
  return byes;
}

function scheduleWeeks(seed: number, year: number, matchups: ScheduledGame[]): LeagueSchedule {
  const rng = mulberry32(seed ^ 0xA11CE ^ year);
  const byes = assignByes(seed, year);

  // Expand matchups list: ensure each game has placeholder week and slot
  const games = matchups.map((g) => ({ ...g, slot: "SUN_EARLY" as GameSlot, week: 0 }));

  // Shuffle games to vary weekly slates, but deterministic.
  for (let i = games.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [games[i], games[j]] = [games[j], games[i]];
  }

  const gamesByWeek: Record<number, ScheduledGame[]> = {};
  const usedByWeekTeam: Record<number, Set<string>> = {};

  const canPlace = (week: number, g: ScheduledGame) => {
    const used = usedByWeekTeam[week] ?? new Set<string>();
    if (used.has(g.homeTeamId) || used.has(g.awayTeamId)) return false;
    if (byes[g.homeTeamId] === week || byes[g.awayTeamId] === week) return false;
    return true;
  };

  // Prime-time selection: pick 2 games per week (SNF & MNF), prefer rivalry/divisional late season.
  const scoreGameForPrime = (week: number, g: ScheduledGame): number => {
    const ht = LEAGUE_TEAMS.find((t) => t.id === g.homeTeamId)!;
    const at = LEAGUE_TEAMS.find((t) => t.id === g.awayTeamId)!;
    const divisional = ht.conference === at.conference && ht.division === at.division ? 1 : 0;
    const late = week >= 12 ? 1 : 0;
    const s = stableStrength(seed, g.homeTeamId, year) + stableStrength(seed, g.awayTeamId, year);
    return divisional * 2 + late + s;
  };

  // Greedy week fill
  for (let week = 1; week <= 18; week++) {
    gamesByWeek[week] = [];
    usedByWeekTeam[week] = new Set<string>();

    const weekGames: ScheduledGame[] = [];
    // Get candidates not yet scheduled
    for (const g of games) {
      if (g.week !== 0) continue;
      if (canPlace(week, g)) weekGames.push(g);
    }

    // Fill up to needed games count this week, accounting for byes.
    const teamsOnBye = Object.entries(byes).filter(([, w]) => w === week).length;
    const expectedGames = (32 - teamsOnBye) / 2;

    let placed = 0;
    for (const g of weekGames) {
      if (placed >= expectedGames) break;
      if (!canPlace(week, g)) continue;
      g.week = week;
      gamesByWeek[week].push(g);
      usedByWeekTeam[week].add(g.homeTeamId);
      usedByWeekTeam[week].add(g.awayTeamId);
      placed++;
    }
  }

  // Any leftover games: place in earliest week that works.
  for (const g of games) {
    if (g.week !== 0) continue;
    for (let week = 1; week <= 18; week++) {
      if (!canPlace(week, g)) continue;
      g.week = week;
      gamesByWeek[week].push(g);
      usedByWeekTeam[week].add(g.homeTeamId);
      usedByWeekTeam[week].add(g.awayTeamId);
      break;
    }
  }

  // Assign primetime slots per week.
  for (let week = 1; week <= 18; week++) {
    const slate = gamesByWeek[week] ?? [];
    if (slate.length === 0) continue;
    const sorted = [...slate].sort((a, b) => scoreGameForPrime(week, b) - scoreGameForPrime(week, a));
    const snf = sorted[0];
    const mnf = sorted[1] ?? sorted[0];
    slate.forEach((g) => (g.slot = "SUN_EARLY"));
    snf.slot = "SUN_SN";
    mnf.slot = "MON";
  }

  const gamesById: Record<string, ScheduledGame> = {};
  for (const g of games) gamesById[g.id] = g;

  return {
    seasonYear: year,
    seasonWeeks: 22,
    byeByTeamId: byes,
    gamesByWeek,
    gamesById,
    meta: { format: "NFL17+BYE+POSTSEASON", version: 1 },
  };
}

function buildPostseason(seed: number, year: number, schedule: LeagueSchedule): void {
  const rng = mulberry32(seed ^ 0xC0FFEE ^ year);
  const strength = (id: string) => stableStrength(seed, id, year);
  const teamsNC = LEAGUE_TEAMS.filter((t) => t.conference === "NC").map((t) => t.id);
  const teamsAC = LEAGUE_TEAMS.filter((t) => t.conference === "AC").map((t) => t.id);

  const seedsFor = (ids: string[]) => {
    const sorted = [...ids].sort((a, b) => strength(b) - strength(a));
    return sorted.slice(0, 7);
  };

  const nc = seedsFor(teamsNC);
  const ac = seedsFor(teamsAC);

  const wk = (week: number, home: string, away: string, slot: GameSlot) => {
    const g = makeGame(`W${week}:${away}@${home}`, week, home, away, slot);
    schedule.gamesByWeek[week] = schedule.gamesByWeek[week] ?? [];
    schedule.gamesByWeek[week].push(g);
    schedule.gamesById[g.id] = g;
  };

  // Week 19: Wildcard (2v7,3v6,4v5) in each conference.
  const wcPairs = (s: string[]) => [
    [s[1], s[6]],
    [s[2], s[5]],
    [s[3], s[4]],
  ] as Array<[string, string]>;
  for (const [home, away] of wcPairs(nc)) wk(19, home, away, "SUN_EARLY");
  for (const [home, away] of wcPairs(ac)) wk(19, home, away, "SUN_EARLY");

  // Week 20: Divisional (seed1 vs lowest remaining, others vs)
  // Placeholder: we don't know wildcard winners yet; keep TBD games but deterministic placeholders.
  // We'll use "TBD" markers and resolve after week 19 sim.
  wk(20, nc[0], nc[3], "SUN_SN");
  wk(20, nc[1], nc[2], "SUN_LATE");
  wk(20, ac[0], ac[3], "SUN_SN");
  wk(20, ac[1], ac[2], "SUN_LATE");

  // Week 21: Conference Championships (placeholders)
  wk(21, nc[0], nc[1], "SUN_SN");
  wk(21, ac[0], ac[1], "MON");

  // Week 22: Championship
  const homeNC = year % 2 === 0;
  wk(22, homeNC ? nc[0] : ac[0], homeNC ? ac[0] : nc[0], "SUN_SN");

  // Tag primetime for playoff weeks too
  for (const week of [19, 20, 21, 22]) {
    const slate = schedule.gamesByWeek[week] ?? [];
    if (slate.length === 0) continue;
    slate.forEach((g) => (g.slot = "SUN_EARLY"));
    // deterministic pick for SNF/MNF
    const sorted = [...slate].sort(() => (rng() < 0.5 ? -1 : 1));
    sorted[0].slot = "SUN_SN";
    if (sorted[1]) sorted[1].slot = "MON";
  }
}

export function generateLeagueSchedule(seed: number, year = 2026): LeagueSchedule {
  const matchups = buildRegularSeasonMatchups(seed, year);
  const schedule = scheduleWeeks(seed, year, matchups);

  // Postseason placeholder bracket (resolved as sims advance)
  schedule.gamesByWeek[19] = [];
  schedule.gamesByWeek[20] = [];
  schedule.gamesByWeek[21] = [];
  schedule.gamesByWeek[22] = [];
  buildPostseason(seed, year, schedule);

  // Validate counts for regular season (best-effort)
  return schedule;
}
