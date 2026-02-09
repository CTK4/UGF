import React, { useMemo, useState } from "react";
import personnelData from "@/data/generated/personnel.json";
import rosterData from "@/data/generated/rosters.json";
import type { ScreenProps } from "@/ui/types";
import { HOMETOWNS } from "@/data/hometowns";
import { FRANCHISES, getFranchise } from "@/ui/data/franchises";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { TeamLogo } from "@/ui/components/TeamLogo";

type PersonnelRow = { DisplayName: string; Position: string; Scheme?: string };
const personnel = personnelData as PersonnelRow[];
type RosterRow = {
  Team: string;
  PositionGroup: string;
  PlayerName: string;
  Rating: number;
  Age?: number;
  Expiring?: boolean;
  ContractStatus?: string;
  ContractYearsLeft?: number;
};
const roster = rosterData as RosterRow[];
const backgrounds = ["Former QB", "Defensive Architect", "Special Teams Ace", "CEO Program Builder"];
const offseasonPriorities = [
  "Retain core veterans",
  "Add pass rush",
  "Upgrade offensive line",
  "Find QB succession plan",
  "Bolster secondary depth",
  "Create cap flexibility",
  "Get younger at key spots",
];

function toTeamKey(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function rolePool(position: "OC" | "DC" | "ST Coordinator") {
  return personnel.filter((p) => p.Position === position).slice(0, 6);
}

export function StartScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const hasSave = !!state.save;

  return (
    <div className="ugf-card" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12, textAlign: "center", maxWidth: 640 }}>
        <h2 className="ugf-card__title" style={{ fontSize: 24 }}>Start Your Career</h2>
        {hasSave ? <div className="ugf-pill">Resume available: Week {state.save.gameState.time.beatIndex} • {state.save.gameState.phase}</div> : null}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {hasSave ? <button onClick={() => ui.dispatch({ type: "LOAD_GAME" })}>Resume Career</button> : null}
          <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "ChooseFranchise" } })}>Start New Career</button>
          <button className="danger" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset</button>
        </div>
      </div>
    </div>
  );
}

export function ChooseFranchiseScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const listLogoSize = 52;
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Choose Franchise</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {FRANCHISES.map((f) => {
          const teamKey = normalizeExcelTeamKey(f.fullName);
          return (
            <button
              key={f.id}
              onClick={() => ui.dispatch({ type: "SET_DRAFT_FRANCHISE", franchiseId: f.id })}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <span style={{ display: "inline-flex", width: listLogoSize + 12, minWidth: listLogoSize + 12, justifyContent: "center", alignItems: "center", flex: `0 0 ${listLogoSize + 12}px` }}>
                <TeamLogo teamKey={teamKey} variant="list" size={listLogoSize} />
              </span>
              <span>{f.fullName}</span>
            </button>
          );
        })}
        <button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CareerContext" } })} disabled={!state.draftFranchiseId}>Confirm Franchise</button>
      </div>
    </div>
  );
}

export function CareerContextScreen({ ui }: ScreenProps) {
  const selected = getFranchise(ui.getState().draftFranchiseId ?? "");
  if (!selected) return null;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}><div>Interviewing for <b>{selected.fullName}</b>.</div><button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Continue</button></div></div>;
}

