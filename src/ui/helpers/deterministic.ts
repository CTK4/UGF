export type CoordinatorRole = "OC" | "DC" | "STC";

export type CoordinatorCandidateMeta = {
  schemeTag: string;
  styleTag: "Aggressive" | "Balanced" | "Conservative";
  fitScore: number;
  salary: number;
  years: number;
  whyFit: string;
};

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function fallbackScheme(role: CoordinatorRole, hash: number): string {
  const byRole: Record<CoordinatorRole, string[]> = {
    OC: ["Spread", "West Coast", "Power Run"],
    DC: ["4-3", "3-4", "Hybrid Blitz"],
    STC: ["Field Position", "Coverage First", "Return Pressure"],
  };
  return byRole[role][hash % byRole[role].length];
}

export function coordinatorCandidateMeta(input: { role: CoordinatorRole; name: string; scheme?: string }): CoordinatorCandidateMeta {
  const seed = `${input.role}:${input.name}`;
  const hash = hashSeed(seed);

  // Deterministic fit derivation: base 45 + 0..55 from hash bits, always resulting in 45-100.
  const fitScore = 45 + (hash % 56);
  const styleIndex = (Math.floor(hash / 17) % 3) as 0 | 1 | 2;
  const styleTag = ["Aggressive", "Balanced", "Conservative"][styleIndex] as CoordinatorCandidateMeta["styleTag"];

  const salary = 900_000 + ((Math.floor(hash / 97) % 15) * 100_000);
  const years = 2 + (Math.floor(hash / 701) % 4);

  const schemeTag = input.scheme?.trim() ? input.scheme : fallbackScheme(input.role, hash);

  const whyFit = `${input.role} fit ${fitScore}: ${styleTag.toLowerCase()} approach aligns with ${schemeTag.toLowerCase()} principles.`;

  return { schemeTag, styleTag, fitScore, salary, years, whyFit };
}
