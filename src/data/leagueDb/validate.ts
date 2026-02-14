type Issue = { path: string; message: string };

export function validateLeagueDb(db: any): Issue[] {
  const issues: Issue[] = [];

  const requireArray = (path: string, v: any) => {
    if (!Array.isArray(v)) issues.push({ path, message: "Expected array" });
  };

  requireArray("teams", db?.teams);
  requireArray("players", db?.players);
  requireArray("contracts", db?.contracts);
  requireArray("personnel", db?.personnel);

  const requireString = (path: string, v: any) => {
    if (typeof v !== "string" || !v.trim())
      issues.push({ path, message: "Expected non-empty string" });
  };

  db?.teams?.forEach((t: any, i: number) => {
    requireString(`teams[${i}].teamId`, t?.teamId);
    requireString(`teams[${i}].name`, t?.name);
  });

  db?.players?.forEach((p: any, i: number) => {
    requireString(`players[${i}].playerId`, p?.playerId);
    requireString(`players[${i}].fullName`, p?.fullName);
    requireString(`players[${i}].pos`, p?.pos);
    requireString(`players[${i}].teamId`, p?.teamId);
  });

  db?.contracts?.forEach((c: any, i: number) => {
    requireString(`contracts[${i}].contractId`, c?.contractId);
    requireString(`contracts[${i}].entityType`, c?.entityType);
    requireString(`contracts[${i}].entityId`, c?.entityId);
  });

  return issues;
}
