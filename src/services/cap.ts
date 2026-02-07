export type CapModel = {
  capYear0: number;
  growthRate: number;
};

export function leagueCapForYear(startYear: number, year: number, model: CapModel = { capYear0: 240_000_000, growthRate: 0.045 }): number {
  const y = Math.max(0, year - startYear);
  let cap = model.capYear0;
  for (let i = 0; i < y; i++) cap = Math.round(cap * (1 + model.growthRate));
  return cap;
}
