export type InterviewQuestionId =
  | "Q_ACCOUNTABILITY_YEAR1"
  | "Q_MEDIA_HANDLING"
  | "Q_STARS_VS_DEPTH"
  | "Q_COMPETE_TIMELINE"
  | "Q_ANALYTICS_USAGE"
  | "Q_AUTHORITY_STRUCTURE";

export type InterviewStakeholder = "Owner" | "GM";

export type InterviewChoiceId = "A" | "B" | "C";

export type InterviewEffectVector = {
  owner: number;
  gm: number;
  risk: number;
};

export type InterviewChoice = {
  id: InterviewChoiceId;
  text: string;
  baseOwner: number;
  baseGm: number;
  baseRisk: number;
};

export type InterviewTraitChoiceModifiers = Partial<Record<InterviewChoiceId, InterviewEffectVector>>;

export type InterviewQuestionDefinition = {
  id: InterviewQuestionId;
  label: InterviewStakeholder;
  prompt: string;
  choices: [InterviewChoice, InterviewChoice, InterviewChoice];
  ownerTraitMods?: Record<string, InterviewTraitChoiceModifiers>;
  gmTraitMods?: Record<string, InterviewTraitChoiceModifiers>;
};

function scaled(delta: InterviewEffectVector): InterviewTraitChoiceModifiers {
  return {
    A: { ...delta },
    B: {
      owner: Math.round(delta.owner * 0.5),
      gm: Math.round(delta.gm * 0.5),
      risk: Math.round(delta.risk * 0.25),
    },
    C: {
      owner: -Math.round(delta.owner * 0.5),
      gm: -Math.round(delta.gm * 0.5),
      risk: -Math.round(delta.risk * 0.5),
    },
  };
}

