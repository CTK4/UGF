import React, { useMemo, useState } from "react";
import personnelData from "@/data/generated/personnel.json";
import rosterData from "@/data/generated/rosters.json";
import type { ScreenProps } from "@/ui/types";
import { HOMETOWNS } from "@/data/hometowns";
import { getFranchise } from "@/ui/data/franchises";
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

const interviewQuestions = [
  {
    label: "Owner",
    prompt: "How would you establish accountability in year one?",
    choices: [
      { label: "A", text: "Set measurable standards and review them every week.", owner: 6, gm: 2, pressure: 1, tone: "Confident and structured." },
      { label: "B", text: "Empower leaders in the locker room first, then set standards.", owner: 3, gm: 4, pressure: 0, tone: "Collaborative and steady." },
      { label: "C", text: "Keep things loose early and adjust once we see results.", owner: -2, gm: -1, pressure: -2, tone: "Too passive for ownership." },
    ],
  },
  {
    label: "GM",
    prompt: "How do you partner with the front office on roster decisions?",
    choices: [
      { label: "A", text: "Align on a profile and let data drive final tie-breakers.", owner: 2, gm: 6, pressure: 1, tone: "Process-oriented and aligned." },
      { label: "B", text: "I make scheme asks and trust scouting to execute.", owner: 1, gm: 3, pressure: 0, tone: "Reasonable but less collaborative." },
      { label: "C", text: "I want final say on all roster moves.", owner: -2, gm: -4, pressure: -1, tone: "Power struggle concern." },
    ],
  },
  {
    label: "Pressure",
    prompt: "How do you handle media pressure after a losing streak?",
    choices: [
      { label: "A", text: "Own the results publicly and protect the locker room.", owner: 3, gm: 2, pressure: 5, tone: "Strong leadership under pressure." },
      { label: "B", text: "Stay even-keeled and focus only on internal messaging.", owner: 1, gm: 1, pressure: 2, tone: "Stable, if somewhat reserved." },
      { label: "C", text: "Call out execution issues directly to force urgency.", owner: -2, gm: -1, pressure: -4, tone: "Risky tone for a volatile market." },
    ],
  },
] as const;

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
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview Invitations</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {opening.interviewInvites.map((invite) => {
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
                <div><b>{franchise?.fullName ?? invite.franchiseId}</b>{result?.completed ? " • Completed" : ""}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[invite.tier]}</div>
                <div style={{ fontSize: 12, opacity: 0.9 }}>{invite.summaryLine}</div>
              </span>
            </button>
          );
        })}
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
  const questionIndex = result.answers.length;
  const current = interviewQuestions[questionIndex] ?? interviewQuestions[interviewQuestions.length - 1];

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview: {franchise?.fullName ?? franchiseId}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[invite.tier]} • {invite.summaryLine}</div>
        <div><b>{current.label} Q{Math.min(questionIndex + 1, 3)}.</b> {current.prompt}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {current.choices.map((choice, choiceIndex) => (
            <button key={`${current.label}-${choice.label}`} type="button" onClick={() => ui.dispatch({ type: "OPENING_ANSWER_INTERVIEW", franchiseId, answerIndex: choiceIndex })}>
              {choice.label}) {choice.text}
            </button>
          ))}
        </div>
        {result.lastToneFeedback ? <div className="ugf-pill">Tone: {result.lastToneFeedback}</div> : null}
      </div>
    </div>
  );
}

export function OffersScreen({ ui }: ScreenProps) {
  const offers = ui.getState().ui.opening.offers;

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {offers.map((offer) => (
          <button type="button" key={offer.franchiseId} onClick={() => ui.dispatch({ type: "ACCEPT_OFFER", franchiseId: offer.franchiseId })}>
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
