import React from "react";
import type { ScreenProps } from "@/ui/types";

export function DelegationSetupScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  if (!save) return null;
  const delegation = save.gameState.delegation;

  const row = <T extends string>(label: string, keyName: "offenseControl" | "defenseControl" | "gameManagement" | "gmAuthority", options: T[]) => (
    <div style={{ display: "grid", gap: 6 }}>
      <b>{label}</b>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((value) => (
          <button
            key={`${keyName}-${value}`}
            type="button"
            onClick={() => ui.dispatch({ type: "SET_DELEGATION_OPTION", key: keyName, value })}
            className="ugf-pill"
            style={{
              borderColor: delegation[keyName] === value ? "#ffbf47" : undefined,
              boxShadow: delegation[keyName] === value ? "0 0 0 1px rgba(255,191,71,0.6)" : undefined,
            }}
          >
            {delegation[keyName] === value ? "✓ " : ""}
            {value}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Delegation Setup</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        {row("Offense control", "offenseControl", ["USER", "OC"])}
        {row("Defense control", "defenseControl", ["USER", "DC"])}
        {row("Game management", "gameManagement", ["USER", "SHARED"])}
        {row("GM authority", "gmAuthority", ["FULL", "GM_ONLY"])}
        <button type="button" onClick={() => ui.dispatch({ type: "CONFIRM_DELEGATION_SETUP" })}>Continue to Hub</button>
      </div>
    </div>
  );
}