export const INTERVIEW_QUESTION_BANK: Record<InterviewQuestionId, InterviewQuestionDefinition> = {
  Q_ACCOUNTABILITY_YEAR1: {
    id: "Q_ACCOUNTABILITY_YEAR1",
    label: "Owner",
    prompt: "How will you establish accountability in year one?",
    choices: [
      { id: "A", text: "Set measurable standards and review them weekly.", baseOwner: 8, baseGm: 2, baseRisk: 4 },
      { id: "B", text: "Empower veteran leaders first, then formalize standards.", baseOwner: 4, baseGm: 1, baseRisk: 1 },
      { id: "C", text: "Keep expectations loose early and adjust later.", baseOwner: -4, baseGm: -1, baseRisk: -2 },
    ],
    ownerTraitMods: {
      impatient: scaled({ owner: 3, gm: 0, risk: 1 }),
      demanding: scaled({ owner: 3, gm: 0, risk: 2 }),
      disciplined: scaled({ owner: 2, gm: 1, risk: 0 }),
      patient: scaled({ owner: -2, gm: 1, risk: -1 }),
    },
  },
  Q_MEDIA_HANDLING: {
    id: "Q_MEDIA_HANDLING",
    label: "Owner",
    prompt: "How do you handle media pressure after a losing stretch?",
    choices: [
      { id: "A", text: "Own the results publicly and protect the locker room.", baseOwner: 6, baseGm: 1, baseRisk: 7 },
      { id: "B", text: "Keep messaging internal and stay measured externally.", baseOwner: 3, baseGm: 1, baseRisk: 2 },
      { id: "C", text: "Call out execution publicly to force urgency.", baseOwner: -3, baseGm: -1, baseRisk: -4 },
    ],
    ownerTraitMods: {
      "media-sensitive": scaled({ owner: 4, gm: 0, risk: 2 }),
      "media-aware": scaled({ owner: 3, gm: 0, risk: 1 }),
      "image-focused": scaled({ owner: 4, gm: -1, risk: 2 }),
      volatile: scaled({ owner: 2, gm: -1, risk: 3 }),
    },
  },
  Q_STARS_VS_DEPTH: {
    id: "Q_STARS_VS_DEPTH",
    label: "GM",
    prompt: "When building the roster, do you prioritize stars or depth?",
    choices: [
      { id: "A", text: "Use premium resources on stars and build around them.", baseOwner: 2, baseGm: 8, baseRisk: 5 },
      { id: "B", text: "Balance top-end talent and rotational depth.", baseOwner: 1, baseGm: 4, baseRisk: 1 },
      { id: "C", text: "Prioritize cheap depth and avoid major swings.", baseOwner: -1, baseGm: -4, baseRisk: -3 },
    ],
    gmTraitMods: {
      "star-driven": scaled({ owner: 1, gm: 4, risk: 1 }),
      efficiency: scaled({ owner: 0, gm: 2, risk: -1 }),
      trenches: scaled({ owner: 1, gm: 1, risk: -1 }),
      opportunistic: scaled({ owner: 1, gm: 1, risk: 1 }),
    },
  },
  Q_COMPETE_TIMELINE: {
    id: "Q_COMPETE_TIMELINE",
    label: "Owner",
    prompt: "What is your timetable to compete for championships?",
    choices: [
      { id: "A", text: "Compete immediately with a focused two-year push.", baseOwner: 7, baseGm: 3, baseRisk: 6 },
      { id: "B", text: "Build steadily and peak in years two through three.", baseOwner: 4, baseGm: 2, baseRisk: 2 },
      { id: "C", text: "Prioritize long-term flexibility over early wins.", baseOwner: -3, baseGm: -1, baseRisk: -3 },
    ],
    ownerTraitMods: {
      ambitious: scaled({ owner: 3, gm: 0, risk: 2 }),
      dominant: scaled({ owner: 3, gm: 0, risk: 2 }),
      impatient: scaled({ owner: 2, gm: 0, risk: 2 }),
      patient: scaled({ owner: -2, gm: 1, risk: -2 }),
    },
  },
  Q_ANALYTICS_USAGE: {
    id: "Q_ANALYTICS_USAGE",
    label: "GM",
    prompt: "How heavily should analytics shape weekly football decisions?",
    choices: [
      { id: "A", text: "Use analytics aggressively for weekly and roster decisions.", baseOwner: 1, baseGm: 8, baseRisk: 4 },
      { id: "B", text: "Blend analytics with coaching feel and context.", baseOwner: 1, baseGm: 4, baseRisk: 1 },
      { id: "C", text: "Rely mostly on traditional scouting and intuition.", baseOwner: -1, baseGm: -4, baseRisk: -2 },
    ],
    ownerTraitMods: {
      analytical: scaled({ owner: 1, gm: 2, risk: 0 }),
      "process-oriented": scaled({ owner: 1, gm: 1, risk: 0 }),
      innovative: scaled({ owner: 0, gm: 2, risk: 1 }),
      traditional: scaled({ owner: -1, gm: -1, risk: 1 }),
    },
    gmTraitMods: {
      analytics: scaled({ owner: 1, gm: 4, risk: 0 }),
      efficiency: scaled({ owner: 0, gm: 1, risk: -1 }),
    },
  },
  Q_AUTHORITY_STRUCTURE: {
    id: "Q_AUTHORITY_STRUCTURE",
    label: "GM",
    prompt: "How should authority be split between coach, GM, and ownership?",
    choices: [
      { id: "A", text: "Define clear domains with shared checkpoints.", baseOwner: 5, baseGm: 6, baseRisk: 6 },
      { id: "B", text: "Use collaborative decisions with owner tie-breakers.", baseOwner: 3, baseGm: 3, baseRisk: 2 },
      { id: "C", text: "Coach should hold final authority on football ops.", baseOwner: -3, baseGm: -3, baseRisk: -3 },
    ],
    ownerTraitMods: {
      "hands-on": scaled({ owner: 3, gm: -2, risk: 2 }),
      dominant: scaled({ owner: 2, gm: -2, risk: 2 }),
      institutional: scaled({ owner: 1, gm: 2, risk: -1 }),
      pragmatic: scaled({ owner: 1, gm: 2, risk: -1 }),
    },
    gmTraitMods: {
      efficiency: scaled({ owner: 0, gm: 2, risk: -1 }),
      trenches: scaled({ owner: 1, gm: 1, risk: -1 }),
    },
  },
};
