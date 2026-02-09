import type { InterviewQuestionId, InterviewStakeholder } from "@/data/interviewBank";

export type TeamInterviewScript = {
  teamKey: string;
  questionIds: readonly [InterviewQuestionId, InterviewQuestionId, InterviewQuestionId];
  prompts: readonly [
    { label: InterviewStakeholder; questionId: InterviewQuestionId },
    { label: InterviewStakeholder; questionId: InterviewQuestionId },
    { label: InterviewStakeholder; questionId: InterviewQuestionId },
  ];
  thresholds: { ownerMin: number; gmMin: number; maxRisk: number };
  specialRules?: { volatileOwnerSwing: true };
  gmTraits: readonly string[];
};

const DEFAULT_THRESHOLDS = { ownerMin: 50, gmMin: 50, maxRisk: 55 } as const;

export const INTERVIEW_SCRIPTS: Record<string, TeamInterviewScript> = {
  ATLANTA_APEX: {
    teamKey: "ATLANTA_APEX",
    questionIds: ["Q_COMPETE_TIMELINE", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  AUSTIN_EMPIRE: {
    teamKey: "AUSTIN_EMPIRE",
    questionIds: ["Q_COMPETE_TIMELINE", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  BALTIMORE_ADMIRALS: {
    teamKey: "BALTIMORE_ADMIRALS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  BIRMINGHAM_VULCANS: {
    teamKey: "BIRMINGHAM_VULCANS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  BOSTON_HARBORMEN: {
    teamKey: "BOSTON_HARBORMEN",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  BUFFALO_NORTHWIND: {
    teamKey: "BUFFALO_NORTHWIND",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  CHARLOTTE_CROWN: {
    teamKey: "CHARLOTTE_CROWN",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  CHICAGO_UNION: {
    teamKey: "CHICAGO_UNION",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  CLEVELAND_FORGE: {
    teamKey: "CLEVELAND_FORGE",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_ANALYTICS_USAGE", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["analytics"] as const,
  },
  DALLAS_IMPERIALS: {
    teamKey: "DALLAS_IMPERIALS",
    questionIds: ["Q_COMPETE_TIMELINE", "Q_STARS_VS_DEPTH", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_STARS_VS_DEPTH" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["star-driven"] as const,
  },
  DENVER_SUMMIT: {
    teamKey: "DENVER_SUMMIT",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  DETROIT_ASSEMBLY: {
    teamKey: "DETROIT_ASSEMBLY",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  HOUSTON_LAUNCH: {
    teamKey: "HOUSTON_LAUNCH",
    questionIds: ["Q_COMPETE_TIMELINE", "Q_STARS_VS_DEPTH", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_STARS_VS_DEPTH" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["star-driven"] as const,
  },
  INDIANAPOLIS_CROSSROADS: {
    teamKey: "INDIANAPOLIS_CROSSROADS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  JACKSONVILLE_FLEET: {
    teamKey: "JACKSONVILLE_FLEET",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  LAS_VEGAS_SYNDICATE: {
    teamKey: "LAS_VEGAS_SYNDICATE",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_STARS_VS_DEPTH", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_STARS_VS_DEPTH" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["star-driven"] as const,
  },
  LOS_ANGELES_STARS: {
    teamKey: "LOS_ANGELES_STARS",
    questionIds: ["Q_MEDIA_HANDLING", "Q_ACCOUNTABILITY_YEAR1", "Q_STARS_VS_DEPTH"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_MEDIA_HANDLING" },
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_STARS_VS_DEPTH" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["star-driven"] as const,
  },
  MEMPHIS_BLUES: {
    teamKey: "MEMPHIS_BLUES",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  MIAMI_TIDE: {
    teamKey: "MIAMI_TIDE",
    questionIds: ["Q_MEDIA_HANDLING", "Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_MEDIA_HANDLING" },
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ownerMin: 50, gmMin: 50, maxRisk: 52 },
    specialRules: { volatileOwnerSwing: true },
    gmTraits: [] as const,
  },
  MILWAUKEE_NORTHSHORE: {
    teamKey: "MILWAUKEE_NORTHSHORE",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  NASHVILLE_SOUND: {
    teamKey: "NASHVILLE_SOUND",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  NEW_ORLEANS_HEX: {
    teamKey: "NEW_ORLEANS_HEX",
    questionIds: ["Q_MEDIA_HANDLING", "Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_MEDIA_HANDLING" },
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ownerMin: 50, gmMin: 50, maxRisk: 52 },
    specialRules: { volatileOwnerSwing: true },
    gmTraits: [] as const,
  },
  NEW_YORK_GOTHIC_GUARDIANS: {
    teamKey: "NEW_YORK_GOTHIC_GUARDIANS",
    questionIds: ["Q_MEDIA_HANDLING", "Q_COMPETE_TIMELINE", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_MEDIA_HANDLING" },
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  ORLANDO_KINGDOM: {
    teamKey: "ORLANDO_KINGDOM",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  PHILADELPHIA_FOUNDERS: {
    teamKey: "PHILADELPHIA_FOUNDERS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  PHOENIX_SCORCH: {
    teamKey: "PHOENIX_SCORCH",
    questionIds: ["Q_MEDIA_HANDLING", "Q_ACCOUNTABILITY_YEAR1", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_MEDIA_HANDLING" },
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["analytics"] as const,
  },
  PITTSBURGH_IRONCLADS: {
    teamKey: "PITTSBURGH_IRONCLADS",
    questionIds: ["Q_COMPETE_TIMELINE", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_COMPETE_TIMELINE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  SAN_DIEGO_ARMADA: {
    teamKey: "SAN_DIEGO_ARMADA",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  SEATTLE_EVERGREENS: {
    teamKey: "SEATTLE_EVERGREENS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_ANALYTICS_USAGE", "Q_AUTHORITY_STRUCTURE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: ["analytics"] as const,
  },
  ST_LOUIS_ARCHONS: {
    teamKey: "ST_LOUIS_ARCHONS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  ST_PETERSBURG_PELICANS: {
    teamKey: "ST_PETERSBURG_PELICANS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
  WASHINGTON_SENTINELS: {
    teamKey: "WASHINGTON_SENTINELS",
    questionIds: ["Q_ACCOUNTABILITY_YEAR1", "Q_AUTHORITY_STRUCTURE", "Q_ANALYTICS_USAGE"] as const,
    prompts: [
      { label: "Owner", questionId: "Q_ACCOUNTABILITY_YEAR1" },
      { label: "GM", questionId: "Q_AUTHORITY_STRUCTURE" },
      { label: "GM", questionId: "Q_ANALYTICS_USAGE" },
    ] as const,
    thresholds: { ...DEFAULT_THRESHOLDS },
    gmTraits: [] as const,
  },
};