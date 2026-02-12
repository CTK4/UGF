import React from "react";
import { getPersonnel } from "@/data/leagueDb";
import type { ScreenProps } from "@/ui/types";
import { HOMETOWNS } from "@/data/hometowns";
import { resolveFranchiseLike } from "@/ui/data/franchises";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { TeamIcon } from "@/ui/components/TeamIcon";
import { INTERVIEW_QUESTION_BANK } from "@/data/interviewBank";
import { INTERVIEW_SCRIPTS } from "@/data/interviewScripts";
import { coordinatorCandidateMeta, type CoordinatorRole } from "@/ui/helpers/deterministic";

type CoordinatorCandidate = {
  personId: string;
  displayName: string;
  role: "OC" | "DC" | "STC";
  scheme?: string;
  reputation: number;
};

const fallbackSpecialTeamsCandidates: readonly CoordinatorCandidate[] = [
  { personId: "fallback-stc-1", displayName: "Lori Reardon", role: "STC", scheme: "Conservative / Field Position", reputation: 68 },
  { personId: "fallback-stc-2", displayName: "Devlin Britton", role: "STC", scheme: "Block-Oriented Pressure", reputation: 66 },
  { personId: "fallback-stc-3", displayName: "Donnie Chu", role: "STC", scheme: "Directional Control", reputation: 64 },
  { personId: "fallback-stc-4", displayName: "Katya Beasley", role: "STC", scheme: "Safe Hands / No Risk", reputation: 63 },
  { personId: "fallback-stc-5", displayName: "Yulissa Broussard", role: "STC", scheme: "Aggressive Returns", reputation: 62 },
  { personId: "fallback-stc-6", displayName: "Orion Firth", role: "STC", scheme: "Fake-Ready / Opportunistic", reputation: 60 },
];

const coordinatorCandidates = getPersonnel()
  .filter((person) => {
    const role = String(person.role ?? "").toUpperCase();
    const status = String(person.status ?? "").toUpperCase();
    return (role === "OC" || role === "DC" || role === "STC") && status === "FREE_AGENT";
  })
  .map((person) => ({
    personId: String(person.personId),
    displayName: String(person.fullName ?? "Unknown Coach"),
    role: String(person.role ?? "").toUpperCase() as "OC" | "DC" | "STC",
    scheme: String(person.scheme ?? "").trim() || undefined,
    reputation: Number(person.reputation ?? 0),
  }))
  .sort((a, b) => b.reputation - a.reputation || a.displayName.localeCompare(b.displayName) || a.personId.localeCompare(b.personId));

const backgrounds = ["Former QB", "Defensive Architect", "Special Teams Ace", "CEO Program Builder"];
const coachPersonalities = ["Balanced", "Players Coach", "Disciplinarian", "Analytics First"] as const;


const tierLabelByCode = {
  REBUILD: "Rebuild (Bottom-5)",
  FRINGE: "Fringe (Middle)",
  CONTENDER: "Contender (Top-10)",
} as const;

function rolePool(role: "OC" | "DC" | "STC") {
  const live = coordinatorCandidates.filter((candidate) => candidate.role === role);
  if (role !== "STC") return live.slice(0, 6);

  const existingNames = new Set(live.map((candidate) => candidate.displayName.toLowerCase()));
  const fallback = fallbackSpecialTeamsCandidates.filter((candidate) => !existingNames.has(candidate.displayName.toLowerCase()));
  return [...live, ...fallback].slice(0, 6);
}

