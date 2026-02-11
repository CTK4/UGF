A) Executive Summary
- Active app boot path is `main.tsx -> App -> createUIRuntime -> RouteMap`, and all rendered routes come from `src/ui/routes.ts`; this path does not call legacy `ui/dispatch/dispatch.ts` or `app/enginePortImpl.ts` (those remain in-repo but are not imported by boot/runtime). 
- Advance flow parity is explicitly guarded in runtime (`assertAdvanceRoutingInvariant`, `runBootAdvanceSelfCheck`) and shared blocker source is `getAdvanceBlocker` from engine gates. 
- Delegation setup gating is active and hard-blocks advance until `delegation.setupComplete` is true; `initialRoute` also routes loaded saves to `DelegationSetup` when incomplete.
- Staff meeting blocker is active via gate `GATE.STAFF_MEETING_DONE`; clearing currently happens by setting `offseasonPlan` (via `SUBMIT_STAFF_MEETING`), with a secondary task-completion branch that appears stale (`title === "Initial staff meeting"`).
- Canonical roster/cap hydrate path uses `ugf_leagueDb.json` via `leagueDb.ts` + `loadLeagueRosterForTeam`; however, multiple runtime features still depend on `generatedData`/generated JSON (team summary, franchise/personnel scaffolding, prospect labels/positions).
- Deterministic ID generation exists in `leagueDb.ts` and `rosterImport.ts` for missing player/personnel/contract IDs using stable FNV-like hashes.
- Contract resolution strategy is mixed: prefers explicit `contractId` when present, falls back to `(entityType=PLAYER, entityId)` lookup in roster paths; this is deterministic but not fully normalized across modules.
- Salary cap is set to 250,000,000 in canonical data and validated at runtime; hydrate/cap APIs propagate this end-to-end, but one growth-model utility (`services/cap.ts`) can compute non-250M future-year caps and is not currently wired to active runtime cap enforcement.
- Save format in active runtime is localStorage `ugf.save.v1` (`{version:1, gameState}`), with backward defaulting in reducer and post-load canonical hydration merge; merge precedence can preserve stale partial live league slices.
- DEV-only validation modal triggers at boot, finalize-new-save, and after successful advance; no equivalent non-DEV hard-fail path exists.

B) Active Runtime Map (entrypoints, state managers, routing, advance flow)
1. Entrypoints + state manager
- `src/main.tsx` renders `<App/>`.
- `App` asynchronously boots `createUIRuntime`, stores controller in local state, and renders current route component from `RouteMap`.
- `createUIRuntime` is the active UI state manager (internal mutable `state`, `dispatch`, selector helpers, debounced localStorage writes).

2. Routing chain
- `RouteMap` is the canonical route/component registry.
- Runtime `NAVIGATE` action switches `state.route`; App renders `RouteMap[state.route.key]` (or `MobileHubScreen` override when on Hub in narrow viewport / `?ui=mobile`).

3. Engine interaction chain
- Runtime dispatch calls `reduceGameState` actions (`LOAD_STATE`, `SET_COACH_PROFILE`, `ACCEPT_OFFER`, `HIRE_COACH`, `SET_OFFSEASON_PLAN`, etc.) and advance pipeline (`advanceDay`).
- Advance blockers are sourced through `getAdvanceBlocker` -> `validateBeatGates` (`COORDINATORS_HIRED`, `DELEGATION_SETUP_DONE`, `STAFF_MEETING_DONE`).

4. Competing/legacy architectures + reachability
- Legacy async dispatcher stack (`src/ui/dispatch/dispatch.ts` + `TableRegistry` + bundle tables) is present but unreachable from current boot path.
- Domain-E/phase-engine facade (`src/app/enginePortImpl.ts`, `src/phaseEngine/*`) is present but not imported by active App/runtime path.
- `domainE/persistence/createPersistencePort` is likewise unused by active runtime save flow (active path uses `domainE/persistence/localSave.ts`).

