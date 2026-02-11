export type CanonicalOffenseSystem =
  | "West Coast (Classic)"
  | "West Coast (Modern / Shanahan-style)"
  | "Air Coryell"
  | "Vertical Spread"
  | "Spread RPO"
  | "Power Run (Gap)"
  | "Zone Run (Outside / Wide Zone)"
  | "Inside Zone / Duo"
  | "Pro-Style Balanced"
  | "Erhardt–Perkins"
  | "Run & Shoot"
  | "Pistol Offense"
  | "Option / Power Option"
  | "Smashmouth / Ball Control"
  | "Quick Game / Timing Offense"
  | "Empty / Five-Wide"
  | "Two-TE Heavy"
  | "Motion-Based / Misdirection"
  | "Play-Action Vertical"
  | "College Hybrid (Tempo-Based)";

export type CanonicalDefenseSystem =
  | "4–3 Over"
  | "4–3 Under"
  | "3–4 Two-Gap"
  | "3–4 One-Gap"
  | "4–2–5 Nickel Base"
  | "3–3–5 Stack"
  | "Tampa 2"
  | "Cover 2 (Traditional)"
  | "Cover 3 (Single-High)"
  | "Quarters (Cover 4)"
  | "Match Quarters"
  | "Fangio Shell (Two-High Match)"
  | "Man-Heavy / Press-Man"
  | "Zone Blitz"
  | "Fire Zone"
  | "Hybrid Front (Multiple)"
  | "Big Nickel"
  | "Dime Pressure"
  | "Prevent / Soft Shell"
  | "Aggressive Blitz-Heavy";

export type CanonicalSpecialTeamsPhilosophy =
  | "Conservative / Field Position"
  | "Aggressive Returns"
  | "Block-Oriented Pressure"
  | "Safe Hands / No Risk"
  | "Directional Control"
  | "Fake-Ready / Opportunistic";

export const CANONICAL_OFFENSE_SYSTEMS: readonly CanonicalOffenseSystem[] = [
  "West Coast (Classic)",
  "West Coast (Modern / Shanahan-style)",
  "Air Coryell",
  "Vertical Spread",
  "Spread RPO",
  "Power Run (Gap)",
  "Zone Run (Outside / Wide Zone)",
  "Inside Zone / Duo",
  "Pro-Style Balanced",
  "Erhardt–Perkins",
  "Run & Shoot",
  "Pistol Offense",
  "Option / Power Option",
  "Smashmouth / Ball Control",
  "Quick Game / Timing Offense",
  "Empty / Five-Wide",
  "Two-TE Heavy",
  "Motion-Based / Misdirection",
  "Play-Action Vertical",
  "College Hybrid (Tempo-Based)",
] as const;

export const CANONICAL_DEFENSE_SYSTEMS: readonly CanonicalDefenseSystem[] = [
  "4–3 Over",
  "4–3 Under",
  "3–4 Two-Gap",
  "3–4 One-Gap",
  "4–2–5 Nickel Base",
  "3–3–5 Stack",
  "Tampa 2",
  "Cover 2 (Traditional)",
  "Cover 3 (Single-High)",
  "Quarters (Cover 4)",
  "Match Quarters",
  "Fangio Shell (Two-High Match)",
  "Man-Heavy / Press-Man",
  "Zone Blitz",
  "Fire Zone",
  "Hybrid Front (Multiple)",
  "Big Nickel",
  "Dime Pressure",
  "Prevent / Soft Shell",
  "Aggressive Blitz-Heavy",
] as const;

export const CANONICAL_ST_PHILOSOPHIES: readonly CanonicalSpecialTeamsPhilosophy[] = [
  "Conservative / Field Position",
  "Aggressive Returns",
  "Block-Oriented Pressure",
  "Safe Hands / No Risk",
  "Directional Control",
  "Fake-Ready / Opportunistic",
] as const;

export const COACH_SYSTEM_CANON_RULES = {
  primaryPlusSecondaryOnly: true,
  aiUsesSystemIdentityFirst: true,
  requireExplicitCanonExtension: true,
} as const;
