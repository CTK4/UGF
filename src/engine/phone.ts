import type { GameState, Thread, ThreadMessage } from "@/engine/gameState";

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
