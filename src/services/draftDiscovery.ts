import draftClass from "@/data/generated/draftClass.json";

type DraftProspectRow = {
  [key: string]: unknown;
  "Player ID"?: string | number;
  Name?: string;
  POS?: string;
  College?: string;
};

function toProspectId(row: DraftProspectRow): string {
  return String(row["Player ID"] ?? "").trim();
}

function toName(row: DraftProspectRow): string {
  return String(row.Name ?? "Unknown Prospect");
}

function toPos(row: DraftProspectRow): string {
  return String(row.POS ?? "ATH");
}

function toCollege(row: DraftProspectRow): string {
  return String(row.College ?? "Unknown");
}

export function getProspectLabel(prospectId: string): string {
  const row = (draftClass as DraftProspectRow[]).find((item) => toProspectId(item) === prospectId);
  if (!row) return prospectId;
  return `${toName(row)} (${toPos(row)} • ${toCollege(row)})`;
}
