import type { GameState, Thread, ThreadMessage } from "@/engine/gameState";

export type PhoneEvent = {
  type: "COORDINATOR_LOCK_HIRED";
  role: "OC" | "DC" | "STC";
  name: string;
};

export function generateImmediateMessagesFromEvent(_state: GameState, event: PhoneEvent): Array<{ threadId: "owner" | "gm"; from: string; text: string }> {
  if (event.type !== "COORDINATOR_LOCK_HIRED") return [];
  return [
    { threadId: "owner", from: "Owner", text: `${event.name} was approved. Make the hire count.` },
    { threadId: "gm", from: "GM", text: `Logged ${event.role} hire for ${event.name}.` },
  ];
}

export function appendWeeklyMessages(state: GameState): Thread[] {
  const inbox = state.inbox.map((thread) => ({ ...thread, messages: [...thread.messages] }));
  const messages = [{ threadId: "gm" as const, from: "GM", text: `Week ${state.time.week} complete.` }];

  for (const item of messages) {
    let thread = inbox.find((entry) => entry.id === item.threadId);
    if (!thread) {
      thread = { id: item.threadId, title: item.threadId === "owner" ? "Owner" : "GM", unreadCount: 0, messages: [] };
      inbox.push(thread);
    }
    const message: ThreadMessage = {
      id: `${item.threadId}-${state.time.season}-${state.time.week}-${thread.messages.length + 1}`,
      from: item.from,
      text: item.text,
      ts: new Date().toISOString(),
    };
    thread.messages.push(message);
    thread.unreadCount += 1;
  }

  return inbox;
}
