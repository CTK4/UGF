import React, { useEffect, useState } from "react";
import { RouteMap, type RouteKey } from "@/ui/routes";
import { createUIRuntime } from "@/ui/runtime";
import type { UIController } from "@/ui/types";
import logoUrl from "@/assets/brand/ugf-head-coach-logo.png";
import { NoSaveRouteGuard } from "@/ui/components/NoSaveRouteGuard";
import { MobileHubScreen } from "@/ui/screens/MobileHubScreen";
import { isMobileUI } from "@/ui/mobile/isMobileUI";

export function App() {
  const [, setTick] = useState(0);
  const [ui, setUi] = useState<UIController | null>(null);
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 520 : false));
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    void createUIRuntime(() => setTick((t) => t + 1)).then(setUi);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsNarrowViewport(window.innerWidth < 520);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!navOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest?.("[data-ugf-navmenu-root='true']")) return;
      setNavOpen(false);
    };
    window.addEventListener("mousedown", onDown, { capture: true });
    window.addEventListener("touchstart", onDown, { capture: true });
    return () => {
      window.removeEventListener("mousedown", onDown, { capture: true } as any);
      window.removeEventListener("touchstart", onDown, { capture: true } as any);
    };
  }, [navOpen]);

  if (!ui) return <div className="app"><div className="card">Booting...</div></div>;

  const state = ui.getState();
  const useMobileHub = state.route.key === "Hub" && (isMobileUI() || isNarrowViewport);

  let Screen = RouteMap[state.route.key as RouteKey];
  if (useMobileHub) {
    Screen = MobileHubScreen;
  }
  const noSave = !state.save;
  const saveRequiredRoutes = new Set<RouteKey>(["Hub", "Roster", "StaffTree", "PhoneInbox", "PhoneThread", "FreeAgency"]);
  const routeNeedsSave = saveRequiredRoutes.has(state.route.key as RouteKey);

  return (
    <div className="app">
      <header className="ugf-topbar">
        <div className="ugf-brand">
          <img className="ugf-brand__logo" src={logoUrl} alt="UGF Head Coach" />
          <div className="ugf-brand__title"><h1>UGF Head Coach</h1><div>Coach RPG</div></div>
        </div>
        {isNarrowViewport ? (
          <div style={{ position: "relative" }} data-ugf-navmenu-root="true">
            <button onClick={() => setNavOpen((v) => !v)}>Menu</button>
            {navOpen ? (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  zIndex: 50,
                  display: "grid",
                  gap: 6,
                  padding: 10,
                  borderRadius: 12,
                  background: "rgba(10, 14, 22, 0.95)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  minWidth: 220,
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } }); }}>Start</button>
                  <button disabled={noSave} onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } }); }}>Hub</button>
                  <button disabled={noSave} onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } }); }}>Roster</button>
                  <button disabled={noSave} onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "FreeAgency" } }); }}>Free Agency</button>
                  <button disabled={noSave} onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } }); }}>Staff</button>
                  <button disabled={noSave} onClick={() => { setNavOpen(false); ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } }); }}>Phone</button>
                  <button className="danger" onClick={() => { setNavOpen(false); ui.dispatch({ type: "RESET_SAVE" }); }}>Reset Save</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Start" } })}>Start</button>
            <button disabled={noSave} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Hub</button>
            <button disabled={noSave} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Roster" } })}>Roster</button>
            <button disabled={noSave} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "FreeAgency" } })}>Free Agency</button>
            <button disabled={noSave} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "StaffTree" } })}>Staff</button>
            <button disabled={noSave} onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "PhoneInbox" } })}>Phone</button>
            <button className="danger" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset Save</button>
          </div>
        )}
        <div className="ugf-pill">Route: {ui.selectors.routeLabel()}</div>
      </header>

      {state.ui.notifications.at(0) ? <div className="ugf-card" style={{ marginBottom: 12 }}><div className="ugf-card__body">{state.ui.notifications.at(0)}</div></div> : null}

      {noSave && routeNeedsSave ? <NoSaveRouteGuard ui={ui} title={state.route.key} /> : <Screen ui={ui} />}

      {state.ui.activeModal ? (
        <div className="modalBackdrop">
          <div className="modal">
            <h3 className="modalTitle">{state.ui.activeModal.title}</h3>
            <div style={{ marginBottom: 12 }}>{state.ui.activeModal.message}</div>
            {state.ui.activeModal.lines?.length ? <div style={{ marginBottom: 12 }}>{state.ui.activeModal.lines.map((line) => <div key={line}>{line}</div>)}</div> : null}
            {state.ui.activeModal.warning ? (
              <div style={{ background: "rgba(255,170,0,0.10)", border: "1px solid rgba(255,170,0,0.35)", padding: "8px 10px", borderRadius: 8, fontWeight: 600, marginBottom: 12 }}>
                {state.ui.activeModal.warning}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(state.ui.activeModal.actions ?? [{ label: "Close", action: { type: "CLOSE_MODAL" } }]).map((a, i) => (
                <button key={i} className={i === 0 ? "primary" : undefined} onClick={() => ui.dispatch(a.action)}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
