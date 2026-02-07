import type { StaffMember, StaffRole } from "@/services/staff";

const RAW = "Brent Messer \u2014 OL Coach | Scheme Engineer | Strategic, adaptable, precise | Zone-heavy, multiple fronts\nGiovani Escamilla \u2014 RB Coach | Tempo Driver | Energetic, competitive, motivating | Inside zone / split-flow\nDonald Esquivel \u2014 DL Coach | Trench Enforcer | Physical, intense, disciplinarian | One-gap attacking front\nQuincy Sotelo \u2014 DB Coach | Film Savant | Analytical, anticipatory, precise | Quarters / match coverage\nMacayla Vieira \u2014 WR Coach | Route Artisan | Creative, detailed, expressive | West Coast spacing concepts\nRogelio Spivey \u2014 LB Coach | Run-Fit Purist | Physical, demanding, disciplined | 4\u20133 over, spill-and-kill\nLori Reardon \u2014 ST Coordinator | Logistics Architect | Organized, meticulous, reliable | Field-position optimization\nCyrus Brady \u2014 QB Coach | Mental Processor Coach | Cerebral, calm, methodical | Timing-based progression reads\nAric Slaughter \u2014 DL Coach | Edge Maximizer | Aggressive, explosive, relentless | Wide-9 pressure front\nEugene Payne \u2014 OL Coach | Old-School Technician | Tough, fundamentals-first, demanding | Power / counter run game\nBenton Nunez \u2014 RB Coach | Vision Developer | Patient, observational, developmental | Zone-read emphasis\nJohana Hilliard \u2014 WR Coach | Hands Technician | Technical, corrective, consistent | Short-area efficiency\nSavanna Long \u2014 DB Coach | Coverage Strategist | Methodical, spatially-aware, disciplined | Pattern-match zone\nMarla Gillis \u2014 ST Coordinator | Risk Manager | Conservative, situational, alert | Safe-return philosophy\nRodney Lay \u2014 LB Coach | Field General Mentor | Vocal, instinctive, authoritative | Mike-driven front adjustments\nSydnie Arrington \u2014 QB Coach | Quarterback Whisperer | Composed, supportive, clear | Simplified RPO structure\nPearl Swisher \u2014 WR Coach | Spatial Separator | Intelligent, creative, precise | Spread isolation concepts\nEmely Collins \u2014 RB Coach | Ball-Security Purist | Detail-driven, strict, reliable | Clock-control rushing attack\nJacie Paz \u2014 DB Coach | Technique Enforcer | Demanding, consistent, exacting | Press-man fundamentals\nBelen Lamar \u2014 OL Coach | Leverage Specialist | Mechanical, disciplined, precise | Low-pad inside zone\nNicolle Hoff \u2014 DL Coach | Gap-Control Specialist | Assignment-sound, patient, strong | Two-gap integrity front\nJana Canfield \u2014 LB Coach | Pressure Designer | Creative, aggressive, assertive | Simulated pressures\nRashawn Epstein \u2014 DB Coach | Film Savant | Analytical, prepared, anticipatory | Disguise-heavy coverage shells\nDevlin Britton \u2014 ST Coordinator | Hidden-Yards Maximizer | Opportunistic, analytical, bold | Aggressive punt block units\nReanna Hough \u2014 QB Coach | Scheme Translator | Strategic, communicative, adaptable | Hybrid spread concepts\nBrea Hoff \u2014 RB Coach | Vision Developer | Observant, patient, steady | Stretch-zone emphasis\nMaricela Chappell \u2014 WR Coach | Route Artisan | Detailed, precise, creative | Intermediate route trees\nMario McCauley \u2014 OL Coach | Old-School Technician | Tough, demanding, traditional | Gap-scheme dominance\nAmalia Foreman \u2014 DL Coach | Trench Enforcer | Intense, physical, relentless | Interior penetration focus\nValentin Zhao \u2014 DB Coach | Coverage Strategist | Disciplined, calm, spatially-aware | Quarters / Cover 6\nSimran Brand \u2014 QB Coach | Mental Processor Coach | Analytical, calm, structured | Full-field progression reads\nDonnie Chu \u2014 ST Coordinator | Logistics Architect | Precise, dependable, structured | Return-lane discipline\nKamren Seals \u2014 LB Coach | Field General Mentor | Vocal, organized, instinctive | Front-alignment control\nPhoenix Keefe \u2014 WR Coach | Spatial Separator | Creative, intelligent, fluid | Spread vertical concepts\nDraven Mullen \u2014 RB Coach | Tempo Driver | High-energy, competitive, motivating | Hurry-up run packages\nEllie Begley \u2014 OL Coach | Scheme Engineer | Tactical, adaptable, precise | Multiple run identities\nMaeve Emerson \u2014 DB Coach | Technique Enforcer | Exacting, consistent, demanding | Press-bail coverage\nRyann Steen \u2014 DL Coach | Gap-Control Specialist | Disciplined, patient, powerful | Early-down run control\nJustine Windham \u2014 QB Coach | Quarterback Whisperer | Calm, confidence-builder, clear | Simplified coverage IDs\nKatya Beasley \u2014 ST Coordinator | Risk Manager | Conservative, situational, alert | Kick coverage containment\nKerri Straub \u2014 WR Coach | Hands Technician | Technical, patient, corrective | High-percentage targets\nEsmeralda Yarbrough \u2014 RB Coach | Ball-Security Purist | Strict, detail-focused, reliable | Four-minute offense\nMohamed Poole \u2014 LB Coach | Run-Fit Purist | Physical, accountable, disciplined | Box-heavy personnel\nTrevor Kane \u2014 OL Coach | Leverage Specialist | Mechanical, disciplined, precise | Double-team emphasis\nOrion Shea \u2014 DL Coach | Edge Maximizer | Explosive, aggressive, relentless | Pass-rush first philosophy\nTanisha Limon \u2014 DB Coach | Film Savant | Analytical, prepared, anticipatory | Route-recognition defense\nYulissa Broussard \u2014 ST Coordinator | Hidden-Yards Maximizer | Aggressive, opportunistic, analytical | Fake-pressure packages\nMadelyn Boyd \u2014 QB Coach | Scheme Translator | Strategic, communicative, adaptable | RPO-heavy structure\nJustice Jeffries \u2014 LB Coach | Pressure Designer | Creative, attacking, assertive | A-gap blitz packages\nGregorio Sewell \u2014 RB Coach | Vision Developer | Patient, observational, developmental | Cutback-oriented zone\nPaula Liang \u2014 WR Coach | Route Artisan | Precise, technical, creative | Option-route concepts\nRyder Bolen \u2014 OL Coach | Old-School Technician | Tough, demanding, fundamentals-first | Downhill run emphasis\nCordell Latham \u2014 DL Coach | Trench Enforcer | Physical, intense, authoritative | Early-down dominance\nKasandra Anthony \u2014 DB Coach | Coverage Strategist | Spatially-aware, disciplined, calm | Split-field zone\nIvanna Ray \u2014 QB Coach | Mental Processor Coach | Analytical, calm, structured | Coverage-based check system\nEli Blount \u2014 ST Coordinator | Logistics Architect | Organized, punctual, meticulous | Situational substitution\n\n*elite tier*\nVince \u201cThe General\u201d Lombarte \u2014 HC | Master Strategist | Visionary, disciplined, authoritative | Championship-level game planning\nCarter \u201cBear\u201d Bryantson \u2014 DC | Defense Architect | Tough, accountable, schematically astute | Gap control + alley-assignment focus\nNick Sabanelli \u2014 OC | Quarterback Whisperer | Methodical, communicator, detail-driven | Precision timing progressions\nTed Lasica \u2014 WR Coach | Player-First Coach | Motivational, positive-culture builder | Spread isolation concepts\nPop Warnerfield \u2014 ST Coordinator | Special Teams Virtuoso | Creative, energetic, opportunistic | Hidden-yard advantage units\nKnute Rockwell \u2014 OL Coach | Fundamentals Enforcer | Mechanical, demanding, resilient | Power / counter ground game\nAmos \u201cAl\u201d Staggsworth \u2014 DL Coach | Trench Dominator | Physical, disciplined, assignment-true | Two-gap integrity front\nBo Pelinic \u2014 LB Coach | Field General Mentor | Vocal, instinctive, leader | Mike-driven front fits\nSaban Shanadale \u2014 DB Coach | Coverage Strategist | Analytical, anticipatory, composed | Quarters / match coverage\nChip \u201cClutch\u201d Shannigan \u2014 QB Coach | Mental Edge Specialist | Calm under pressure, teacher, adaptive | RPO-heavy progression reads\nHank Halvorsen \u2014 OL Coach | Culture Enforcer | Relentless, precise, authoritative | Power-gap with modern protections\nJulian Corso \u2014 OC | Offensive Architect | Strategic, adaptive, anticipatory | Multiple formations, matchup-driven\nMarcus \u201cLockdown\u201d Reeves \u2014 DB Coach | Coverage Savant | Technical, analytical, composed | Press-man with match-zone answers\nOwen Callahan \u2014 RB Coach | Situational Specialist | Detail-obsessed, calm, efficient | Red-zone efficiency / ball-security focus\nDominic \u201cDoc\u201d Calder \u2014 ST Coordinator | Margins Master | Meticulous, inventive, disciplined | Field-position dominance philosophy\nRaymond \u201cStonewall\u201d Keller \u2014 DL Coach | Front-Structure Purist | Disciplined, immovable, exacting | Two-gap integrity with situational penetration\nElijah Monroe \u2014 QB Coach | Field Vision Architect | Poised, anticipatory, teacher | Full-field progression with leverage reads\nTrent Walker \u2014 RB Coach | Run-Game Sculptor | Physical, efficient, unsentimental | Downhill zone / gap hybrid\nVictor Salazar \u2014 DC | Defensive Systems Grandmaster | Calculated, adaptive, unflappable | Disguise-heavy quarters / pressure balance\nPatrick O\u2019Donnell \u2014 LB Coach | Culture Connector | Communicative, stabilizing, authoritative | Box integrity with matchup flexibility\nBill Parcello \u2014 DC | Front Multiplicity Master | Authoritative, adaptive, ruthless | Hybrid 3\u20134 / 4\u20133 with matchup fronts\nKyle Shanford \u2014 OC | Run-Game Philosopher | Precise, patient, sequencing-focused | Wide-zone into boot/play-action\nPete Carrollton \u2014 HC | Culture Maximizer | Energetic, resilient, empowering | Player-led complementary football\nMike Tomliss \u2014 LB Coach | Emotional Regulator | Steady, commanding, trust-builder | Base defense with situational aggression\nAndy Reidman \u2014 QB Coach | Offensive Organizer | Creative, structured, teacher | West Coast concepts with vertical tags\n";

