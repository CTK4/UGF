import React, { useEffect, useMemo, useState } from "react";
import personnelData from "@/data/generated/personnel.json";
import rosterData from "@/data/generated/rosters.json";
import type { ScreenProps } from "@/ui/types";
import { HOMETOWNS } from "@/data/hometowns";
import { getFranchise } from "@/ui/data/franchises";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { TeamIcon } from "@/ui/components/TeamIcon";
import { INTERVIEW_QUESTION_BANK } from "@/data/interviewBank";
import { INTERVIEW_SCRIPTS } from "@/data/interviewScripts";

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

const tierLabelByCode = {
  REBUILD: "Rebuild (Bottom-5)",
  FRINGE: "Fringe (Middle)",
  CONTENDER: "Contender (Top-10)",
} as const;

function toTeamKey(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function rolePool(position: "OC" | "DC" | "ST Coordinator") {
  return personnel.filter((p) => p.Position === position).slice(0, 6);
}

function devGuardForbiddenTeamName(teamName: string) {
  if (import.meta.env.DEV && (teamName.includes("Voodoo") || teamName.includes("Gotham"))) {
    console.error(`Forbidden team naming detected in UI: ${teamName}`);
  }
}

export function StartScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  const hasSave = !!state.save;

  return (
    <div className="ugf-card" style={{ minHeight: "70vh", display: "grid", placeItems: "center" }}>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12, textAlign: "center", maxWidth: 640 }}>
        <h2 className="ugf-card__title" style={{ fontSize: 24 }}>Start Your Career</h2>
        {hasSave ? <div className="ugf-pill">Resume available: Week {state.save.gameState.time.week} • {state.save.gameState.phase}</div> : null}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {hasSave ? <button onClick={() => ui.dispatch({ type: "LOAD_GAME" })}>Resume Career</button> : null}
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "CreateCoach" } })}>Start New Career</button>
          <button className="danger" type="button" onClick={() => ui.dispatch({ type: "RESET_SAVE" })}>Reset</button>
        </div>
      </div>
    </div>
  );
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
          type="button"
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
  return <div className="ugf-card"><div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>{backgrounds.map((b) => <button key={b} type="button" onClick={() => ui.dispatch({ type: "SET_BACKGROUND", background: b })}>{selected === b ? "✓ " : ""}{b}</button>)}<button type="button" onClick={() => ui.dispatch({ type: "RUN_INTERVIEWS" })}>Continue to Invitations</button></div></div>;
}

export function InterviewsScreen({ ui }: ScreenProps) {
  const opening = ui.getState().ui.opening;
  const { interviewInvites, interviewResults } = opening;
  const allDone = interviewInvites.length > 0 && interviewInvites.every((invite) => interviewResults[invite.franchiseId]?.completed);
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview Invitations</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {interviewInvites.map((invite) => {
          const franchise = getFranchise(invite.franchiseId);
          const result = opening.interviewResults[invite.franchiseId];
          return (
            <button
              key={invite.franchiseId}
              type="button"
              onClick={() => ui.dispatch({ type: "OPENING_START_INTERVIEW", franchiseId: invite.franchiseId })}
              style={{ display: "grid", gridTemplateColumns: "64px 1fr", alignItems: "center", gap: 10, textAlign: "left" }}
            >
              <span style={{ display: "inline-flex", width: 64, minWidth: 64, justifyContent: "center", alignItems: "center" }}>
                <TeamIcon teamKey={invite.franchiseId} size={44} />
              </span>
              <span>
                <div><b>{(() => { const name = franchise?.fullName ?? invite.franchiseId; devGuardForbiddenTeamName(name); return name; })()}</b>{result?.completed ? " • Completed" : ""}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[invite.tier]}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{invite.summaryLine}</div>
              </span>
            </button>
          );
        })}
        {allDone ? (
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Offers" } })}>
            View Offers
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OpeningInterviewScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  if (state.route.key !== "OpeningInterview") return null;
  const franchiseId = state.route.franchiseId;
  const invite = state.ui.opening.interviewInvites.find((item) => item.franchiseId === franchiseId);
  const result = state.ui.opening.interviewResults[franchiseId];
  const franchise = getFranchise(franchiseId);
  if (!invite || !result) return null;
  const script = INTERVIEW_SCRIPTS[franchiseId] ?? INTERVIEW_SCRIPTS.ATLANTA_APEX;
  const questions = script.questionIds.map((id) => INTERVIEW_QUESTION_BANK[id]);
  const isDone = result.completed || result.answers.length >= questions.length;

  useEffect(() => {
    if (state.route.key === "OpeningInterview" && isDone) {
      ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } });
    }
  }, [isDone, state.route.key]);

  const questionIndex = result.answers.length;
  const current = questions[questionIndex];
  if (!current && !isDone) {
    console.error("Opening interview question missing for index", questionIndex);
  }
  const shouldRenderDoneState = isDone || !current;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview: {(() => { const name = franchise?.fullName ?? franchiseId; devGuardForbiddenTeamName(name); return name; })()}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[invite.tier]} • {invite.summaryLine}</div>
        {current ? <div><b>{current.label} Q{questionIndex + 1}.</b> {current.prompt}</div> : null}
        {shouldRenderDoneState ? (
          <div className="ugf-card" style={{ marginTop: 8 }}>
            <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
              <div><b>Interview Complete</b></div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Interview recorded.</div>
              <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>
                Back to Invitations
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {[
              { label: "A", text: "Set a firm, ambitious standard immediately." },
              { label: "B", text: "Take a balanced approach with steady collaboration." },
              { label: "C", text: "Keep flexibility and adapt after early evaluation." },
            ].map((choice, choiceIndex) => (
              <button key={`${current.label}-${choice.label}`} type="button" onClick={() => ui.dispatch({ type: "OPENING_ANSWER_INTERVIEW", franchiseId, answerIndex: choiceIndex })}>
                {choice.label}) {choice.text}
              </button>
            ))}
          </div>
        )}
        {result.lastToneFeedback ? <div className="ugf-pill">{result.lastToneFeedback}</div> : null}
      </div>
    </div>
  );
}

export function OffersScreen({ ui }: ScreenProps) {
  const opening = ui.getState().ui.opening;
  const offers = opening.offers;
  const lastOfferError = opening.lastOfferError;

  if (!offers.length) {
    console.error("No offers generated (dev error)");
    return (
      <div className="ugf-card">
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <div>No offers generated (dev error)</div>
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Return to Interviews</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {lastOfferError ? <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastOfferError}</div> : null}
        {offers.map((offer) => (
          <button type="button" key={offer.franchiseId} onClick={() => ui.dispatch({ type: "ACCEPT_OFFER", franchiseId: offer.franchiseId })}>
            <div><b>{(() => { const name = getFranchise(offer.franchiseId)?.fullName ?? offer.franchiseId; devGuardForbiddenTeamName(name); return name; })()}</b></div>
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
            {rolePool(pos).map((c) => <button type="button" key={c.DisplayName} onClick={() => ui.dispatch({ type: "SET_COORDINATOR_CHOICE", role, candidateName: c.DisplayName })}>{picks[role] === c.DisplayName ? "✓ " : ""}{c.DisplayName}</button>)}
          </div>
        ))}
        <button type="button" disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize and Enter Hub</button>
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
