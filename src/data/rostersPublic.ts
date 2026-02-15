import { normalizeExcelTeamKey } from "@/data/teamMap";
import { resolveTeamKey } from "@/ui/data/teamKeyResolver";

export type RosterRow = Record<string, unknown> & {
  Team: string;
  PlayerName: string;
  Position?: string;
  PositionGroup?: string;
  Rating?: number;
  Age?: number;
  ContractYearsRemaining?: number;
  AAV?: number;
  Expiring?: string;
};

export type ContractRow = {
  teamKey: string;
  teamName: string;
  playerName: string;
  position: string;
  yearsLeft: number;
  expiring: boolean;
  capHit: number;
};

// Selection logic: prefer explicit JSON files under /public/rosters when present.
// The current dataset is a single JSON payload located at /public/rosters (no extension).
const ROSTER_FETCH_PATH = "/rosters";

let rosterPromise: Promise<RosterRow[]> | null = null;
let contractPromise: Promise<ContractRow[]> | null = null;

const REQUIRED_ROSTER_FIELDS = ["Team", "PlayerName"] as const;

function devError(message: string, details?: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[rostersPublic] ${message}`, details ?? "");
  }
}

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function hasRequiredRosterFields(row: unknown): row is RosterRow {
  if (!row || typeof row !== "object") return false;
  const rec = row as Record<string, unknown>;
  return REQUIRED_ROSTER_FIELDS.every((field) => typeof rec[field] === "string" && String(rec[field]).trim().length > 0);
}

export function sanitizeForbiddenName(value: string): string {
  const raw = String(value ?? "");
  const replaced = raw.replace(/Gotham/gi, "Gothic").replace(/Voodoo/gi, "Hex");
  if (import.meta.env.DEV && replaced !== raw) {
    console.error("[rostersPublic] Forbidden team naming encountered and sanitized.", { raw, replaced });
  }
  return replaced;
}

export function rosterTeamToTeamKey(teamLike: unknown): string {
  const teamRaw = sanitizeForbiddenName(String(teamLike ?? ""));
  const resolved = resolveTeamKey(teamRaw);
  if (resolved && resolved !== "UNKNOWN_TEAM") return resolved;
  const normalized = normalizeExcelTeamKey(teamRaw);
  const fallback = resolveTeamKey(normalized);
  return fallback && fallback !== "UNKNOWN_TEAM" ? fallback : normalized;
}

async function fetchRosterRows(): Promise<RosterRow[]> {
  try {
    const res = await fetch(ROSTER_FETCH_PATH, { cache: "no-store" });
    if (!res.ok) {
      devError("Failed to fetch roster payload.", { path: ROSTER_FETCH_PATH, status: res.status });
      return [];
    }
    const json: unknown = await res.json();
    if (!Array.isArray(json)) {
      devError("Roster payload is not an array.", { path: ROSTER_FETCH_PATH, type: typeof json });
      return [];
    }

    const valid = json.filter(hasRequiredRosterFields);
    if (valid.length !== json.length) {
      devError("Some roster rows were invalid and dropped.", { received: json.length, valid: valid.length });
    }
    return valid;
  } catch (error) {
    devError("Unexpected roster fetch/parse error.", { path: ROSTER_FETCH_PATH, error });
    return [];
  }
}

export async function getRosters(): Promise<RosterRow[]> {
  if (!rosterPromise) {
    rosterPromise = fetchRosterRows();
  }
  return rosterPromise;
}

export async function getContracts(): Promise<ContractRow[]> {
  if (!contractPromise) {
    contractPromise = getRosters().then((rows) => rows.map((row) => {
      const yearsLeft = Math.max(0, Math.round(toNumber(row.ContractYearsRemaining ?? row["Original Contract Length"] ?? 0)));
      const capHit = toNumber(row.AAV ?? row.ContractTotalValue_M ?? 0);
      const expiringRaw = String(row.Expiring ?? "").toLowerCase();
      const expiring = expiringRaw === "yes" || yearsLeft <= 1;
      return {
        teamKey: rosterTeamToTeamKey(row.Team),
        teamName: sanitizeForbiddenName(String(row.Team ?? "")),
        playerName: String(row.PlayerName ?? "Unknown"),
        position: String(row.PositionGroup ?? row.Position ?? ""),
        yearsLeft,
        expiring,
        capHit,
      } satisfies ContractRow;
    }));
  }

  return contractPromise;
}

export function clearRosterCacheForDev(): void {
  if (!import.meta.env.DEV) return;
  rosterPromise = null;
  contractPromise = null;
}
