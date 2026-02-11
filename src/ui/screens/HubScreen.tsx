import type { ScreenProps } from "@/ui/types";

export function HubScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return <div className="ugf-card"><div className="ugf-card__body">No save loaded.</div></div>;

  const gs = save.gameState;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Hub</h2>
        <div className="ugf-pill">{gs.time.label}</div>
      </div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Staff</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } })}>Roster</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "FreeAgency" } })}>Free Agency</button>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Phone</button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {gs.phase === "DRAFT" ? (
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Draft" } })}>Go to Draft</button>
          ) : null}
          {gs.phase === "REGULAR_SEASON" || gs.phase === "POSTGAME" ? (
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Schedule" } })}>Schedule</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
