import type { ScreenProps } from "@/ui/types";
import { ListRow, MobileTopBar, SectionCard } from "@/ui/mobile/components";

export function MobilePhoneInboxScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;

  const threads = save.gameState.inbox;

  return (
    <div className="mobile-ui" style={{ display: "grid", gap: 12, maxWidth: 430, margin: "0 auto", padding: 12 }}>
      <MobileTopBar title="Phone Inbox" rightActions={<span className="ugf-pill">{threads.length} threads</span>} />

      <SectionCard title="Messages">
        {threads.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No conversations yet.</div>
        ) : (
          threads.map((thread) => (
            <ListRow
              key={thread.id}
              icon={thread.unreadCount > 0 ? "📩" : "💬"}
              title={thread.title}
              subtitle={thread.messages.at(-1)?.text ?? "No messages"}
              rightAdornment={thread.unreadCount > 0 ? <span className="ugf-pill">{thread.unreadCount}</span> : "›"}
              onClick={() => ui.dispatch({ type: "OPEN_PHONE_THREAD", threadId: thread.id })}
            />
          ))
        )}
      </SectionCard>
    </div>
  );
}
