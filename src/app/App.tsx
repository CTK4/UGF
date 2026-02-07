import React, { useEffect, useState } from "react";
import { RouteMap, type RouteKey } from "@/ui/routes";
import { createUIRuntime } from "@/ui/runtime";
import type { UIController } from "@/ui/types";
import logoUrl from "@/assets/brand/ugf-head-coach-logo.png";

export function App() {
  const [, setTick] = useState(0);
  const [ui, setUi] = useState<UIController | null>(null);

  useEffect(() => {
    void createUIRuntime(() => setTick((t) => t + 1)).then(setUi);
  }, []);

  if (!ui) return <div className="app"><div className="card">Booting...</div></div>;

  const route = ui.getState().route;
  const key = route.key as RouteKey;
  const Screen = RouteMap[key];

  if (!Screen) {
    return <div className="app"><div className="card"><h2>Unknown route key</h2><pre>{JSON.stringify(route, null, 2)}</pre></div></div>;
  }

  return (
    <div className="app">
      <header className="ugf-topbar">
        <div className="ugf-brand">
  <img className="ugf-brand__logo" src={logoUrl} alt="UGF Head Coach" />
  <div className="ugf-brand__title">
    <h1>UGF Head Coach</h1>
    <div>Coach RPG</div>
  </div>
</div>
<div className="ugf-pill">Route: {route.key}</div>

      </header>
      <Screen ui={ui} />
    </div>
  );
}
