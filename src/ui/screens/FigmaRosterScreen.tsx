import React, { useEffect, useMemo, useState } from "react";
import type { ScreenProps } from "@/ui/types";
import { UI_ID } from "@/ui/ids";
import { SegmentedTabs } from "@/ui/components/SegmentedTabs";
import { sanitizeForbiddenName } from "@/services/rosterImport";
import { getPlayers } from "@/data/leagueDb";

type PositionFilter = "ALL" | "QB" | "RB" | "WR" | "TE" | "OL" | "DL" | "LB" | "DB" | "ST";
type RosterTab = "Roster" | "Depth" | "Contracts" | "Stats" | "History";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function toPositionGroup(pos: string): PositionFilter {
  const key = String(pos || "").toUpperCase();
  if (["QB"].includes(key)) return "QB";
  if (["RB", "FB"].includes(key)) return "RB";
  if (["WR"].includes(key)) return "WR";
  if (["TE"].includes(key)) return "TE";
  if (["LT", "LG", "C", "RG", "RT", "OL"].includes(key)) return "OL";
  if (["DE", "DT", "NT", "DL"].includes(key)) return "DL";
  if (["LB", "ILB", "OLB", "MLB"].includes(key)) return "LB";
  if (["CB", "S", "SS", "FS", "DB"].includes(key)) return "DB";
  if (["K", "P", "LS", "ST"].includes(key)) return "ST";
  return "ALL";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function ratingColor(ovr: number): string {
  if (ovr >= 90) return "var(--gold2)";
  if (ovr >= 80) return "var(--gold)";
  if (ovr >= 70) return "rgba(120, 190, 255, 0.95)";
  return "rgba(245, 247, 250, 0.7)";
}

function StatBar({ label, value }: { label: string; value: number }) {
  const pct = clamp(value, 0, 99);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 40px", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--gold), rgba(120,150,190,0.35))" }} />
      </div>
      <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>{value}</div>
    </div>
  );
}

export function FigmaRosterScreen({ ui }: ScreenProps) {
  const save = ui.getState().save;
  const [tab, setTab] = useState<RosterTab>("Roster");
  const [filter, setFilter] = useState<PositionFilter>("ALL");
  const [showReleased, setShowReleased] = useState(false);

  useEffect(() => {
    if (save) ui.dispatch({ type: "INIT_ROSTER_DATA" });
  }, [save, ui]);

  if (!save) {
    return (
      <div className="ugf-card" data-ui={UI_ID.roster.root}>
        <div className="ugf-card__header"><h2 className="ugf-card__title">Team Roster</h2></div>
        <div className="ugf-card__body">Roster unavailable without an active save.</div>
      </div>
    );
  }

  const players = Object.values(save.gameState.roster?.players ?? {});
  const pendingById = new Set(getPlayers().filter((p) => String(p.status ?? "").toUpperCase() === "PENDING_FREE_AGENT").map((p) => String(p.playerId)));
  const cap = save.gameState.cap;
  const warning = save.gameState.roster?.warning;

  const avgOvr =
    players.length > 0 ? Math.round(players.reduce((sum, p) => sum + (p.overall ?? 0), 0) / players.length) : 0;

  const rows = useMemo(() => {
    return players
      .filter((player) => (showReleased ? true : player.status !== "RELEASED"))
      .filter((player) => (filter === "ALL" ? true : toPositionGroup(player.pos) === filter))
      .sort((a, b) => b.overall - a.overall || a.name.localeCompare(b.name));
  }, [filter, players, showReleased]);

  return (
    <div className="ugf-card" data-ui={UI_ID.roster.root}>
      <div className="ugf-card__header">
        <h2 className="ugf-card__title">Team Roster</h2>
      </div>

      <div className="ugf-card__body" style={{ display: "grid", gap: 12 }}>
        <div className="ugf-card" data-ui={UI_ID.roster.teamOverview}>
          <div className="ugf-card__body" style={{ display: "grid", gap: 10, position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--gold)" }}>
                  Team Overview
                </div>
                <div style={{ color: "var(--muted)" }}>Broadcast-style summary with filters and actions.</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>AVG OVR</div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1, color: ratingColor(avgOvr), fontVariantNumeric: "tabular-nums" }}>
                  {avgOvr}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              <StatBar label="Offense" value={avgOvr} />
              <StatBar label="Defense" value={avgOvr} />
              <StatBar label="Special" value={avgOvr} />
            </div>

            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 3,
                background: "linear-gradient(90deg, var(--gold) 0%, transparent 100%)",
              }}
            />
          </div>
        </div>

        <div className="ugf-pill" data-ui={UI_ID.roster.capSummary}>
          Cap Limit: {money(cap.capLimit)} · Payroll: {money(cap.payroll)} · Cap Space: <b>{money(cap.capSpace)}</b>
        </div>

        {warning ? <div className="ugf-card"><div className="ugf-card__body">{warning}</div></div> : null}

        <div data-ui={UI_ID.roster.tabs}>
          <SegmentedTabs
            value={tab}
            ariaLabel="Roster views"
            onChange={(key) => setTab(key as RosterTab)}
            tabs={["Roster", "Depth", "Contracts", "Stats", "History"].map((t) => ({ key: t, label: t }))}
          />
        </div>

        {tab !== "Roster" ? (
          <div className="ugf-card"><div className="ugf-card__body">This view is a placeholder in the Figma port. Switch back to <b>Roster</b>.</div></div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label data-ui={UI_ID.roster.filterPosition}>
                Position:&nbsp;
                <select value={filter} onChange={(event) => setFilter(event.target.value as PositionFilter)}>
                  {["ALL", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "ST"].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label data-ui={UI_ID.roster.toggleReleased}>
                <input type="checkbox" checked={showReleased} onChange={(event) => setShowReleased(event.target.checked)} /> Show Released
              </label>
              <button data-ui={UI_ID.roster.backToHub} type="button" onClick={() => ui.dispatch({ type: "NAVIGATE", route: { key: "Hub" } })}>
                Back to Hub
              </button>
            </div>

            {!rows.length ? <div>No players found for the active roster.</div> : null}

            {rows.map((player) => (
              <div
                key={player.id}
                className="ugf-card"
                data-ui={UI_ID.roster.playerRow}
                style={{ opacity: player.status === "RELEASED" ? 0.72 : 1 }}
              >
                <div className="ugf-card__body" style={{ display: "grid", gridTemplateColumns: "1.4fr repeat(6, minmax(72px, 1fr)) 130px", gap: 10, alignItems: "center" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <b>{sanitizeForbiddenName(player.name)}{pendingById.has(player.id) ? " (Pending FA)" : ""}</b>
                      {player.status === "RELEASED" ? <span className="ugf-pill">Released</span> : null}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>{player.status}</div>
                  </div>

                  <div>{player.pos}</div>
                  <div style={{ fontWeight: 800, color: ratingColor(player.overall) }}>OVR {player.overall}</div>
                  <div>Age {player.age}</div>
                  <div>{player.yearsLeft} yrs</div>
                  <div>{money(player.salary)}</div>
                  <div>{money(player.capHit)}</div>

                  <button
                    data-ui={UI_ID.roster.releaseButton}
                    className="danger"
                    disabled={player.status === "RELEASED"}
                    onClick={() => ui.dispatch({ type: "PROMPT_RELEASE_PLAYER", playerId: player.id })}
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
