import type { ScreenProps } from "@/ui/types";
import { MobileTopBar, PrimaryActionButton, SecondaryActionButton, SectionCard } from "@/ui/mobile/components";

export function MobilePhoneThreadScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const save = state.save;
  if (!save || state.route.key !== "PhoneThread") return null;

  const thread = save.gameState.inbox.find((entry) => entry.id === state.route.threadId);
  if (!thread) return null;

  return (
    <div className="mobile-ui" style={{ display: "grid", gap: 12, maxWidth: 430, margin: "0 auto", padding: 12 }}>
      <MobileTopBar title={thread.title} rightActions={thread.unreadCount > 0 ? <span className="ugf-pill">{thread.unreadCount} unread</span> : undefined} />

      <SectionCard title="Conversation">
        <div style={{ display: "grid", gap: 8 }}>
          {thread.messages.map((message) => (
            <div
              key={message.id}
              style={{ border: "1px solid rgba(120, 150, 190, 0.24)", borderRadius: 10, padding: "8px 10px", background: "rgba(18, 28, 40, 0.6)" }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{message.from}</div>
              <div>{message.text}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Actions">
        <div style={{ display: "grid", gap: 8 }}>
          <SecondaryActionButton label="Back to Inbox" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })} />
          {thread.unreadCount > 0 ? (
            <PrimaryActionButton label="Mark Read" onClick={() => ui.dispatch({ type: "OPEN_PHONE_THREAD", threadId: thread.id })} />
          ) : null}
        </div>
      </SectionCard>
    </div>
  );
}
