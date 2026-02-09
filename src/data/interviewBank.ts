export type InterviewQuestionId =
  | "Q_ACCOUNTABILITY_YEAR1"
  | "Q_MEDIA_HANDLING"
  | "Q_STARS_VS_DEPTH"
  | "Q_COMPETE_TIMELINE"
  | "Q_ANALYTICS_USAGE"
  | "Q_AUTHORITY_STRUCTURE";

export type InterviewStakeholder = "Owner" | "GM";

export type InterviewEffectVector = {
  owner: number;
  gm: number;
  risk: number;
};

export type InterviewTraitModifier = {
  trait: string;
  delta: InterviewEffectVector;
};

export type InterviewQuestionDefinition = {
  id: InterviewQuestionId;
  label: InterviewStakeholder;
  prompt: string;
  baseEffects: InterviewEffectVector;
  traitModifiers: InterviewTraitModifier[];
};

export const INTERVIEW_QUESTION_BANK: Record<InterviewQuestionId, InterviewQuestionDefinition> = {
  Q_ACCOUNTABILITY_YEAR1: {
    id: "Q_ACCOUNTABILITY_YEAR1",
    label: "Owner",
    prompt: "How will you establish accountability in year one?",
    baseEffects: { owner: 8, gm: 2, risk: 4 },
    traitModifiers: [
      { trait: "impatient", delta: { owner: 3, gm: 0, risk: 1 } },
      { trait: "demanding", delta: { owner: 3, gm: 0, risk: 2 } },
      { trait: "disciplined", delta: { owner: 2, gm: 1, risk: 0 } },
      { trait: "patient", delta: { owner: -2, gm: 1, risk: -1 } },
    ],
  },
  Q_MEDIA_HANDLING: {
    id: "Q_MEDIA_HANDLING",
    label: "Owner",
    prompt: "How do you handle media pressure after a losing stretch?",
    baseEffects: { owner: 6, gm: 1, risk: 7 },
    traitModifiers: [
      { trait: "media-sensitive", delta: { owner: 4, gm: 0, risk: 2 } },
      { trait: "media-aware", delta: { owner: 3, gm: 0, risk: 1 } },
      { trait: "image-focused", delta: { owner: 4, gm: -1, risk: 2 } },
      { trait: "volatile", delta: { owner: 2, gm: -1, risk: 3 } },
    ],
  },
  Q_STARS_VS_DEPTH: {
    id: "Q_STARS_VS_DEPTH",
    label: "GM",
    prompt: "When building the roster, do you prioritize stars or depth?",
    baseEffects: { owner: 2, gm: 8, risk: 5 },
    traitModifiers: [
      { trait: "star-driven", delta: { owner: 1, gm: 4, risk: 1 } },
      { trait: "efficiency", delta: { owner: 0, gm: 2, risk: -1 } },
      { trait: "conservative", delta: { owner: 1, gm: -1, risk: -1 } },
      { trait: "opportunistic", delta: { owner: 1, gm: 1, risk: 1 } },
    ],
  },
  Q_COMPETE_TIMELINE: {
    id: "Q_COMPETE_TIMELINE",
    label: "Owner",
    prompt: "What is your timetable to compete for championships?",
    baseEffects: { owner: 7, gm: 3, risk: 6 },
    traitModifiers: [
      { trait: "ambitious", delta: { owner: 3, gm: 0, risk: 2 } },
      { trait: "dominant", delta: { owner: 3, gm: 0, risk: 2 } },
      { trait: "impatient", delta: { owner: 2, gm: 0, risk: 2 } },
      { trait: "patient", delta: { owner: -2, gm: 1, risk: -2 } },
    ],
  },
  Q_ANALYTICS_USAGE: {
    id: "Q_ANALYTICS_USAGE",
    label: "GM",
    prompt: "How heavily should analytics shape weekly football decisions?",
    baseEffects: { owner: 1, gm: 8, risk: 4 },
    traitModifiers: [
      { trait: "analytical", delta: { owner: 1, gm: 4, risk: 0 } },
      { trait: "process-oriented", delta: { owner: 1, gm: 3, risk: 0 } },
      { trait: "innovative", delta: { owner: 0, gm: 3, risk: 1 } },
      { trait: "traditional", delta: { owner: -1, gm: -2, risk: 1 } },
    ],
  },
  Q_AUTHORITY_STRUCTURE: {
    id: "Q_AUTHORITY_STRUCTURE",
    label: "GM",
    prompt: "How should authority be split between coach, GM, and ownership?",
    baseEffects: { owner: 5, gm: 6, risk: 6 },
    traitModifiers: [
      { trait: "hands-on", delta: { owner: 3, gm: -2, risk: 2 } },
      { trait: "dominant", delta: { owner: 2, gm: -2, risk: 2 } },
      { trait: "institutional", delta: { owner: 1, gm: 2, risk: -1 } },
      { trait: "pragmatic", delta: { owner: 1, gm: 2, risk: -1 } },
    ],
  },
};
