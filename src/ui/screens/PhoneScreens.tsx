import React from "react";
import type { ScreenProps } from "@/ui/types";

export function PhoneInboxScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Phone Inbox</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {save.gameState.inbox.map((t) => (
          <button key={t.id} style={{ textAlign: "left" }} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneThread", threadId: t.id } })}>
            <div><strong>{t.title}</strong></div>
            <div style={{ opacity: 0.8 }}>Unread: {t.unreadCount} • {t.messages.at(-1)?.text ?? "No messages"}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PhoneThreadScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "PhoneThread") return null;
  const thread = save.gameState.inbox.find((t) => t.id === state.route.threadId);
  if (!thread) return null;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">{thread.title}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {thread.messages.map((m) => <div key={m.id}><b>{m.from}:</b> {m.text}</div>)}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Back</button>
      </div>
    </div>
  );
}