5. Advance flow confirmation
- Hub selector (`ui.selectors.canAdvance`) and advance handler parity are checked by `assertAdvanceRoutingInvariant` + `runBootAdvanceSelfCheck`.
- Blocked advance behavior: Hub shows blocker panel + CTA (`Go to Required Screen`) and runtime opens modal with same blocker route/message.
- Delegation setup gate: `initialRoute` sends loaded incomplete saves to `DelegationSetup`; `CONFIRM_DELEGATION_SETUP` sets `setupComplete=true` and routes to Hub.
- Staff meeting clearing: `SUBMIT_STAFF_MEETING` sets offseason plan and routes Hub (this satisfies gate); additional completion by title match (`Initial staff meeting`) appears stale.

C) Canonical Data Map (where each domain entity is sourced, and any violations)
1. Canonical source confirmation
- `src/data/ugf_leagueDb.json` contains canonical sheets: League, Conferences, Divisions, Teams, Personnel, Players, Contracts, DraftOrder, TeamFinances.
- `src/data/leagueDb.ts` is the read façade exposing teams/players/personnel/contracts/draft order/salary cap/current season.
- Hydration to runtime league state occurs via `loadLeagueRosterForTeam` (teams/players/contracts/personnel/draftOrder/capUsedByTeam).

2. `leagueDb.ts` behavior verification
- CITY_TEAM/team matching: `getTeamByKey` uses normalized comparison across `teamId`, `abbrev`, `name`.
- Deterministic IDs:
  - Player: `PLY_${stableHash(fullName:pos:teamId)}` when missing.
  - Contract: `CON_${stableHash(entityType:entityId:teamId)}` when missing.
  - Personnel: `PERS_${stableHash(fullName:role:teamId)}` when missing.
- Contract resolution strategy:
  - `getExpiringPlayers` uses `player.contractId` first, then entity key `PLAYER:playerId` fallback.
  - `rosterAdapter` mirrors this pattern (`contractId` preferred, then PLAYER entity map).
- Expiring/pending FA handling:
  - Expiring players identified by `contract.endSeason <= season` OR player status in `{PENDING_FREE_AGENT, FREE_AGENT}`.
  - Free agency pool includes explicit free agents, unresolved/roster-detached league players, and pending FA tagging via `needsResign`.

3. Remaining non-canonical reads (enumerated + categorized)
A) Still used in active runtime paths
- `src/data/generatedData.ts` (derived table facade) used by:
  - `src/ui/runtime.ts` (team summary metrics + interview ranking inputs).
  - `src/ui/data/franchises.ts` (team names/personnel scaffolding).
  - `src/ui/data/teamKeyResolver.ts` (team summary row resolution).
  - `src/ui/screens/StartFlowScreens.tsx` (personnel pool for hire coordinator UI).
- `src/data/generated/draftClass.json` used by:
  - `src/engine/scouting.ts` (scoutable positions + discovery outcomes).
  - `src/services/draftDiscovery.ts` (prospect labels shown in Hub watchlist).

B) Used by dead/unused legacy stack
- `src/ui/dispatch/dispatch.ts` + `src/bundle/loadBundle.ts` + `src/data/TableRegistry.ts` + many `src/services/*` table-registry utilities (draft/trade/contracts/staff/owner/etc.) are tied to the legacy dispatcher that is not imported by current runtime path.
- `src/services/staffMarket.ts` and `src/services/staffHiring.ts` (generatedData heavy) are not called by active runtime flow.
- `src/app/enginePortImpl.ts` / `src/phaseEngine/*` / `checkpointNowPort` are a separate architecture not wired into active App path.

C) Safe-to-delete vs needs-refactor recommendation
- Needs refactor (cannot delete yet):
  - `generatedData` consumers in active runtime (`ui/runtime`, `franchises`, `teamKeyResolver`, `StartFlowScreens`, scouting/draft label helpers).
- Candidate safe delete after import-graph cleanup:
  - Entire legacy dispatcher + bundle/table-registry graph if team confirms no alternate entrypoint exists.
  - `rostersPublic.ts` appears unused in current repo import graph.

