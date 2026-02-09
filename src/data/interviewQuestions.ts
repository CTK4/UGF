export type OpeningInterviewChoice = {
  label: string;
  text: string;
  owner: number;
  gm: number;
  pressure: number;
  tone: string;
};

export type OpeningInterviewQuestion = {
  label: string;
  prompt: string;
  choices: OpeningInterviewChoice[];
};

export const OPENING_INTERVIEW_QUESTIONS: OpeningInterviewQuestion[] = [
  {
    label: "Owner",
    prompt: "How would you establish accountability in year one?",
    choices: [
      { label: "A", text: "Set measurable standards and review them every week.", owner: 6, gm: 2, pressure: 1, tone: "Confident and structured." },
      { label: "B", text: "Empower leaders in the locker room first, then set standards.", owner: 3, gm: 4, pressure: 0, tone: "Collaborative and steady." },
      { label: "C", text: "Keep things loose early and adjust once we see results.", owner: -2, gm: -1, pressure: -2, tone: "Too passive for ownership." },
    ],
  },
  {
    label: "GM",
    prompt: "How do you partner with the front office on roster decisions?",
    choices: [
      { label: "A", text: "Align on a profile and let data drive final tie-breakers.", owner: 2, gm: 6, pressure: 1, tone: "Process-oriented and aligned." },
      { label: "B", text: "I make scheme asks and trust scouting to execute.", owner: 1, gm: 3, pressure: 0, tone: "Reasonable but less collaborative." },
      { label: "C", text: "I want final say on all roster moves.", owner: -2, gm: -4, pressure: -1, tone: "Power struggle concern." },
    ],
  },
  {
    label: "Pressure",
    prompt: "How do you handle media pressure after a losing streak?",
    choices: [
      { label: "A", text: "Own the results publicly and protect the locker room.", owner: 3, gm: 2, pressure: 5, tone: "Strong leadership under pressure." },
      { label: "B", text: "Stay even-keeled and focus only on internal messaging.", owner: 1, gm: 1, pressure: 2, tone: "Stable, if somewhat reserved." },
      { label: "C", text: "Call out execution issues directly to force urgency.", owner: -2, gm: -1, pressure: -4, tone: "Risky tone for a volatile market." },
    ],
  },
];
