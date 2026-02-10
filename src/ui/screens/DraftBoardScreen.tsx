import React, { useEffect, useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { TeamIcon } from "@/ui/components/TeamIcon";
import { getDraftBoardVM, type DraftProspectVM } from "@/ui/draft/draftViewModel";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveDisplayTraits(prospect: DraftProspectVM): Record<string, number> {
  if (prospect.traits && Object.keys(prospect.traits).length > 0) {
    return prospect.traits;
  }

  const base = clamp(prospect.overall);
  return {
    SPD: clamp(base + 3),
    STR: clamp(base - 2),
    AGI: clamp(base + 1),
    AWR: clamp(base - 1),
    ACC: clamp(base + 2),
    IQ: clamp(base),
  };
}

export function DraftBoardScreen({ ui }: ScreenProps) {
  const vm = getDraftBoardVM(ui.getState());
  const [selectedProspectId, setSelectedProspectId] = useState(vm.selectedProspectId);
  const [pickInRound, setPickInRound] = useState(vm.pickInRound);

  useEffect(() => {
    setSelectedProspectId(vm.selectedProspectId);
    setPickInRound(vm.pickInRound);
  }, [vm.selectedProspectId, vm.pickInRound]);

  useEffect(() => {
    if (import.meta.env.DEV && /(voodoo|gotham)/i.test(vm.teamOnClockName)) {
      console.error("[DraftBoardScreen] Forbidden team display name detected.", { teamOnClockName: vm.teamOnClockName });
    }
  }, [vm.teamOnClockName]);

  const selectedIndex = Math.max(0, vm.prospects.findIndex((prospect) => prospect.id === selectedProspectId));
  const selectedProspect = vm.prospects[selectedIndex] ?? vm.prospects[0];

  const displayTraits = useMemo(() => {
    const entries = Object.entries(deriveDisplayTraits(selectedProspect));
    return entries.slice(0, 8);
  }, [selectedProspect]);

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "0.03em" }}>
              ROUND {vm.round} - PICK {pickInRound}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <TeamIcon teamKey={vm.teamOnClockKey} size={36} />
              <div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>TEAM ON THE CLOCK</div>
                <div style={{ fontWeight: 700 }}>{vm.teamOnClockName}</div>
              </div>
            </div>
          </div>
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "390px minmax(0, 1fr) 360px", gap: 12, minHeight: 480 }}>
          <div className="ugf-card" style={{ minHeight: 0 }}>
            <div className="ugf-card__body" style={{ display: "grid", gap: 8, maxHeight: 520, overflowY: "auto" }}>
              {vm.prospects.map((prospect) => {
                const active = prospect.id === selectedProspect?.id;
                return (
                  <button
                    key={prospect.id}
                    onClick={() => setSelectedProspectId(prospect.id)}
                    style={{
                      textAlign: "left",
                      border: active ? "1px solid #ff9d2f" : "1px solid rgba(255,255,255,0.16)",
                      background: active ? "rgba(255,157,47,0.18)" : "rgba(18,22,32,0.86)",
                      borderRadius: 10,
                      padding: 10,
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{prospect.name}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{prospect.pos} · {prospect.school}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12 }}>
                      <div style={{ fontWeight: 800 }}>OVR {prospect.overall}</div>
                      <div>GRD {prospect.grade ?? prospect.overall}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", alignContent: "start", gap: 12 }}>
            <div className="ugf-card">
              <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 900 }}>{selectedProspect?.name ?? "—"}</div>
                  <div className="ugf-pill">{selectedProspect?.pos ?? "ATH"}</div>
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 14 }}>
                  <div><b>HT</b> {selectedProspect?.height ?? "—"}</div>
                  <div><b>WT</b> {selectedProspect?.weight ?? "—"}</div>
                  <div><b>AGE</b> {selectedProspect?.age ?? "—"}</div>
                </div>
                <div><b>School:</b> {selectedProspect?.school ?? "—"}</div>
                <div style={{ fontSize: 12, opacity: 0.78 }}>Notes: High-upside draft target. UI-only MVP panel.</div>
              </div>
            </div>
          </div>

          <div className="ugf-card">
            <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
              <div style={{ fontWeight: 800, letterSpacing: "0.04em" }}>KEY RATINGS</div>
              {displayTraits.map(([label, value]) => {
                const safeValue = clamp(value);
                return (
                  <div key={label} style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{label}</span>
                      <span>{safeValue}</span>
                    </div>
                    <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                      <div style={{ width: `${safeValue}%`, height: "100%", background: "linear-gradient(90deg, #ef6b2f 0%, #f5a623 100%)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="primary"
            onClick={() => ui.dispatch({ type: "OPEN_MODAL", title: "Draft", message: "Draft UI only (MVP)" })}
          >
            DRAFT PLAYER
          </button>
          <button
            onClick={() => {
              const nextIndex = (selectedIndex + 1) % vm.prospects.length;
              setSelectedProspectId(vm.prospects[nextIndex]?.id ?? selectedProspectId);
              setPickInRound((prev) => prev + 1);
            }}
          >
            SIM PICK
          </button>
          <button disabled title="Coming soon">TRADE (Coming soon)</button>
        </div>
      </div>
    </div>
  );
}
