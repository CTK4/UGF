# UGF Coach RPG Integration

## Bundle assets
Style/data bundles are loaded from:
- `src/assets/ugf_ui_export/style/styleSheets.json`
- `src/assets/ugf_ui_export/style/designTokens.json`
- `src/assets/ugf_ui_export/data/manifest.json`
- `src/assets/ugf_ui_export/data/*.json`

`src/bundle/loadBundle.ts` performs lazy loading + in-session caching.

## Routes/actions structure
- `src/ui/routes.ts` defines the canonical `RouteKey`, `Route`, and `RouteMap`.
- `src/ui/dispatch/actions.ts` defines all UI action creators.
- `src/ui/dispatch/dispatch.ts` is the single dispatcher that validates, applies deterministic services, updates `UIState`, persists, and routes.
- `src/ui/runtime.ts` owns persistence, checksum stamping, and app boot.

## Adding screens without dead ends
1. Add a typed route variant to `Route` and key in `RouteKey`.
2. Add the screen component and register it in `RouteMap`.
3. Add action creator(s) in `actions.ts`.
4. Implement dispatch branch in `dispatch.ts` so every button uses `ui.dispatch(...)`.
5. Ensure screen accepts `{ ui }` and invokes only dispatch/navigation/selectors.


## UI architecture guardrails

- Screens under `src/ui/screens/*` must receive `{ ui }` only.
- Screens may only call `ui.selectors.*` (read) and `ui.dispatch(...)` (write).
- Run `scripts/guard-ui-screens-no-domain-imports.sh` to enforce this.
- Add new derived reads to `src/ui/selectors/index.ts`.


## Save schema + migrations

- UI save is versioned via `save.schemaVersion`.
- Boot loads legacy saves and migrates them in `src/ui/runtime.ts` (`migrateUiSave`).
- Checksum verification is performed *before* migration for legacy saves to avoid false mismatches.

## Route history

- Navigation uses a push/replace history stack (`state.history`).
- `BACK` pops the stack and never dead-ends.


## Trades

- Draft-day and offseason trades use deterministic TVU evaluation in `src/services/trade.ts`.
- Offers are stored in `save.tradeInbox` and applied via dispatcher actions.
- Draft pick swaps mutate `save.draft.order` ownership; player trades set `save.playerTeamOverride`.


### Trade threads & reputation

- User offers open a deterministic negotiation thread stored in `save.tradeThreads`.
- CPU may counter up to 2 times; user lowballing increases `tradeReputation.lowballStrikes` which raises acceptance requirements.
- Pick ownership persists via `save.pickInventory` and is mutated by `applyTrade()`.


### CPU↔CPU season trades

- Weekly league trades are simulated in `simulateCpuCpuSeasonTrades()` and triggered from `ADVANCE_WEEK`.

### Draft ladder offers

- TradeHub can generate a deterministic A/B/C/D ladder for trading up in the draft.


### Trade block

- User trade block stored in `save.tradeBlock`.
- `SHOP_TRADE_BLOCK` generates inbound season offers using deterministic needs/value matching.
- Pending offers appear in Phone (trade:<offerId>) and in TradeHub inbox.


### League trade activity

- `save.leagueActivity.tradeFrequency` (0..1) scales max CPU↔CPU trades/week deterministically.

### Trade block player swaps

- Trade block shopping can now generate player-for-player swaps in addition to pick bundles.


### Fairness meter

- TradeHub can dispatch `PREVIEW_TRADE` to compute NetGain vs Threshold for both sides using the same TVU evaluator.
- Preview is stored in `ui.tradePreview` (UIState only; not persisted).


- Preview auto-refreshes on offer changes and shows a qualitative label (Fair/Slight overpay/Overpay/Close/Unlikely).

### Draft league mutations

- `MAKE_PICK` / `AUTO_PICK` / CPU sim picks call `applyDraftPickToLeague()`.
- This creates a rookie roster row in `save.rosterAdditions`, assigns rookie rights, and applies cap deltas.
- Draft picks now generate phone/news beats via `draft.news`.

### Contracts realism (rules)

- `buildPlayerContract()` builds a year-by-year cap schedule from Roster table contract fields.
- Team cap summary uses Team Summary base values plus `save.capAdjustments` deltas from trades and draft rookies.
- Trades enforce a hard cap floor and apply cap deltas when players move.


### Draft roster badges + class grades

- Drafted rookies include `DraftTier` + `College` fields in `save.rosterAdditions`.
- Team Roster UI displays these badges inline.
- When draft completes, `draft.classGrades` is computed and exposed via Phone thread `draft:grades`.

### Staff slots + free agent pool

