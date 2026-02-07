  import type { TableRegistry } from "@/data/TableRegistry";
  import type { SaveState, UIAction } from "@/ui/types";
  import type { CoachingEvent, StaffRole } from "@/services/staff";
  import { parseNameCell } from "@/services/staff";

  export type ThreadKind = "base" | "coach";
  export type Thread = {
    id: string;
    title: string;
    body: string;
    kind: ThreadKind;
    actions?: UIAction[];
  };

  function stableString(x: unknown): string {
    return String(x ?? "").trim();
  }

  export function getProspectById(registry: TableRegistry, personId: string) {
    return registry.getTable("2026 Draft Class").find((row) => String((row as any).PlayerID ?? (row as any).ID ?? "") === personId);
  }

  export function getDraftBoard(registry: TableRegistry) {
    return registry.getTable("Draft Order").map((pick, idx) => ({
      pickId: String((pick as any).Pick ?? idx + 1),
      team: String((pick as any).Team ?? "Unknown"),
      round: String((pick as any).Round ?? "1"),
      note: String((pick as any).col_4 ?? ""),
    })),];
  }

  export function getRosterByTeam(registry: TableRegistry, teamId: string) {
    return registry.getTable("Roster").filter((row) => String((row as any).Team ?? (row as any).Tm ?? "") === teamId);
  }

  export function getCandidatesByRole(registry: TableRegistry, role: string) {
    // This repo's Team Personnel is team-based, not a market list. Candidate market is handled in services/staff.ts.
    // Keep legacy for any screens that still call it.
    return registry
      .getTable("Personnel ID")
      .filter((row) => String((row as any).Position ?? "").toUpperCase().includes(role.toUpperCase()))
      .sort((a, b) => String((a as any).Name ?? "").localeCompare(String((b as any).Name ?? "")));
  }

  export function getContractRows(registry: TableRegistry) {
    return registry.getTable("Contract_Builder");
  }

  function coachingThreadId(evt: CoachingEvent): string {
    return `coach-poach:${evt.tick}:${evt.staffId}`;
  }

  function coachingThread(evt: CoachingEvent): Thread {
    const title = `Coach Poached: ${evt.fromRole} → ${evt.toRole}`;
    const body =
      `Your ${evt.fromRole} was poached by ${evt.toTeamId}.

` +
      `Staff: ${evt.staffId}
From: ${evt.fromTeamId}
To: ${evt.toTeamId}

` +
      `Choose a response: counter-offer (this week only) or promote internal.`;

    return {
      id: coachingThreadId(evt),
      title,
      body,
      kind: "coach",
      actions: [
        { type: "COUNTER_OFFER_STAFF", threadId: coachingThreadId(evt) },
        { type: "PROMOTE_INTERNAL", threadId: coachingThreadId(evt) },
        { type: "DO_NOTHING_COACH_POACH", threadId: coachingThreadId(evt) },
      ],
    };
  }

  export function getThreads(registry: TableRegistry, save: SaveState): Thread[] {
    const base = registry.getTable("League Context").map((row, idx) => ({
      id: `thread-${idx + 1}`,
      title: String((row as any).Topic ?? (row as any).Context ?? `League Update ${idx + 1}`),
      body: String((row as any).Detail ?? (row as any).col_2 ?? JSON.stringify(row)),
      kind: "base" as const,
    }));

    const tradeThreads = (save.tradeInbox ?? [])
  .filter((o) => o.status === "pending")
  .slice(0, 8)
  .map((o) => ({
    id: `trade:${o.id}`,
    title: `Trade offer — ${o.toTeamId === (save.franchiseTeamId ?? "") ? o.fromTeamId : o.toTeamId}`,
    body: o.rationale ?? "Trade offer pending.",
    kind: "trade" as const,
  }));

const draftRecap = {
  id: "draft:recap",
  title: "Draft recap",
  body: "View recent picks and narratives.",
  kind: "draft" as const,
};

const draftThreads = [draftRecap, ...(save.draft?.news ?? []).map((n) => ({

  id: n.id,
  title: n.title,
  body: n.body,
  kind: "draft" as const,
}));

const events = (save.coachingEvents ?? []).filter((e) => e.type === "STAFF_POACHED");

    const eventThreads = events
      .slice()
      .sort((a, b) => b.tick - a.tick || coachingThreadId(a).localeCompare(coachingThreadId(b)))
      .map(coachingThread);

    return [...tradeThreads, ...draftThreads, ...eventThreads, ...base];
  }

  export function getThreadMessages(registry: TableRegistry, save: SaveState, threadId: string) {
    // Minimal: one message body for now; can be expanded later.
if (threadId.startsWith("draft:grades")) {
  const grades = save.draft?.classGrades ?? {};
  const entries = Object.entries(grades).sort((a: any, b: any) => (b[1].score ?? 0) - (a[1].score ?? 0)).slice(0, 40);
  if (!entries.length) return [{ id: "g0", from: "League Desk", text: "Grades not available yet. Finish more of the draft first." }];
  return entries.map(([team, g]: any, idx: number) => ({
    id: `g${idx}`,
    from: "League Desk",
    text: `${team}: ${g.letter} (score ${Math.round(g.score)}) — ${g.summary}`,
  }));
}

if (threadId.startsWith("draft:recap")) {
  const recent = (save.draft?.news ?? []).slice(0, 12);
  const msgs = recent.map((n, idx) => ({
    id: `d${idx}`,
    from: "League Desk",
    text: `${n.title}: ${n.body}`,
  }));
  return msgs.length ? msgs : [{ id: "d0", from: "League Desk", text: "No draft news yet." }];
}

if (threadId.startsWith("trade:")) {
  const offerId = threadId.replace(/^trade:/, "");
  const offer = (save.tradeInbox ?? []).find((o: any) => o.id === offerId);
  if (!offer) return [{ id: "m1", from: "System", text: "Trade offer not found." }];

  const give = offer.give.map((a: any) => (a.kind === "pick" ? `Pick ${a.overall ?? `R${a.round}`} (+${a.yearOffset}y)` : `Player ${a.playerId}`)).join(", ");
  const get = offer.get.map((a: any) => (a.kind === "pick" ? `Pick ${a.overall ?? `R${a.round}`} (+${a.yearOffset}y)` : `Player ${a.playerId}`)).join(", ");

  return [
    { id: "m1", from: offer.fromTeamId, text: offer.message ?? "We have a proposal." },
    { id: "m2", from: "System", text: `Offer: You give: ${give}. You get: ${get}.` },
    { id: "m3", from: "System", text: offer.rationale ?? "No additional rationale." },
  ];
}

const thread = getThreads(registry, save).find((t) => t
.id === threadId);
    if (!thread) return [];
    const res = save.coachingResolutions?.[threadId];
    const lines = [thread.body];
    if (res?.note) lines.push(`

Resolution: ${res.note}`);
    return lines.join("");
  }

  export function getReplyOptions(registry: TableRegistry, save: SaveState, threadId: string): string[] {
    // For now: use Quick_Reference strings as pool; deterministic subset by seed+tick.
    const pool = registry
      .getTable("Quick_Reference")
      .flatMap((r) => Object.values(r))
      .map(stableString)
      .filter((s) => s.length >= 6 && s.length <= 80);

    const seed = save.seed ?? 2026;
    const tick = save.tick ?? 0;

    const pick = (i: number) => {
      const key = `${threadId}|${tick}|${i}`;
      let h = 2166136261;
      for (let j = 0; j < key.length; j++) {
        h ^= key.charCodeAt(j);
        h = Math.imul(h, 16777619);
      }
      const idx = (h >>> 0) % Math.max(1, pool.length);
      return pool[idx] ?? "OK.";
    };

    const opts = [pick(0), pick(1), pick(2)];
    return Array.from(new Set(opts));
  }

  export function getThreadCategory(_registry: TableRegistry, _save: SaveState, threadId: string) {
    if (threadId.startsWith("coach-poach:")) return "staff";
    return "general";
  }
