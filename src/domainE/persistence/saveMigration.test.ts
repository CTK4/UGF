import { describe, expect, it } from "vitest";
import { migrateSave, SAVE_SCHEMA_VERSION } from "@/domainE/persistence/saveMigration";

describe("migrateSave", () => {
  it("adds schema version and repairs missing structures", () => {
    const migrated = migrateSave({ version: 1, gameState: { league: { teamsById: { ATL: { id: "ATL" } } } } });
    expect(migrated.meta?.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.gameState.franchise.ugfTeamKey).toBe("ATL");
    expect(migrated.gameState.offseasonPlan).toBeNull();
  });

  it("preserves unknown fields", () => {
    const migrated = migrateSave({ version: 1, extraRoot: 7, gameState: { customBlob: { hello: true } } });
    expect((migrated as any).extraRoot).toBe(7);
    expect((migrated.gameState as any).customBlob).toEqual({ hello: true });
  });

  it("treats missing schema version as v0 and upgrades", () => {
    const migrated = migrateSave({ version: 1, meta: {}, gameState: {} });
    expect(migrated.meta?.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
  });
});
