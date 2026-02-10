import React from "react";
import personnelData from "@/data/generated/personnel.json";
import type { ScreenProps } from "@/ui/types";
import { HOMETOWNS } from "@/data/hometowns";
import { resolveFranchiseLike } from "@/ui/data/franchises";
import { normalizeExcelTeamKey } from "@/data/teamMap";
import { TeamLogo } from "@/ui/components/TeamLogo";
import { TeamIcon } from "@/ui/components/TeamIcon";
import { INTERVIEW_QUESTION_BANK } from "@/data/interviewBank";
import { INTERVIEW_SCRIPTS } from "@/data/interviewScripts";

type PersonnelRow = { DisplayName: string; Position: string; Scheme?: string };
const personnel = personnelData as PersonnelRow[];
const backgrounds = ["Former QB", "Defensive Architect", "Special Teams Ace", "CEO Program Builder"];

const tierLabelByCode = {
  REBUILD: "Rebuild (Bottom-5)",
  FRINGE: "Fringe (Middle)",
  CONTENDER: "Contender (Top-10)",
} as const;

function rolePool(position: "OC" | "DC" | "ST Coordinator") {
  return personnel.filter((p) => p.Position === position).slice(0, 6);
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
          <button type="button" onClick={() => ui.dispatch({ type: "FORCE_SAVE" })}>Save</button>
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
          const franchise = resolveFranchiseLike(invite.franchiseId);
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
        {allDone ? <div className="ugf-pill">All interviews complete. Offers generated automatically.</div> : null}
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
  const franchise = resolveFranchiseLike(franchiseId);
  if (!invite || !result) return null;
  const scriptTeamKey = resolveFranchiseLike(franchiseId)?.teamKey ?? normalizeExcelTeamKey(franchiseId);
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
                onClick={() => ui.dispatch({ type: "OPENING_ANSWER_INTERVIEW", franchiseId, answerIndex: index })}
              >
                {choice.id}) {choice.text}
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
        <button type="button" disabled={!picks.OC || !picks.DC || !picks.STC} onClick={() => ui.dispatch({ type: "FINALIZE_NEW_SAVE" })}>Finalize Coordinator Staff</button>
      </div>
    </div>
  );
}

export function StaffMeetingScreen({ ui }: ScreenProps) {
  return (
    <div className="ugf-card">
      <div className="ugf-card__header"><h2 className="ugf-card__title">Staff Meeting</h2></div>
      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div>Staff Meeting is disabled for now.</div>
        <button type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>Back to Hub</button>
      </div>
    </div>
  );
}