4. Salary cap 250,000,000 end-to-end
- Source: League sheet (`salaryCap: 250000000`) and `getSalaryCap` fallback logic.
- Hydrate: `loadLeagueRosterForTeam` sets league cap from canonical/default.
- Runtime cap math: `engine/cap.ts`, `rosterAdapter`, free agency cap checks use hydrated cap values.
- Validation: `validateLeagueDb` enforces exact cap equals 250,000,000.

D) Save/Migration Review (merge precedence + risks)
1. Active save format
- Runtime save key: `ugf.save.v1` in localStorage.
- Shape: `{ version: 1, gameState }`.

2. Backward-compatible defaults
- `reduceGameState(LOAD_STATE)` overlays loaded state onto `createNewGameState()` and applies defaults for time, staff, delegation, roster, cap, league containers, checkpoints, etc.
- Missing character registries are generated post-load via `ensureCharacterRegistryState` if absent.

3. Canonical hydrate-on-load behavior
- `createUIRuntime` load path:
  1) load local save,
  2) `reduceGameState(...LOAD_STATE...)`,
  3) `hydrateLeagueFromCanonical(...)`,
  4) apply roster/cap and character registry normalization.
- Merge precedence in `hydrateLeagueFromCanonical`:
  - If live league has any players, spread order is `canonicalLeague` then `gameState.league` (live wins), then selective canonical fallback only for teams/contracts/personnel/draftOrder/cap maps when live maps are empty.

4. Risks
- Drift risk: partial live league slices can override canonical players/teamRosters even when stale or schema-shifted.
- Merge precedence risk: selective fallback does not normalize `playersById`/`teamRosters` consistency against canonical source.
- Partial hydration risk: cap salary cap uses numeric merge, but `capUsedByTeam` can remain stale if non-empty in save.
- Character determinism/persistence: deterministic generation exists, but regenerated only when registry absent; existing inconsistent registries remain trusted.

E) Validation/Invariants Review (current invariants + missing ones)
1. Currently enforced (`validateLeagueDb` + runtime asserts)
- teamRosters -> player existence + `player.teamKey` match.
- player.teamKey references known team.
- contract entity linkage for PLAYER/PERSONNEL entity types + team existence checks.
- personnel team existence.
- draft order team existence.
- salary cap exact match 250,000,000.
- DEV assertions/logging:
  - advance selector/handler parity,
  - route key validity for blocker CTAs,
  - city/team warning checks,
  - opening-flow synthetic self-check.

2. Missing invariants (recommended)
- Global uniqueness collisions for deterministic IDs (players/personnel/contracts) should hard-fail, not only implicitly overwrite maps.
- Contract uniqueness + linkage completeness:
  - enforce one active player contract per player,
  - enforce `contract.entityId` == canonical player/personnel id namespace and normalized `entityType`.
- teamRosters coverage/completeness:
  - every non-free-agent player must appear in exactly one roster,
  - no duplicate player IDs across multiple team rosters.
- Draft order completeness:
  - expected pick count per season/round,
  - no duplicate `(season, round, pick)`.
- Delegation + gate coherence:
  - guarantee staff meeting task identity used in submit-completion branch matches generated task titles/ids.

3. DEV-only modal triggers
- Boot: `runLeagueValidation` called during runtime init; modal shown if errors.
- Finalize: after `FINALIZE_NEW_SAVE`, validation runs and modal may open.
- Advance: after successful `ADVANCE_WEEK`, validation runs and modal may open.
- All are DEV-gated (`if (!import.meta.env.DEV) return null`).

F) Updated Verification Matrix Delta (what changed since last matrix)
Note: Prior matrix artifact is not present in repo; below delta is inferred from current post-merge code and inline guard/check additions.

- Advance selector/handler parity: ⚠️ -> ✅
  - Now explicitly asserted via `assertAdvanceRoutingInvariant` and synthetic `runBootAdvanceSelfCheck`.
- Blocker CTA routing from Hub/modal: ⚠️ -> ✅
  - Hub blocker panel + modal both route using blocker-provided route.
- Delegation setup gate wiring (route + blocker): ⚠️ -> ✅
  - `initialRoute` + gate resolution + confirm action are aligned.
