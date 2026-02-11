export type HiddenPlayerPsychKey =
  | "coachability"
  | "accountability"
  | "ego"
  | "composure"
  | "competitiveDrive"
  | "mediaSensitivity"
  | "disciplineRisk"
  | "volatilityIndex";

export type HiddenCoachPsychKey =
  | "adaptability"
  | "authority"
  | "emotionalControl"
  | "staffEmpathy"
  | "schemeRigidity"
  | "politicalAwareness";

export type HiddenUserPsychKey = "leadershipIdentity" | "mediaPersona" | "loyaltyReputation" | "staffStabilityIndex";

export type InterviewDelta = -2 | -1 | 0 | 1 | 2;

export type InterviewChoiceEffect = {
  label: string;
  deltas: Record<string, InterviewDelta>;
  narrativeTag: string;
};

export type StructuredInterviewQuestion = {
  id: string;
  prompt: string;
  category: "FOOTBALL_IQ" | "ADVERSITY" | "ACCOUNTABILITY" | "SCHEME_FIT" | "RED_FLAG" | "MEDIA" | "DELEGATION";
  choices: InterviewChoiceEffect[];
};

export const PROSPECT_INTERVIEW_CORE_STRUCTURE = [
  "Football IQ question",
  "Adversity question",
  "Accountability question",
  "Scheme fit question",
  "Optional red-flag follow-up",
] as const;

export const COORDINATOR_INTERVIEW_CORE_STRUCTURE = [
  "Scheme identity alignment",
  "Delegation philosophy",
  "Ego/control",
  "Player development style",
  "Media temperament",
] as const;

export const PROSPECT_INTERVIEW_TEMPLATES: readonly StructuredInterviewQuestion[] = [
  {
    id: "prospect-coverages",
    category: "FOOTBALL_IQ",
    prompt: "Describe what you see against this defensive clip.",
    choices: [
      {
        label: "Correct shell ID + humility",
        deltas: { processingSpeed: 2, coachability: 1, volatilityIndex: -1 },
        narrativeTag: "High-processing and coachable",
      },
      {
        label: "Matchup-only answer",
        deltas: { processingSpeed: 0, competitiveDrive: 1 },
        narrativeTag: "Athlete-first processor",
      },
      {
        label: "Generic response",
        deltas: { processingSpeed: -1 },
        narrativeTag: "Limited processing detail",
      },
      {
        label: "Overconfident misread",
        deltas: { processingSpeed: -2, ego: 1, volatilityIndex: 1 },
        narrativeTag: "Volatile confidence profile",
      },
    ],
  },
  {
    id: "prospect-accountability",
    category: "ACCOUNTABILITY",
    prompt: "How do you respond when your play contributes to a loss?",
    choices: [
      {
        label: "Owns mistake, concrete adjustment plan",
        deltas: { accountability: 2, composure: 1, disciplineRisk: -1 },
        narrativeTag: "High-accountability",
      },
      {
        label: "Shared responsibility",
        deltas: { accountability: 0, composure: 0 },
        narrativeTag: "Neutral accountability",
      },
      {
        label: "Blames teammates/coaches",
        deltas: { accountability: -2, ego: 1, volatilityIndex: 1 },
        narrativeTag: "Potential locker-room friction",
      },
    ],
  },
] as const;

export const COORDINATOR_INTERVIEW_TEMPLATES: readonly StructuredInterviewQuestion[] = [
  {
    id: "coord-flexibility",
    category: "DELEGATION",
    prompt: "How flexible is your system week to week?",
    choices: [
      {
        label: "Adapt weekly to opponent + personnel",
        deltas: { adaptability: 2, schemeRigidity: -1 },
        narrativeTag: "Flexible operator",
      },
      {
        label: "System works if executed",
        deltas: { authority: 1, schemeRigidity: 2, staffEmpathy: -1 },
        narrativeTag: "High-control coordinator",
      },
      {
        label: "Personnel drives weekly identity",
        deltas: { adaptability: 1, staffEmpathy: 1 },
        narrativeTag: "Collaborative adjuster",
      },
    ],
  },
  {
    id: "coord-playcalling-takeover",
    category: "MEDIA",
    prompt: "If I take over playcalling in Q4, what happens next?",
    choices: [
      {
        label: "It is your team",
        deltas: { emotionalControl: 1, politicalAwareness: 1 },
        narrativeTag: "Stable under hierarchy",
      },
      {
        label: "We should discuss it before game day",
        deltas: { authority: 1, adaptability: 0 },
        narrativeTag: "Negotiated autonomy",
      },
      {
        label: "That will not happen",
        deltas: { authority: 2, staffEmpathy: -2, emotionalControl: -1 },
        narrativeTag: "Ego conflict risk",
      },
    ],
  },
] as const;

export const MEDIA_RESPONSE_STYLES = ["ASSERTIVE", "DEFLECTIVE", "PROTECTIVE", "HONEST"] as const;
export type MediaResponseStyle = (typeof MEDIA_RESPONSE_STYLES)[number];

export const MEDIA_NARRATIVE_CATEGORIES = [
  "Control Freak",
  "Players' Coach",
  "Defensive Mind",
  "Offensive Genius",
  "Hot Seat",
  "Underachiever",
  "Rising Star",
] as const;

export const DUCKETT_STYLE_DRAMA_EXAMPLE: StructuredInterviewQuestion = {
  id: "duckett-discipline",
  category: "RED_FLAG",
  prompt: "Reports mention team-rule violations. What happened?",
  choices: [
    {
      label: "I won games. That's what matters.",
      deltas: { competitiveDrive: 1, ego: 2, mediaSensitivity: 1, volatilityIndex: 1 },
      narrativeTag: "Elite edge, high volatility",
    },
    {
      label: "I made mistakes and learned from them.",
      deltas: { coachability: 2, accountability: 2, disciplineRisk: -2 },
      narrativeTag: "Growth-oriented response",
    },
    {
      label: "That was blown out of proportion.",
      deltas: { accountability: -1, mediaSensitivity: 1, volatilityIndex: 1 },
      narrativeTag: "Media-pressure sensitivity",
    },
    {
      label: "Coach had favorites.",
      deltas: { accountability: -2, ego: 1, disciplineRisk: 2, volatilityIndex: 2 },
      narrativeTag: "Major red-flag accountability profile",
    },
  ],
};