function idFrom(name: string): string {
  return "coach:" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function roleFrom(position: string): StaffRole {
  const p = position.toLowerCase();
  if (p.includes("head coach") || p === "hc") return "HC";
  if (p.includes("offensive coordinator") || p === "oc") return "OC";
  if (p.includes("defensive coordinator") || p === "dc") return "DC";
  if (p.includes("st coordinator") || p.includes("special teams")) return "ST";
  if (p.includes("qb")) return "QB_COACH";
  if (p.includes("ol")) return "OL";
  if (p.includes("dl")) return "DL";
  if (p.includes("lb")) return "LB";
  if (p.includes("db")) return "DB";
  if (p.includes("wr") || p.includes("rb")) return "WR_RB";
  return "ASST";
}

export function loadCoachFreeAgents(): StaffMember[] {
  const lines = RAW.split("\n").map((l) => l.trim()).filter(Boolean);
  let elite = false;
  const out: StaffMember[] = [];

  for (const line of lines) {
    if (line.startsWith("*elite tier*")) { elite = true; continue; }
    const parts = line.split("—").map((s) => s.trim());
    if (parts.length < 2) continue;

    const name = parts[0];
    const rest = parts.slice(1).join("—").trim();

    const pipes = rest.split("|").map((s) => s.trim());
    const position = pipes[0] ?? "Assistant";
    const archetype = pipes[1] ?? "";
    const traits = pipes[2] ?? "";
    const scheme = pipes[3] ?? "";

    const role = roleFrom(position);
    // Rating heuristic: elite higher; otherwise stable mid.
    const base = elite ? 88 : 72;
    const bump = Math.min(10, Math.max(-10, (name.length % 11) - 5));
    const rating = Math.max(50, Math.min(99, base + bump));

    out.push({
      id: idFrom(name),
      name,
      position: (position.includes("Coach") || position.includes("Coordinator") || position.length > 0) ? (position as any) : ("Owner" as any),
      traits,
      rating,
      tier: elite ? "Elite" : "Standard",
      scheme,
      archetype,
    });
  }

  return out;
}