- Staff meeting task clear path: ❌ -> ⚠️
  - Gate can be cleared via offseason plan submit, but stale title-based completion branch indicates residual mismatch debt.
- Canonical-only data sourcing: ❌ remains ❌
  - Active runtime still reads `generatedData` and generated draft class artifacts.
- Save migration safety: ⚠️ remains ⚠️
  - Good defaults exist, but merge precedence still allows stale live league fragments.
- Salary cap invariant enforcement: ⚠️ -> ✅
  - Canonical source, hydrate, cap logic, and validator all pin to 250,000,000.

Next 5 highest-leverage missing/partial items to unlock MVV loop
1) Replace active `generatedData` dependencies in runtime/franchise/team resolver with canonical `leagueDb` projections.
2) Normalize hydrate merge to canonicalize `playersById <-> teamRosters` and `capUsedByTeam` reconciliation.
3) Add strict invariant suite (duplicate IDs, roster uniqueness, draft order completeness).
4) Remove/disable dead dispatcher + phase engine entry surfaces to reduce accidental divergence.
5) Fix staff-meeting completion branch to match generated task IDs and add regression tests for gate clearing.

G) Top 10 Risks (ranked P0/P1/P2 with file references)
P0
1. Split architecture risk: active runtime bypasses Domain-E integrity persistence, while alternate engine stack persists separately; high drift/corruption confusion potential.
2. Canonical drift risk: active runtime still uses generated tables for key UX/ranking/team resolution, preventing true single-source-of-truth operation.
3. Hydration merge precedence can preserve stale `playersById/teamRosters/capUsedByTeam` from save over fresh canonical state.

P1
4. Staff meeting completion branch title mismatch (`Initial staff meeting`) likely dead path; could mask intended task bookkeeping.
5. Deterministic ID collision handling is absent (map overwrite risk).
6. Contract lookup strategy duplicated across modules; mismatches in entityType normalization may create subtle FA/roster inconsistencies.
7. Legacy dispatcher routes include route keys not in active RouteMap, increasing maintenance hazard if accidentally reintroduced.

P2
8. `services/cap.ts` growth model diverges from fixed-cap validation model (future integration risk).
9. DEV-only validator modal means production builds can continue with invalid league graph.
10. Unused `rostersPublic.ts` and legacy services inflate cognitive load and obscure active execution paths.

H) Next 3 Tasks (tight PR-sized scopes with file lists + acceptance tests)
Task 1 — Canonicalize active UI data reads
- Scope files: `src/ui/runtime.ts`, `src/ui/data/franchises.ts`, `src/ui/data/teamKeyResolver.ts`, `src/ui/screens/StartFlowScreens.tsx`, `src/data/leagueDb.ts` (helper projections).
- Goal: remove active `generatedData` imports from runtime path.
- Acceptance tests:
  1) New save flow works end-to-end without `generatedData` imports.
  2) Interviews/offers/team resolver/coordinator picker still render deterministic data.
  3) `npm run build` passes.

Task 2 — Harden load hydration merge + invariants
- Scope files: `src/ui/runtime.ts`, `src/services/validateLeagueDb.ts`, optional `src/services/rosterImport.ts`.
- Goal: reconcile `playersById/teamRosters/capUsedByTeam` deterministically on load; add strict invariant checks.
- Acceptance tests:
  1) Loading intentionally partial save recomputes consistent rosters and cap usage.
  2) Validator catches duplicate IDs and duplicate roster membership.
  3) Advance and Hub render without regression.

Task 3 — Decommission dead architecture safely
- Scope files: `src/ui/dispatch/*`, `src/bundle/loadBundle.ts`, `src/data/TableRegistry.ts`, `src/app/enginePortImpl.ts`, `src/phaseEngine/*` (or gate behind explicit feature flag).
- Goal: eliminate unreachable code paths or isolate behind explicit non-default entrypoint.
- Acceptance tests:
  1) Import graph confirms no stale legacy references from `main/App/runtime`.
  2) Build size/checks improve or remain stable.
  3) Documentation updated with single active runtime architecture.
