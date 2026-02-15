import { createNewGameState } from "@/engine/reducer";
import type { GameState } from "@/engine/gameState";
import type { SaveData } from "@/ui/types";

export const SAVE_SCHEMA_VERSION = 1;

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function resolveFallbackFranchiseId(gameState: Partial<GameState>): string {
  const leagueTeams = Object.keys((gameState.league?.teamsById ?? {}) as Record<string, unknown>);
  if (leagueTeams.length) return leagueTeams[0];
  const rosterTeams = Object.keys((gameState.league?.teamRosters ?? {}) as Record<string, unknown>);
  if (rosterTeams.length) return rosterTeams[0];
  return "";
}

function repairGameState(rawGameState: unknown): GameState {
  const base = createNewGameState();
  const incoming = isDict(rawGameState) ? rawGameState : {};

  const repaired: GameState = {
    ...base,
    ...(incoming as Partial<GameState>),
    meta: { ...base.meta, ...(isDict(incoming.meta) ? (incoming.meta as Dict) : {}) } as GameState["meta"],
    world: { ...base.world, ...(isDict(incoming.world) ? (incoming.world as Dict) : {}) } as GameState["world"],
    time: { ...base.time, ...(isDict(incoming.time) ? (incoming.time as Dict) : {}) } as GameState["time"],
    coach: { ...base.coach, ...(isDict(incoming.coach) ? (incoming.coach as Dict) : {}) } as GameState["coach"],
    franchise: { ...base.franchise, ...(isDict(incoming.franchise) ? (incoming.franchise as Dict) : {}) } as GameState["franchise"],
    staff: {
      ...base.staff,
      ...(isDict(incoming.staff) ? (incoming.staff as Dict) : {}),
      assignments: {
        ...base.staff.assignments,
        ...(isDict((incoming.staff as Dict | undefined)?.assignments) ? ((incoming.staff as Dict).assignments as Dict) : {}),
      },
    } as GameState["staff"],
    characters: {
      ...base.characters,
      ...(isDict(incoming.characters) ? (incoming.characters as Dict) : {}),
      byId: (isDict((incoming.characters as Dict | undefined)?.byId) ? (incoming.characters as Dict).byId : {}) as GameState["characters"]["byId"],
      ownersByTeamKey: (isDict((incoming.characters as Dict | undefined)?.ownersByTeamKey) ? (incoming.characters as Dict).ownersByTeamKey : {}) as GameState["characters"]["ownersByTeamKey"],
      gmsByTeamKey: (isDict((incoming.characters as Dict | undefined)?.gmsByTeamKey) ? (incoming.characters as Dict).gmsByTeamKey : {}) as GameState["characters"]["gmsByTeamKey"],
    },
    teamFrontOffice: (isDict(incoming.teamFrontOffice) ? incoming.teamFrontOffice : {}) as GameState["teamFrontOffice"],
    career: {
      ...base.career,
      ...(isDict(incoming.career) ? (incoming.career as Dict) : {}),
      control: {
        ...base.career.control,
        ...(isDict((incoming.career as Dict | undefined)?.control) ? ((incoming.career as Dict).control as Dict) : {}),
      },
    } as GameState["career"],
    delegation: { ...base.delegation, ...(isDict(incoming.delegation) ? (incoming.delegation as Dict) : {}) } as GameState["delegation"],
    draft: {
      ...base.draft,
      ...(isDict(incoming.draft) ? (incoming.draft as Dict) : {}),
      discovered: (isDict((incoming.draft as Dict | undefined)?.discovered) ? (incoming.draft as Dict).discovered : {}) as GameState["draft"]["discovered"],
      watchlist: ensureArray<string>((incoming.draft as Dict | undefined)?.watchlist, base.draft.watchlist),
    },
    league: {
      ...base.league,
      ...(isDict(incoming.league) ? (incoming.league as Dict) : {}),
      playersById: (isDict((incoming.league as Dict | undefined)?.playersById) ? (incoming.league as Dict).playersById : {}) as GameState["league"]["playersById"],
      teamRosters: (isDict((incoming.league as Dict | undefined)?.teamRosters) ? (incoming.league as Dict).teamRosters : {}) as GameState["league"]["teamRosters"],
      teamsById: (isDict((incoming.league as Dict | undefined)?.teamsById) ? (incoming.league as Dict).teamsById : {}) as GameState["league"]["teamsById"],
      contractsById: (isDict((incoming.league as Dict | undefined)?.contractsById) ? (incoming.league as Dict).contractsById : {}) as GameState["league"]["contractsById"],
      personnelById: (isDict((incoming.league as Dict | undefined)?.personnelById) ? (incoming.league as Dict).personnelById : {}) as GameState["league"]["personnelById"],
      draftOrderBySeason: (isDict((incoming.league as Dict | undefined)?.draftOrderBySeason) ? (incoming.league as Dict).draftOrderBySeason : {}) as GameState["league"]["draftOrderBySeason"],
      cap: {
        ...base.league.cap,
        ...(isDict((incoming.league as Dict | undefined)?.cap) ? ((incoming.league as Dict).cap as Dict) : {}),
      } as GameState["league"]["cap"],
    },
    roster: {
      ...base.roster,
      ...(isDict(incoming.roster) ? (incoming.roster as Dict) : {}),
      players: (isDict((incoming.roster as Dict | undefined)?.players) ? (incoming.roster as Dict).players : {}) as GameState["roster"]["players"],
    },
    freeAgency: {
      ...base.freeAgency,
      ...(isDict(incoming.freeAgency) ? (incoming.freeAgency as Dict) : {}),
      freeAgents: ensureArray((incoming.freeAgency as Dict | undefined)?.freeAgents, base.freeAgency.freeAgents),
    },
    cap: {
      ...base.cap,
      ...(isDict(incoming.cap) ? (incoming.cap as Dict) : {}),
      deadMoney: ensureArray((incoming.cap as Dict | undefined)?.deadMoney, base.cap.deadMoney),
    },
    tasks: ensureArray(incoming.tasks, base.tasks),
    inbox: ensureArray(incoming.inbox, base.inbox),
    checkpoints: ensureArray(incoming.checkpoints, base.checkpoints),
    completedGates: ensureArray<string>(incoming.completedGates, base.completedGates),
    offseasonPlan: isDict(incoming.offseasonPlan) ? (incoming.offseasonPlan as GameState["offseasonPlan"]) : base.offseasonPlan,
  };

  const fallbackFranchiseId = resolveFallbackFranchiseId(repaired);
  repaired.franchise = {
    ugfTeamKey: repaired.franchise?.ugfTeamKey || fallbackFranchiseId,
    excelTeamKey: repaired.franchise?.excelTeamKey || fallbackFranchiseId,
  };

  return repaired;
}

function validateMigratedSave(save: SaveData): boolean {
  return Boolean(save?.version === 1 && save?.meta?.schemaVersion === SAVE_SCHEMA_VERSION && save?.gameState?.franchise);
}

export function migrateSave(input: unknown): SaveData {
  if (!isDict(input)) {
    throw new Error("save payload must be an object");
  }

  const raw = input as Dict;
  const rawMeta = isDict(raw.meta) ? raw.meta : {};
  const initialSchema = Number(rawMeta.schemaVersion ?? 0);

  const migrated: Dict = { ...raw };
  if (initialSchema < 1) {
    migrated.meta = { ...rawMeta, schemaVersion: 1 };
  }

  const repairedGameState = repairGameState(migrated.gameState);

  const next: SaveData = {
    ...(migrated as SaveData),
    version: 1,
    meta: { ...(isDict(migrated.meta) ? migrated.meta : {}), schemaVersion: SAVE_SCHEMA_VERSION },
    gameState: repairedGameState,
  };

  if (!validateMigratedSave(next)) {
    throw new Error("migrated save failed validation");
  }

  return next;
}
