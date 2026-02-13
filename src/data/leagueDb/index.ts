import raw from "./leagueDB.json";
import { validateLeagueDb } from "./validate";

const issues = validateLeagueDb(raw);

if (issues.length) {
  throw new Error(
    "leagueDB.json validation failed:\n" +
      issues.map(i => `- ${i.path}: ${i.message}`).join("\n")
  );
}

export const leagueDb = raw;
