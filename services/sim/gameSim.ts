import type { ScheduledGame } from "@/services/schedule/types";
import type { GameResult, PlayResult } from "./types";
import { mulberry32 } from "@/services/rng";
import { OFF_CORE40, DEF_CORE40 } from "@/services/playbook/core40";

type TeamProxy = {
  off: number; // 0-100
  def: number; // 0-100
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function teamProxyFromSave(save: any, teamId: string): TeamProxy {
  // Use existing hooks if present; fall back.
  const ratings = save.teamRatings?.[teamId];
  const off = typeof ratings?.offense === "number" ? ratings.offense : 70;
  const def = typeof ratings?.defense === "number" ? ratings.defense : 70;
  return { off, def };
}

function pickOffCall(rng: ReturnType<typeof mulberry32>, recent: Record<string, number>): string {
  // Usage decay: prefer less-used concepts
  const candidates = OFF_CORE40.map((p) => ({ p, w: 1 / (1 + (recent[p.concept] ?? 0)) }));
  const sum = candidates.reduce((a, c) => a + c.w, 0);
  let t = rng.next() * sum;
  for (const c of candidates) {
    t -= c.w;
    if (t <= 0) return c.p.full;
  }
  return OFF_CORE40[0].full;
}

function pickDefCall(rng: ReturnType<typeof mulberry32>): string {
  return rng.pick(DEF_CORE40).full;
}

function resolvePlay(
  rng: ReturnType<typeof mulberry32>,
  proxiesOff: TeamProxy,
  proxiesDef: TeamProxy,
  offCall: string,
  defCall: string,
  stress: number
): Omit<PlayResult, "id"|"offenseTeamId"|"defenseTeamId"|"offenseCall"|"defenseCall"> {
  const isPass = /Scat|PlayAction|RPO|Mesh|Verts|Cross|Dig|Levels|Shallow|Smash|YCross|Stick|Flood|Sail|Post/i.test(offCall);
  const baseYards = isPass ? 6 : 4;
  const offEdge = (proxiesOff.off - proxiesDef.def) / 20; // -?..? roughly
  const defAgg = /Zero|Mug|Overload|Blitz|Sim|Creeper/i.test(defCall) ? 0.12 : 0.0;
  const complexity = (isPass ? 1.0 : 0.7) + (offCall.includes("Jet") || offCall.includes("Orbit") ? 0.2 : 0);

  // Stress reduces complexity busts by simplification tier, but here stress increases errors.
  const bustProb = clamp(0.03 + complexity * 0.02 + (stress / 100) * 0.06, 0, 0.25);
  const sackProb = isPass ? clamp(0.05 + defAgg + (1 - clamp(offEdge + 0.5, 0, 1)) * 0.06, 0, 0.22) : 0.01;
  const turnoverProb = isPass ? 0.02 + defAgg * 0.04 : 0.01;
  const bigPlayProb = isPass ? clamp(0.05 + offEdge * 0.06 - defAgg * 0.02, 0.01, 0.18) : clamp(0.04 + offEdge * 0.04, 0.01, 0.14);

  const busted = rng.next() < bustProb;
  const sacked = isPass && rng.next() < sackProb;
  const turnover = rng.next() < turnoverProb ? (isPass ? "INT" : "FUM") : undefined;

  let yards = Math.round(baseYards + offEdge * 6 + (rng.next() - 0.5) * 6);
  if (busted) yards = Math.round(yards - (2 + rng.next() * 5));
  if (sacked) yards = -Math.round(4 + rng.next() * 5);
  if (turnover) yards = 0;

  if (!busted && rng.next() < bigPlayProb) yards += Math.round(8 + rng.next() * 25);

  yards = clamp(yards, -12, 55);

  const note = turnover
    ? `${turnover}!`
    : sacked
      ? "Sack"
      : busted
        ? "Bust"
        : yards >= 20
          ? "Explosive"
          : yards <= 0
            ? "Stuffed"
            : "Normal";

  const penalty = rng.next() < clamp(0.03 + (stress/100)*0.04 + (defAgg>0?0.01:0), 0, 0.18);

  return { yards, type: isPass ? "PASS" : "RUN", turnover, sack: sacked, penalty, note };
}

export function simulateGame(seed: number, save: any, game: ScheduledGame): GameResult {
  const rng = mulberry32(seed ^ hashStr(game.id));
  const home = teamProxyFromSave(save, game.homeTeamId);
  const away = teamProxyFromSave(save, game.awayTeamId);

  let homeScore = 0;
  let awayScore = 0;
  const plays: PlayResult[] = [];

  // simple possession-based sim: 22 possessions max
  let offense = rng.next() < 0.5 ? game.homeTeamId : game.awayTeamId;
  let defense = offense === game.homeTeamId ? game.awayTeamId : game.homeTeamId;

  const recent: Record<string, number> = {};
  let stress = 0;

  for (let drive = 0; drive < 22; drive++) {
    let down = 1;
    let toGo = 10;
    let yardLine = 25; // distance from own goal
    let drivePlays = 0;
    let drivePoints = 0;

    while (drivePlays < 10) {
      const offCall = pickOffCall(rng, recent);
      const defCall = pickDefCall(rng);
      const offProxy = offense === game.homeTeamId ? home : away;
      const defProxy = defense === game.homeTeamId ? home : away;

      // track concept usage
      const concept = OFF_CORE40.find((p) => p.full === offCall)?.concept ?? "GEN";
      recent[concept] = (recent[concept] ?? 0) + 1;

      const res = resolvePlay(rng, offProxy, defProxy, offCall, defCall, stress);
      const playId = `${game.id}_D${drive}_P${drivePlays}`;
      plays.push({
        id: playId,
        offenseTeamId: offense,
        defenseTeamId: defense,
        offenseCall: offCall,
        defenseCall: defCall,
        ...res,
      });

      drivePlays++;

      if (res.turnover) {
        // possession flip
        stress = clamp(stress + 10, 0, 100);
        break;
      }

      yardLine += res.yards;
      if (res.penalty) {
        // small random penalty swing
        yardLine += rng.next() < 0.6 ? -5 : 5;
      }

      if (yardLine >= 100) {
        drivePoints = 7;
        break;
      }
      if (yardLine < 0) {
        // safety-ish
        drivePoints = -2;
        break;
      }

      if (res.yards >= toGo) {
        down = 1;
        toGo = 10;
      } else {
        down++;
        toGo = Math.max(1, toGo - Math.max(0, res.yards));
        if (down > 4) {
          // punt/FG attempt
          if (yardLine >= 65 && rng.next() < 0.55) drivePoints = 3;
          break;
        }
      }

      // stress update
      if (res.note === "Bust" || res.note === "Sack" || res.note === "Stuffed") stress = clamp(stress + 4, 0, 100);
      else stress = clamp(stress - 2, 0, 100);
    }

    if (drivePoints === 7) {
      if (offense === game.homeTeamId) homeScore += 7;
      else awayScore += 7;
    } else if (drivePoints === 3) {
      if (offense === game.homeTeamId) homeScore += 3;
      else awayScore += 3;
    } else if (drivePoints === -2) {
      // safety: defense gets 2
      if (defense === game.homeTeamId) homeScore += 2;
      else awayScore += 2;
    }

    // swap possession
    const nextOff = defense;
    defense = offense;
    offense = nextOff;
  }

  const summary = [
    `${game.awayTeamId} ${awayScore} @ ${game.homeTeamId} ${homeScore}`,
    `Plays: ${plays.length}`,
  ];

  return {
    gameId: game.id,
    week: game.week,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    homeScore,
    awayScore,
    plays,
    summary,
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