function devGuardForbiddenTeamName(_teamName: string) {
  // Reserved for future naming validation in development builds.
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
          <button type="button" disabled={!hasSave} onClick={() => ui.dispatch({ type: "FORCE_SAVE" })}>Save</button>
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
        <select
          value={opening.openingPath}
          onChange={(e) => ui.dispatch({ type: "SET_OPENING_PATH", openingPath: e.target.value })}
        >
          <option value="FIXED_TRIAD">Story Start (Birmingham / Milwaukee / Atlanta)</option>
          <option value="DYNAMIC">Dynamic Start (tiers + hometown)</option>
        </select>
        <input
          value={opening.coachName}
          placeholder="Coach name"
          onChange={(e) => ui.dispatch({ type: "SET_COACH_NAME", coachName: e.target.value })}
        />
        <select value={opening.coachAge} onChange={(e) => ui.dispatch({ type: "SET_COACH_AGE", coachAge: Number(e.target.value) })}>
          {Array.from({ length: 85 - 24 + 1 }, (_, i) => 24 + i).map((age) => (
            <option key={age} value={age}>{age}</option>
          ))}
        </select>
        <select value={opening.coachPersonality} onChange={(e) => ui.dispatch({ type: "SET_COACH_PERSONALITY", coachPersonality: e.target.value })}>
          {coachPersonalities.map((personality) => (
            <option key={personality} value={personality}>{personality}</option>
          ))}
        </select>
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
  const { interviewInvites, interviewResults, lastInterviewError } = opening;
  const allDone = interviewInvites.length > 0 && interviewInvites.every((invite) => interviewResults[invite.franchiseId]?.completed);
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview Invitations</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {lastInterviewError ? <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastInterviewError}</div> : null}
        {interviewInvites.map((invite) => {
          const franchise = resolveFranchiseLike(invite.franchiseId);
          const result = opening.interviewResults[invite.franchiseId];
          return (
            <button
              key={invite.franchiseId}
              type="button"
              onClick={() => {
                const id = String(invite.franchiseId);
                if (import.meta.env.DEV) console.log("[ui] interview invite clicked", { franchiseId: id });
                ui.dispatch({ type: "OPENING_START_INTERVIEW", franchiseId: id });
              }}
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
        {allDone ? <div className="ugf-pill">All interviews complete. Offers generated automatically.</div> : null}
      </div>
    </div>
  );
}

export function OpeningInterviewScreen({ ui }: ScreenProps) {
  const state = ui.getState();
  if (state.route.key !== "OpeningInterview") return null;
  const franchiseId = String(state.route.franchiseId);
  const invite = state.ui.opening.interviewInvites.find((item) => item.franchiseId === franchiseId);
  const result = state.ui.opening.interviewResults[franchiseId];
  const lastInterviewError = state.ui.opening.lastInterviewError;
  const franchise = resolveFranchiseLike(franchiseId);
  if (!invite || !result) {
    return (
      <div className="ugf-card">
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <div><b>Interview unavailable</b></div>
          {lastInterviewError ? <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastInterviewError}</div> : null}
          <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Back to Invitations</button>
        </div>
      </div>
    );
  }
  const scriptTeamKey = resolveTeamKey(franchiseId);
  const script = INTERVIEW_SCRIPTS[scriptTeamKey] ?? INTERVIEW_SCRIPTS.ATLANTA_APEX;
  const questionIndex = result.answers.length;
  const questionId = script.questionIds[questionIndex];
  const current = questionId ? INTERVIEW_QUESTION_BANK[questionId] : undefined;
  const prompt = questionId ? script.phrasing?.[questionId] ?? current?.prompt : undefined;
  const isDone = result.completed || questionIndex >= script.questionIds.length;

  if (!current && !isDone) {
    console.error("Opening interview question missing for index", questionIndex);
  }
  const shouldRenderDoneState = isDone || !current;

  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Interview: {(() => { const name = franchise?.fullName ?? franchiseId; devGuardForbiddenTeamName(name); return name; })()}</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 12, opacity: 0.9 }}>{tierLabelByCode[invite.tier]} • {invite.summaryLine}</div>
        {current ? <div><b>{current.label}</b> {prompt}</div> : null}
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
            {current.choices.map((choice, index) => (
              <button
                key={`${questionId}-${choice.id}`}
                type="button"
                onClick={() => {
                  const id = String(invite.franchiseId);
                  ui.dispatch({ type: "OPENING_ANSWER_INTERVIEW", franchiseId: id, answerIndex: index });
                }}
              >
                {choice.id}) {choice.text}
              </button>
            ))}
          </div>
        )}
        {result.lastToneFeedback ? <div className="ugf-pill">{result.lastToneFeedback}</div> : null}
        {lastInterviewError ? <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastInterviewError}</div> : null}
      </div>
    </div>
  );
}