export function CreateCoachScreen({ ui }: ScreenProps) {
  const opening = ui.getState().ui.opening;
  const statesInOrder = [...new Set(HOMETOWNS.map((hometown) => hometown.state))];

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        <input
          value={opening.coachName}
          placeholder="Coach name"
          onChange={(e) => ui.dispatch({ type: "SET_COACH_NAME", coachName: e.target.value })}
        />
        <select value={opening.hometownId} onChange={(e) => ui.dispatch({ type: "SET_HOMETOWN", hometownId: e.target.value })}>
          <option value="">Select hometown…</option>
          {statesInOrder.map((state) => (
            <optgroup key={state} label={state}>
              {HOMETOWNS.filter((h) => h.state === state).map((h) => (
                <option key={h.id} value={h.id}>{h.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CoachBackground" } })}
          disabled={!opening.coachName.trim() || !opening.hometownId}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function CoachBackgroundScreen({ ui }: ScreenProps) {
  const selected = ui.getState().ui.opening.background;
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>{backgrounds.map((b) => <button key={b} onClick={() => ui.dispatch({ type: "SET_BACKGROUND", background: b })}>{selected === b ? "✓ " : ""}{b}</button>)}<button onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Next</button></div></div>;
}

export function InterviewsScreen({ ui }: ScreenProps) {
  return <div className="ugf-card"><div className="ugf-card__body"><button onClick={() => ui.dispatch({ type: "RUN_INTERVIEWS" })}>Run Interviews</button></div></div>;
}

export function OffersScreen({ ui }: ScreenProps) {
  const offers = ui.getState().ui.opening.offers;
  const tierLabelByCode = {
    REBUILD: "Rebuild (Bottom-5)",
    FRINGE: "Fringe (Middle)",
    CONTENDER: "Contender (Top-10)",
  } as const;

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {offers.map((offer) => (
          <button key={offer.franchiseId} onClick={() => ui.dispatch({ type: "ACCEPT_OFFER", franchiseId: offer.franchiseId })}>
            <div><b>{getFranchise(offer.franchiseId)?.fullName ?? offer.franchiseId}</b></div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[offer.tier]}</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>{offer.summaryLine}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HireCoordinatorsScreen({ ui }: ScreenProps) {
  const picks = ui.getState().ui.opening.coordinatorChoices;
  const roles: Array<["OC" | "DC" | "STC", "OC" | "DC" | "ST Coordinator"]> = [["OC", "OC"], ["DC", "DC"], ["STC", "ST Coordinator"]];

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {roles.map(([role, pos]) => (
          <div key={role}>
            <b>{role}</b>
            {rolePool(pos).map((c) => <button key={c.DisplayName} onClick={() => ui.dispatch({ type: "SET_COORDINATOR_CHOICE", role, candidateName: c.DisplayName })}>{picks[role] === c.DisplayName ? "✓ " : ""}{c.DisplayName}</button>)}
          </div>
        ))}
        <button disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize and Enter Hub</button>
      </div>
    </div>
  );
}

export function StaffMeetingScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const gameState = state.save?.gameState;
  const franchise = getFranchise(gameState?.franchise.ugfTeamKey ?? "");

  const teamRoster = useMemo(() => {
    if (!gameState) return [];
    const teamKeys = new Set([
      toTeamKey(gameState.franchise.excelTeamKey || ""),
      toTeamKey(franchise?.fullName || ""),
      toTeamKey(gameState.franchise.ugfTeamKey || ""),
    ]);
    return roster.filter((row) => teamKeys.has(toTeamKey(row.Team)));
  }, [gameState, franchise?.fullName]);

  const strengthAndHole = useMemo(() => {
    const byGroup = new Map<string, { total: number; count: number }>();
    teamRoster.forEach((player) => {
      const current = byGroup.get(player.PositionGroup) ?? { total: 0, count: 0 };
      byGroup.set(player.PositionGroup, { total: current.total + Number(player.Rating ?? 0), count: current.count + 1 });
    });
    const ranked = [...byGroup.entries()]
      .map(([group, value]) => ({ group, avg: value.total / Math.max(1, value.count) }))
      .sort((a, b) => b.avg - a.avg);
    return {
      strengths: ranked.slice(0, 2),
      holes: [...ranked].reverse().slice(0, 2),
    };
  }, [teamRoster]);

  const expiringPlayers = useMemo(() => {
    const expires = teamRoster.filter((p) => p.Expiring === true || p.ContractYearsLeft === 0 || String(p.ContractStatus ?? "").toLowerCase().includes("expiring"));
    return (expires.length > 0 ? expires : teamRoster).map((p) => p.PlayerName);
  }, [teamRoster]);

  const [priorities, setPriorities] = useState<string[]>(gameState?.offseasonPlan?.priorities ?? []);
  const [resignTargets, setResignTargets] = useState<string[]>(gameState?.offseasonPlan?.resignTargets ?? []);
  const [shopTargets, setShopTargets] = useState<string[]>(gameState?.offseasonPlan?.shopTargets ?? []);
  const [tradeNotes, setTradeNotes] = useState(gameState?.offseasonPlan?.tradeNotes ?? "");

  const toggleValue = (selected: string[], value: string, max: number, set: (values: string[]) => void) => {
    if (selected.includes(value)) {
      set(selected.filter((item) => item !== value));
      return;
    }
    if (selected.length >= max) return;
    set([...selected, value]);
  };

  const canSubmit = resignTargets.length >= 1 && resignTargets.length <= 3 && shopTargets.length <= 3;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Meeting</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div>
          <b>Top Strengths</b>
          {strengthAndHole.strengths.map((item) => <div key={`s-${item.group}`}>{item.group}: {item.avg.toFixed(1)}</div>)}
        </div>
        <div>
          <b>Top Holes</b>
          {strengthAndHole.holes.map((item) => <div key={`h-${item.group}`}>{item.group}: {item.avg.toFixed(1)}</div>)}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <b>Priorities</b>
          {offseasonPriorities.map((priority) => (
            <label key={priority} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={priorities.includes(priority)} onChange={() => toggleValue(priorities, priority, offseasonPriorities.length, setPriorities)} />
              <span>{priority}</span>
            </label>
          ))}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <b>Re-sign Targets (1-3)</b>
          {expiringPlayers.slice(0, 24).map((name) => (
            <label key={name} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={resignTargets.includes(name)} onChange={() => toggleValue(resignTargets, name, 3, setResignTargets)} />
              <span>{name}</span>
            </label>
          ))}
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <b>Shop Targets (0-3)</b>
          {teamRoster.slice(0, 24).map((player) => (
            <label key={`shop-${player.PlayerName}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={shopTargets.includes(player.PlayerName)} onChange={() => toggleValue(shopTargets, player.PlayerName, 3, setShopTargets)} />
              <span>{player.PlayerName}</span>
            </label>
          ))}
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <b>Trade Notes</b>
          <textarea value={tradeNotes} onChange={(e) => setTradeNotes(e.target.value)} rows={4} />
        </label>

        <button
          disabled={!canSubmit}
          onClick={() => ui.dispatch({ type: "SUBMIT_STAFF_MEETING", payload: { priorities, resignTargets, shopTargets, tradeNotes } })}
        >
          Submit Plan
        </button>
      </div>
    </div>
  );
}
