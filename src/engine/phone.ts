import { getOwnerProfileByTeamKey, type OwnerArchetype } from "@/data/ownerProfiles";
import type { ControlAxis, GameState, Thread, ThreadMessage } from "@/engine/gameState";

export type PhoneEvent = {
  type: "COORDINATOR_LOCK_HIRED";
  side: "offense" | "defense" | "specialTeams";
  role: "OC" | "DC" | "STC";
  name: string;
  axes: ControlAxis[];
};

const axisLabel = (axes: ControlAxis[]) => {
  const hasScheme = axes.includes("SCHEME");
  const hasAssistants = axes.includes("ASSISTANTS");
  if (hasScheme && hasAssistants) return "Scheme + Assistants";
  if (hasScheme) return "Scheme";
  if (hasAssistants) return "Assistants";
  return "Scheme";
};

function ownerLockMessage(archetype: OwnerArchetype | undefined, axesText: string, name: string): string {
  if (!archetype) return `Noted. Control is locked (${axesText}). Make it work.`;
  if (["impatient", "demanding", "dominant"].includes(archetype)) return `I approved the hire. Control is locked (${axesText}). Results, fast.`;
  if (["patient", "institutional", "measured"].includes(archetype)) return `Understood. Control is locked (${axesText}) with ${name}. Stay aligned.`;
  if (["volatile", "image_focused"].includes(archetype)) return `Be careful. Control is locked (${axesText}). Don't let it get messy.`;
  if (["analytical", "process_oriented", "pragmatic"].includes(archetype)) return `Logged. Control lock (${axesText}) increases coordination risk. Mitigate it.`;
  if (["ambitious", "opportunistic"].includes(archetype)) return `Fine. If it gives us an edge, do it. Control is locked (${axesText}).`;
  return `Noted. Control is locked (${axesText}). Make it work.`;
}

export function generateImmediateMessagesFromEvent(state: GameState, event: PhoneEvent): Array<{ threadId: "owner" | "gm"; from: string; text: string }> {
  if (event.type !== "COORDINATOR_LOCK_HIRED") return [];
  const axesText = axisLabel(event.axes);
  const profile = getOwnerProfileByTeamKey(state.franchise.ugfTeamKey);

  return [
    { threadId: "owner", from: profile?.ownerName ?? "Owner", text: ownerLockMessage(profile?.archetype, axesText, event.name) },
    { threadId: "gm", from: "GM", text: `FYI: ${event.name} requires locked control (${axesText}). I'll route staffing + installs accordingly.` },
  ];
}

export function generateWeeklyMessages(state: GameState): Array<{ threadId: "owner" | "gm"; from: string; text: string }> {
  const messages: Array<{ threadId: "owner" | "gm"; from: string; text: string }> = [];
  const missingRoles = ["OC", "DC", "STC"].filter((role) => !state.staff.assignments[role as "OC" | "DC" | "STC"]);

  if (missingRoles.length > 0) {
    messages.push({ threadId: "owner", from: "Owner", text: `We still need ${missingRoles.join(", ")} in place. Fix this before camp prep.` });
  }

  if (state.staff.blockedHireAttemptsRecent > 0) {
    messages.push({ threadId: "owner", from: "Owner", text: "I saw staff hires bounce off budget limits. Stop forcing expensive moves." });
  }

  const openTasks = state.tasks.filter((task) => task.status === "OPEN").length;
  if (openTasks > 0) {
    messages.push({ threadId: "gm", from: "GM", text: `${openTasks} task(s) are still open after this beat. Let's close them next week.` });
  }

  if (messages.length === 0) {
    messages.push({ threadId: "owner", from: "Owner", text: "Clean week. Keep this pace and we are on track." });
    messages.push({ threadId: "gm", from: "GM", text: "Smooth advance. Board and staff cadence look solid." });
  }

  return messages;
}

function upsertThread(inbox: Thread[], id: "owner" | "gm", title: string): Thread {
  const existing = inbox.find((thread) => thread.id === id);
  if (existing) return existing;
  const created: Thread = { id, title, unreadCount: 0, messages: [] };
  inbox.push(created);
  return created;
}

export function appendWeeklyMessages(state: GameState): Thread[] {
  const inbox = state.inbox.map((thread) => ({ ...thread, messages: [...thread.messages] }));
  const messages = generateWeeklyMessages(state);

  for (const item of messages) {
    const thread = upsertThread(inbox, item.threadId, item.threadId === "owner" ? "Owner" : "GM");
    const message: ThreadMessage = {
      id: `${item.threadId}-${state.time.season}-${state.time.beatIndex}-${thread.messages.length + 1}`,
      from: item.from,
      text: item.text,
      ts: new Date().toISOString(),
    };
    thread.messages.push(message);
    thread.unreadCount += 1;
  }

  return inbox;
}
