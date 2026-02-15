import { mulberry32 } from "@/services/rng";

export type GradeBlend = { consistency: number; volatility: number }; // 0..1 each (not necessarily sum 1)

export function computePffGameGrade(seed: number, base: number, impact: number, blend: GradeBlend): number {
  // base ~ talent proxy; impact ~ -3..+3 game swings
  const rng = mulberry32(seed);
  const noise = (rng.next() - 0.5) * 2; // -1..1
  const vol = blend.volatility * 8.0; // swing magnitude
  const cons = blend.consistency * 4.0; // dampening
  const raw = base + impact * (6 - cons) + noise * vol;
  return clamp(raw, 0, 100);
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
