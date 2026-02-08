import { MANDATORY_STAFF_ROLES, type StaffRole } from "@/domain/staffRoles";
import type { GameState, GameTask, InboxMessage } from "@/engine/gameState";
import { normalizeAssignments } from "@/engine/gameState";

export type GameAction =
  | { type: "START_NEW_SAVE"; payload: { gameState: GameState } }
  | { type: "SET_COACH_PROFILE"; payload: { name: string } }
  | { type: "SET_BACKGROUND"; payload: { background: string } }
  | { type: "SET_INTERVIEW_ANSWER"; payload: { answer: string } }
  | { type: "FINALIZE_OFFERS"; payload: { offers: string[] } }
  | { type: "ACCEPT_OFFER"; payload: { offerId: string } }
  | { type: "HIRE_COACH"; payload: { role: StaffRole; candidateId: string; coachName: string; salary: number; years: number } }
  | { type: "COMPLETE_TASK"; payload: { taskId: string } }
  | { type: "ADVANCE_WEEK"; payload: { nowIso: string } };

export function reduceGameState(prev: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_NEW_SAVE":
      return action.payload.gameState;
    case "SET_COACH_PROFILE":
      return { ...prev, coachProfile: { ...prev.coachProfile, name: action.payload.name } };
    case "SET_BACKGROUND":
      return { ...prev, coachProfile: { ...prev.coachProfile, background: action.payload.background } };
    case "SET_INTERVIEW_ANSWER":
      return { ...prev, interviewAnswers: [...prev.interviewAnswers, action.payload.answer] };
    case "FINALIZE_OFFERS":
      return { ...prev, offers: action.payload.offers };
    case "ACCEPT_OFFER":
      return { ...prev, acceptedOffer: action.payload.offerId };
    case "HIRE_COACH": {
      const { role, candidateId, coachName, salary, years } = action.payload;
      return {
        ...prev,
        staffAssignments: normalizeAssignments({
          ...prev.staffAssignments,
          [role]: { candidateId, coachName, salary, years },
        }),
      };
    }
    case "COMPLETE_TASK":
      return { ...prev, tasks: prev.tasks.map((task) => task.id === action.payload.taskId ? { ...task, completed: true } : task) };
    case "ADVANCE_WEEK": {
      const missing = MANDATORY_STAFF_ROLES.filter((role) => !prev.staffAssignments[role]);
      if (missing.length) throw new Error(`Advance blocked. Missing required staff: ${missing.join(", ")}`);

      const staffMeetingDone = prev.checkpoints.some((checkpoint) => checkpoint.code === "staff-meeting-complete");
      if (!staffMeetingDone) throw new Error("Advance blocked. Complete the staff meeting first.");

      const nextWeek = prev.time.week + 1;
      const tasks = buildWeekTasks(prev, nextWeek);
      const inboxAdds = buildWeekInbox(prev, nextWeek, action.payload.nowIso);

      return {
        ...prev,
        time: { ...prev.time, week: nextWeek, phaseVersion: prev.time.phaseVersion + 1, phase: nextWeek >= 2 ? "RegularSeason" : prev.time.phase },
        tasks,
        inbox: [...prev.inbox, ...inboxAdds],
        weeklyRecap: {
          week: nextWeek,
          tasksCreated: tasks.map((task) => task.title),
          messagesAdded: inboxAdds.map((msg) => `${msg.from}: ${msg.subject}`),
          rosterChanges: ["No major roster moves this week."],
        },
      };
    }
    default:
      return prev;
  }
}

function buildWeekTasks(prev: GameState, week: number): GameTask[] {
  const players = Object.values(prev.rosterSnapshot);
  const lowRated = players.filter((p) => p.rating < 70).length;
  const aging = players.filter((p) => p.age >= 31).length;
  const phaseLower = prev.time.phase.toLowerCase();

  const candidates: Array<Omit<GameTask, "id" | "createdForWeek" | "completed">> = [
    { title: "Prepare weekly game plan", detail: `Install ${phaseLower.includes("regular") ? "opponent-specific" : "base"} packages before kickoff.`, category: "strategy" },
    { title: "Meet with coordinators", detail: "Sync OC/DC/STC priorities and role expectations.", category: "staff" },
    { title: "Review roster bubble", detail: "Identify depth concerns and emergency signings.", category: "roster" },
    { title: "Owner check-in", detail: "Send concise status update to ownership.", category: "owner" },
    { title: "Evaluate veteran workload", detail: "Tune reps for aging veterans to reduce injury risk.", category: "roster" },
  ];

  const selected = [candidates[0], candidates[1], candidates[2]];
  if (lowRated >= 8) selected.push({ title: "Address weak position groups", detail: "Focus drills on low-rating units.", category: "roster" });
  if (aging >= 10) selected.push(candidates[4]);
  if (selected.length < 4) selected.push(candidates[3]);

  return selected.slice(0, 5).map((task, index) => ({
    ...task,
    id: `task-${week}-${index + 1}`,
    createdForWeek: week,
    completed: false,
  }));
}

function buildWeekInbox(prev: GameState, week: number, nowIso: string): InboxMessage[] {
  const completedRatio = prev.tasks.length ? prev.tasks.filter((task) => task.completed).length / prev.tasks.length : 0;
  const pressure = Math.min(100, Math.round((1 - completedRatio) * 50 + Object.values(prev.rosterSnapshot).filter((p) => p.rating < 68).length));
  const trust = Math.max(0, Math.min(100, Math.round(50 + completedRatio * 40 - pressure * 0.2)));

  const ownerTone = trust >= 55 ? "Steady progress so far. Keep communication tight." : "Concern is rising. We need visible results this week.";
  const gmTone = pressure >= 45 ? "Depth alarms are up—prioritize vulnerable position groups." : "Good control this week. Keep refining the plan.";

  const messages: InboxMessage[] = [
    { id: `owner-${week}`, from: "Owner", subject: `Week ${week} pressure report`, body: `${ownerTone} Trust ${trust}/100, pressure ${pressure}/100.`, week, ts: nowIso },
    { id: `gm-${week}`, from: "GM", subject: `Week ${week} roster pulse`, body: gmTone, week, ts: nowIso },
  ];

  return messages.slice(0, trust < 40 ? 2 : 1 + (pressure > 30 ? 1 : 0));
}