- Team staff now includes position-coach slots: QB Coach, WR/RB Coach, OL, DL, LB, DB, ST.
- A bundled free agent pool is loaded from `src/services/staffFreeAgents.ts`.
- Elite-tier coaches require higher `save.coachReputation` and higher staff budget cost.

### ContractV1 cap rules

- League cap model defaults: $240M in 2026, deterministic 4.5% growth yearly.
- ContractV1 fields: base[], rosterBonus[], signingBonus prorated up to 5 years, guaranteedYears.
- Cut costs shown Pre–June 1 and Post–June 1 (split proration).
- Trade rule: signing bonus proration stays with original team (dead cap); acquiring team pays base+roster only.

### Draft need pressure

- CPU draft scoring multiplies prospect grade by a need-pressure factor derived from current roster position counts.
- QB has an additional early-round guard (prevents QB in consecutive early rounds).

### Draft recap screen

- New route `DraftRecap` provides sortable class grades and a pick log (steals/reaches).

### Relocation teams

- Pre-approved relocation branding sets live in `src/data/relocationTeams.ts` as `RELOCATION_TEAMS`.
- Exposed via `ui.selectors.relocationTeams()` for future relocation UI/flows.

### Relocation Hub UI

- New screen `RelocationHub` previews `RELOCATION_TEAMS` with searchable brand details.
- Accessible from Hub.

### Restructure phone logging

- `RESTRUCTURE_PLAYER` posts a deterministic Phone inbox message summarizing the move and cap-hit change.

### Draft → league mutation loop

- Every pick now:
  - adds playerId to `save.rightsOwned[teamId]`
  - reduces positional need via `save.teamNeedAdjustments[teamId][POS] -= 1`
  - emits narrative beats into `save.draft.news` (STEAL/REACH/RUN/SLIDE)
- Team Roster displays a Rights Owned section.
- Phone includes a Draft News thread (`draft:news`) sourced from `save.draft.news`.

### Owner confidence + enforcement

- Save fields:
  - `save.ownerConfidence[teamId]` (0..100)
  - `save.week`
- Action `ADVANCE_WEEK` increments week and updates owner confidence deterministically using:
  - cap stress (negative cap space)
  - staff budget health
  - early draft grade bump
- Hiring enforcement:
  - Elite coaches require reputation + owner confidence >= 40
- Trade enforcement:
  - cap-space guardrail remains; additional owner veto for cap-negative deals when confidence < 50
- Hub + Team Summary display owner confidence and week.

### Owner Dashboard

- New route `OwnerDashboard` shows owner confidence + projected next-week drivers (cap stress, staff budget, early draft bump).
- Accessible from Hub.

### Cap discipline enforcement

- Trades cannot be accepted if they would put the receiving team over the cap (cap space below 0).

### Staff quality hooks

- `computeTeamStaffEffects(save.staff, teamId)` produces:
  - offense/defense rating bonuses
  - position-group dev rates
- `ADVANCE_WEEK` awards `save.playerDevState (hidden)[playerId] += devRate` for players on each team.
- Team Summary displays staff impact and dev rates.
- Team Roster displays `Dev+` badge per player.

### Development doctrine (v1)

- Development is not an explicit upgrade system.
- Weekly progression is computed deterministically from:
  - position coach quality
  - team structural performance proxy (HC/OC/DC)
  - player work ethic + volatility traits (seeded from playerId)
- UI displays only derived OVR (no upgrade points).

### PFF-style grades (visible OVR)

- Hidden truth: `save.playerTalent[playerId]` (0..100).
- Visible OVR is performance: `save.playerPff[playerId].rolling` (EWMA of weekly PFF grade).
- Weekly grading occurs on `ADVANCE_WEEK` via `simulateWeeklyPff`:
  - talent + coaching + team performance proxy + deterministic week noise
- Team ratings derive from unit grades: `save.unitPff[teamId]`.

### Fog-of-war talent scouting

- Hidden truth: `save.playerTalent[playerId]`.
- User-visible scouting report: `save.scouting.reportsByTeam[userTeamId][playerId] = { est, sigma, seenWeeks }`.
- UI shows Talent as a range `est±sigma` with confidence `%`.
- Scouting updates on boot + each `ADVANCE_WEEK` for roster players.

### Scouting action

- UIAction: `SCOUT_PLAYER { playerId }`
- Cost: $0.5M from `save.staffBudgetM[userTeamId]`.
- Effect: shrinks scouting `sigma` faster for that player; creates/updates a `scouting` phone thread.
- Buttons exist on DraftBoard prospect cards and TeamRoster rows.

### ScoutingHub screen

- Route: `ScoutingHub`
- Lists all scouting reports for the user team.
- Provides sorting/search and `SCOUT_PLAYER` action.