export function OffersScreen({ ui }: ScreenProps) {
  const opening = ui.getState().ui.opening;
  const offers = opening.offers;
  const lastOfferError = opening.lastOfferError;
  const canReturnToInterviews = opening.interviewInvites.length > 0;

  if (!offers.length) {
    console.error("No offers generated (dev error)");
    return (
      <div className="ugf-card">
        <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
          <div><b>No offers generated (dev error)</b></div>
          {lastOfferError ? <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastOfferError}</div> : null}
          {canReturnToInterviews ? (
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Back to Interviews</button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {lastOfferError ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div className="ugf-pill" style={{ color: "#ffd7d7", borderColor: "#b04545" }}>{lastOfferError}</div>
            <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Interviews" } })}>Back to Interviews</button>
          </div>
        ) : null}
        {offers.map((offer) => (
          <button type="button" key={offer.franchiseId} onClick={() => {
              const resolved = resolveFranchiseLike(offer.franchiseId);
              ui.dispatch({
                type: "ACCEPT_OFFER",
                franchiseId: offer.franchiseId,
                excelTeamKey: normalizeExcelTeamKey(resolved?.fullName ?? offer.franchiseId),
              });
            }}>
            <div><b>{(() => { const name = resolveFranchiseLike(offer.franchiseId)?.fullName ?? offer.franchiseId; devGuardForbiddenTeamName(name); return name; })()}</b></div>
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
  const roles: Array<"OC" | "DC" | "STC"> = ["OC", "DC", "STC"];

  return (
    <div className="ugf-card">
      <div className="ugf-card__body" style={{ display: "grid", gap: 8 }}>
        {roles.map((role) => (
          <div key={role} style={{ display: "grid", gap: 8 }}>
            <b>{role}</b>
            {rolePool(role).map((c) => {
              const meta = coordinatorCandidateMeta({ role: role as CoordinatorRole, name: c.displayName, scheme: c.scheme });
              const selected = picks[role] === c.displayName;
              return (
                <button
                  type="button"
                  key={c.personId}
                  onClick={() => ui.dispatch({ type: "SET_COORDINATOR_CHOICE", role, candidateName: c.displayName })}
                  className="ugf-card"
                  style={{ textAlign: "left", borderColor: selected ? "#ffbf47" : undefined, boxShadow: selected ? "0 0 0 1px rgba(255,191,71,0.6)" : undefined }}
                >
                  <span className="ugf-card__body" style={{ display: "grid", gap: 6 }}>
                    <span style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <b>{selected ? "✓ " : ""}{c.displayName}</b>
                      <span className="ugf-pill">{c.role}</span>
                    </span>
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="ugf-pill">Rep: {c.reputation}</span>
                      <span className="ugf-pill">Scheme: {meta.schemeTag}</span>
                      <span className="ugf-pill">Style: {meta.styleTag}</span>
                      <span className="ugf-pill">Fit: {meta.fitScore}</span>
                      <span className="ugf-pill">${meta.salary.toLocaleString()} • {meta.years}y</span>
                    </span>
                    {selected ? <small>{meta.whyFit}</small> : null}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
        <button type="button" disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize and Enter Hub</button>
      </div>
    </div>
  );
}

export function StaffMeetingScreen({ ui }: ScreenProps) {
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Meeting</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div>Submit offseason priorities to clear the advance blocker.</div>
        <button
          type="button"
          onClick={() => ui.dispatch({
            type: "SUBMIT_STAFF_MEETING",
            payload: { priorities: [], resignTargets: [], shopTargets: [], tradeNotes: "" },
          })}
        >
          Submit Priorities
        </button>
        <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
      </div>
    </div>
  );
}
