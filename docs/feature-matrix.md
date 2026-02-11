# Feature Verification Matrix (UGF)

Audit date: 2026-02-11  
Scope: repository code audit only (no feature implementation in this run).

## Source feature list audited
This matrix audits the requested **Phase 1–9 feature bullets** and the MVV-critical loop bullets from the prompt.

---

## Matrix

Legend: ✅ Implemented · ⚠️ Partial · ❌ Missing

### Phase 1 — New Save Initialization

1. **Character creation (name, age, hometown)** — ⚠️ Partial  
   - Evidence: UI supports name + hometown (`CreateCoachScreen`) and stores opening fields via `SET_COACH_NAME`/`SET_HOMETOWN` in runtime reducer. Age is not user-editable in creation UI; `GameState.coach.age` defaults to 35 and is persisted at offer accept time.  
   - Files/functions/call sites: `src/ui/screens/StartFlowScreens.tsx` (`CreateCoachScreen`), `src/ui/runtime.ts` (`case "SET_COACH_NAME"`, `case "SET_HOMETOWN"`, `case "ACCEPT_OFFER"`), `src/engine/reducer.ts` (`createNewGameState`).  
   - UI trigger path: Start → Start New Career → Create Coach form.  
   - Save-state fields read/write: writes `ui.opening.coachName`, `ui.opening.hometownId/hometownLabel/hometownTeamKey`, then `gameState.coach.name/age/hometown/hometownId/hometownLabel/hometownTeamKey`.

2. **Background selection (OC → HC, DC → HC, etc.)** — ⚠️ Partial  
   - Evidence: background choice exists (`CoachBackgroundScreen`) and writes `ui.opening.background`; accepted offer maps to `gameState.coach.backgroundKey`. But available options are generic labels, not the full requested path taxonomy.  
   - Plan: add canonical background enum and mapping UI labels to explicit career-path keys.  
   - Likely files: `src/ui/screens/StartFlowScreens.tsx`, `src/ui/runtime.ts`, `src/engine/gameState.ts`.  
   - Acceptance test: create saves selecting each canonical background; verify persisted `backgroundKey` values and downstream modifiers.

3. **Unified character schema initialization (user created as persistent character)** — ❌ Missing  
   - Plan: introduce shared `Character` base type used by player/coach/GM/owner entries and persist user as character row in league container.  
   - Likely files: `src/engine/gameState.ts`, `src/data/leagueDb/index.ts`, `src/ui/runtime.ts`.  
   - Acceptance test: start save, inspect serialized save and verify user exists in unified character registry.

4. **League seed initialization (deterministic RNG)** — ✅ Implemented  
   - Evidence: deterministic RNG primitive in `mulberry32`; save creation includes `seed`; schedule/game sim and deterministic coordinator metadata consume seeded hashing.  
   - Files/functions/call sites: `src/services/rng.ts` (`mulberry32`), `src/ui/dispatch/dispatch.ts` (`ensureSchedule`, `PLAY_WEEK`, `RUN_SNAP`), `src/services/schedule/generateSchedule.ts`.  
   - UI trigger path: start/load save → season/draft/sim actions rely on saved seed.  
   - Save-state fields read/write: reads `save.seed`; writes derived schedule/live game results based on deterministic seed.

5. **Coaching reputation baseline** — ✅ Implemented  
   - Evidence: baseline rep set to 50 in new game state and opening interview flow starts owner/gm/risk at baseline 50.  
   - Files: `src/engine/reducer.ts` (`createNewGameState`), `src/ui/runtime.ts` (`RUN_INTERVIEWS`, `ACCEPT_OFFER`).  
   - UI path: Start flow → interviews/offer.  
   - Save fields: `gameState.coach.reputation`; `ui.opening.interviewResults[*].ownerOpinion/gmOpinion/risk`.

6. **Personality baseline assignment** — ⚠️ Partial  
   - Evidence: persisted `coach.personalityBaseline` exists with default `Balanced`, but no creation-time selection UI/logic.  
   - Plan: add personality choice in coach creation and wire modifier usage.  
   - Files: `src/engine/gameState.ts`, `src/engine/reducer.ts`, `src/ui/screens/StartFlowScreens.tsx`, `src/ui/runtime.ts`.  
   - Acceptance test: pick personality in creation; verify save and interview/staff modifiers use it.

7. **Three-team interview generation (bottom/mid/top + hometown guaranteed inclusion)** — ✅ Implemented  
   - Evidence: `generateInterviewInvites` builds tiered pools (`REBUILD/FRINGE/CONTENDER`), preselects hometown team, fills to exactly 3 invites while ensuring tier representation where possible.  
   - Files/functions: `src/ui/runtime.ts` (`generateInterviewInvites`, `rankTeamsByOverall`, `pickFirstAvailable`), `src/data/hometownToTeam.ts`.  
   - UI path: Coach Background → Continue to Invitations (`RUN_INTERVIEWS`).  
   - Save fields: writes `ui.opening.interviewInvites[]` with `franchiseId/tier/overall/summaryLine`.

8. **Owner personality generation (patience, spending, interference)** — ⚠️ Partial  
   - Evidence: owner profiles/traits exist and influence interview deltas; but full generation from seed and full triad modeling not complete.  
   - Plan: generate owner personality vectors per franchise at save init and persist in save.  
   - Files: `src/data/owners.ts`, `src/data/ownerProfiles.ts`, `src/engine/interviews.ts`, `src/ui/runtime.ts`.  
   - Acceptance test: new save produces deterministic owner attributes and they impact expectations/contracts.

9. **GM personality & bias generation (RAS/speed/youth/etc.)** — ⚠️ Partial  
   - Evidence: `deriveGmProfile` is used during offer acceptance setup; no full bias model connected to draft/FA decision engines.  
   - Plan: extend GM profile schema with explicit bias fields and consume in draft/FA/trade scoring.  
   - Files: `src/data/gmDerivation.ts`, `src/services/draft.ts`, `src/services/trade.ts`, `src/ui/runtime.ts`.  
   - Acceptance test: same seed reproduces GM bias values; CPU decisions shift by configured biases.

10. **Interview question pool (owner + GM)** — ✅ Implemented  
   - Evidence: question banks and team scripts loaded and used by interview flow; answer deltas apply owner/GM/risk effects.  
   - Files: `src/data/interviewBank.ts`, `src/data/interviewScripts.ts`, `src/ui/runtime.ts` (`OPENING_ANSWER_INTERVIEW`), `src/ui/screens/StartFlowScreens.tsx` (`OpeningInterviewScreen`).  
   - UI path: Interviews → select invite → answer questions.  
   - Save fields: reads/writes `ui.opening.interviewResults[*].answers/ownerOpinion/gmOpinion/risk/lastToneFeedback/completed`.

11. **Offer guarantee logic (at least one offer always extended)** — ✅ Implemented  
   - Evidence: offer generation clamps count with `Math.max(1, ...)` and fallback path `generateOpeningOffersWithFallback` used on Offers route and interview completion.  
   - Files: `src/ui/runtime.ts` (`generateOffersFromInterviews`, `generateOpeningOffersWithFallback`, `NAVIGATE` to Offers, `OPENING_ANSWER_INTERVIEW`).  
   - UI path: finish all interviews → Offers screen.  
   - Save fields: writes `ui.opening.offers[]`, `ui.opening.lastOfferError`.

12. **Media narrative seed / owner expectation tier / initial hot seat / team difficulty classification** — ⚠️ Partial (placeholder only)  
   - Evidence: Hub displays placeholder owner mood/hot-seat text; tier labels exist in invite summaries; no persistent media/hot-seat systems.  
   - Plan: add structured `narrative`, `ownerExpectations`, `hotSeat`, `difficulty` objects in save and update from weekly outcomes.  
   - Likely files: `src/engine/gameState.ts`, `src/ui/runtime.ts`, `src/ui/screens/HubScreen.tsx`, `src/services/owner.ts`.  
   - Acceptance test: simulate weeks; verify values change and drive job security text/events.

### Phase 2 — Staff Building

13. **Hire OC/DC/ST Coordinator** — ✅ Implemented  
   - Evidence: dedicated hiring screen and persisted assignments through `HIRE_COACH` reducer path; finalize requires all three selected.  
   - Files: `src/ui/screens/StartFlowScreens.tsx` (`HireCoordinatorsScreen`), `src/ui/runtime.ts` (`SET_COORDINATOR_CHOICE`, `FINALIZE_NEW_SAVE`), `src/engine/reducer.ts` (`HIRE_COACH`).  
   - UI path: Offers → Accept → Hire Coordinators → Finalize.  
   - Save fields: writes `ui.opening.coordinatorChoices`; `gameState.staff.assignments`, `staff.budgetUsed`.

14. **View coordinator scheme/install difficulty/personality/ego/development skill** — ⚠️ Partial  
   - Evidence: coordinator cards show scheme/style/fit/salary/years via deterministic metadata; no explicit ego/install difficulty/development ratings.  
   - Plan: extend candidate metadata schema and UI tags.  
   - Files: `src/ui/helpers/deterministic.ts`, `src/ui/screens/StartFlowScreens.tsx`, `src/services/staffMarket.ts`.  
   - Acceptance test: candidate detail exposes all requested attributes and affects hiring outcomes.

15. **Delegation system initialization (Offense/Defense/Game Mgmt)** — ⚠️ Partial  
   - Evidence: `career.control` exists for offense/defense/specialTeams (scheme/assistants authority/locks). No explicit game-management axis and no dedicated setup screen.  
   - Plan: add game-management control axis + UI settings screen + runtime enforcement.  
   - Files: `src/engine/gameState.ts`, `src/engine/reducer.ts`, `src/ui/screens/StartFlowScreens.tsx`, `src/ui/runtime.ts`.  
   - Acceptance test: toggle delegation values pre-season; verify playcalling/clock authority follows setting.

16. **Assistant hiring (manual or delegated)** — ⚠️ Partial  
   - Evidence: staff market routes exist (`HireMarket`, `CandidateDetail`, `TRY_HIRE/CONFIRM_HIRE`) with constraints; no explicit delegated auto-hiring policy flow.  
   - Plan: add “delegate assistants to coordinator/GM” automation action.  
   - Files: `src/ui/screens/HireMarketScreen.tsx`, `src/ui/runtime.ts`, `src/services/staffMarket.ts`.  
   - Acceptance test: enable delegation; advance day; verify vacancies auto-filled.

17. **Staff tension meter initialization / staff trust baseline / install efficiency modifiers / coaching tree tracking / carousel pool tracking** — ❌ Missing  
   - Plan: introduce persistent staff-relationship model and coaching-tree identity links in save; compute tension/trust each week; maintain league-wide carousel state.  
   - Files: `src/engine/gameState.ts`, `src/services/staff.ts`, `src/services/staffEffects.ts`, `src/ui/screens/StaffTreeScreen.tsx`.  
   - Acceptance test: hire conflicting personalities and observe tension meter/trust deltas; verify carousel history across seasons.

### Phase 3 — January Offseason

18. **Weekly Hub (calendar-driven UI)** — ✅ Implemented (January scope)  
   - Evidence: Hub displays January day labels, week/day index, tasks and advance action.  
   - Files: `src/ui/screens/HubScreen.tsx`, `src/engine/calendar.ts`, `src/ui/runtime.ts` (`ADVANCE_WEEK`).  
   - UI path: Finalize New Save → Hub.  
   - Save fields: reads/writes `gameState.time.week/dayIndex/label`, `gameState.tasks`, `checkpoints`.

19. **Front Office view (GM/AGM/scouting directors)** — ❌ Missing  
   - Plan: add dedicated front-office screen and data model for FO staff roles.  
   - Files: `src/ui/routes.ts`, `src/ui/screens/*`, `src/engine/gameState.ts`.  
   - Acceptance test: open Front Office tab and inspect role cards + ratings.

20. **Staff meeting system** — ⚠️ Partial  
   - Evidence: data action `SUBMIT_STAFF_MEETING` and offseason plan persistence exist; `StaffMeetingScreen` currently says disabled.  
   - Plan: wire actual form UI to submit priorities and route from Hub task.  
   - Files: `src/ui/screens/StartFlowScreens.tsx`, `src/ui/runtime.ts`, `src/engine/actions.ts`.  
   - Acceptance test: complete staff meeting in UI and verify `gameState.offseasonPlan` set + task completed.

21. **Roster review interface** — ✅ Implemented (basic)  
22. **Depth chart + role assignment** — ⚠️ Partial (auto depth chart utilities exist; rich role assignment UI missing)  
23. **Contract review system (expiring deals)** — ✅ Implemented (Hub contracts tab + roster contract rows).  
24. **GM-only trade authority (until REP threshold)** — ❌ Missing (trade system exists but no REP gate).  
25. **Draft class generation + fog-of-war** — ⚠️ Partial (draft state init and scouting uncertainty exist, but full offseason loop UI incomplete).  
26. **Legendary prospect injection (first user draft guarantee)** — ❌ Missing.  
27. **Trait + RAS generation** — ⚠️ Partial (draft dataset includes trait/RAS-like columns; no complete reveal pipeline).  
28. **Rarity caps & archetype locking** — ❌ Missing.

29. **Secondary scouting features (all-star/private interviews/medical/combine media frenzy/GM bias amplification/budget/scheme fit)** — ❌ Missing  
   - Minimal plan: add combine/interview week state machine and per-prospect reveal flags tied to scouting budget allocation model.  
   - Likely files: `src/services/scouting.ts`, `src/services/draftDiscovery.ts`, `src/ui/screens/HubScreen.tsx`, `src/engine/tasks.ts`.  
   - Acceptance test: run January→combine flow; verify reveal deltas and budget effects.

### Phase 4 — Free Agency

30. **Wave 1 market + time-based offer progression + offer/counter flow** — ❌ Missing  
31. **Intel reliability by REP** — ❌ Missing  
32. **GM negotiation execution layer** — ❌ Missing  
33. **Cap enforcement system** — ✅ Implemented (signing blocked if payroll + salary exceeds cap; cap summaries persisted).  
34. **Contract philosophy bias / tampering risk / choice scoring engine** — ❌ Missing  
35. **Wave2/Wave3/PS/agent relationships/player-interest logic** — ❌ Missing

   Minimal implementation plan for #30-35:  
   - Add FA phase clock + wave state and contract offer entities (status: submitted/counter/accepted/declined).  
   - Score destination choice per player with money/role/team trajectory and rumor confidence by rep.  
   - Persist negotiation threads and enforce tampering penalties.  
   - Files: `src/engine/gameState.ts`, `src/ui/screens/FreeAgencyScreen.tsx`, `src/ui/runtime.ts`, `src/services/contracts.ts`, `src/services/trade.ts`.
   - Acceptance test: start FA week, submit offer, simulate hours, receive counter, accept, verify cap + roster + logs.

### Phase 5 — Pre-Draft & Draft

36. **30 in-person visits visible to CPU** — ❌ Missing  
37. **Trade-up psychology system** — ❌ Missing  
38. **CPU draft philosophy identity** — ⚠️ Partial (team profiles/need adjustments drive picks; explicit philosophy identities limited)  
39. **GM incoming trade offer system** — ⚠️ Partial (inbound draft offers functions exist in trade service)  
40. **User request trade exploration** — ⚠️ Partial (trade hub/thread systems exist in dispatch architecture; not in current route map UI)  
41. **Pick timer (pause allowed)** — ❌ Missing in active UI route stack  
42. **Assistant coach input during draft** — ❌ Missing  
43. **Media pick reaction system** — ⚠️ Partial (`draftNarratives` + draft beat generation exist)  
44. **RAS+traits staged reveal** — ❌ Missing  
45. **Legendary prospect rarity tiers** — ❌ Missing  
46. **Draft board reaction events / post-draft fallout** — ⚠️ Partial (`computeDraftBeats`, class grades, narrative helpers)  
47. **Historical draft memory (“we passed on him”)** — ❌ Missing  
48. **UDFA/camp tryout/late-wave FA fill** — ❌ Missing

Minimal plan (#36-48): build explicit Draft Room route in current runtime, event queue, and persistent historical draft ledger. Files: `src/ui/routes.ts`, `src/ui/screens/*Draft*`, `src/services/draft.ts`, `src/services/draftNarratives.ts`, `src/engine/gameState.ts`.
Acceptance: execute full draft day with timer, trades, CPU reactions, post-draft recap, and persisted memory entries.

### Phase 6 — Training Camp & Preseason

49. **Install load + WIB + module costs + fatigue + practice intensity** — ❌ Missing  
50. **Position coach efficiency modifiers** — ❌ Missing  
51. **Depth chart competition logic** — ⚠️ Partial (depth chart auto-build utilities exist; no competition event system)  
52. **Preseason delegation/full-play option** — ❌ Missing  
53. **Simplification thresholds** — ❌ Missing  
54. **Rookie acclimation/welcome moments/dev arcs/cutdown to 53 + PS** — ❌ Missing

### Phase 7 — Regular Season

55. **True NFL bye weeks (5–14)** — ✅ Implemented (schedule generator assigns byes 5..14).  
56. **Weekly Hub cadence Sun–Sat** — ⚠️ Partial (January hub exists; full season weekly UX spine incomplete in active route map).  
57. **Full clock model** — ⚠️ Partial (quarter/clockSec/down-distance modeled in snap sim; no full NFL timing ruleset).  
58. **Delegation per drive + live takeover** — ⚠️ Partial (liveGame has `controlOffense/controlDefense` flags and fallback playcalling).  
59. **Playcalling grammar (Personnel→Formation→Concept→Tags)** — ⚠️ Partial (core40 strings include grammar-like tokens, no full parser UI).  
60. **Install simplification tiers / usage decay / opponent scouting memory / fatigue-complexity interaction** — ❌ Missing  
61. **Physics-based collision resolver** — ❌ Missing (probabilistic resolver only).  
62. **Gamebreaker override logic** — ❌ Missing  
63. **“Why it failed” breakdown toggle** — ❌ Missing  
64. **Assistant suggestion prompts** — ❌ Missing  
65. **Postgame media + trust shifts + locker room factions + narrative shifts + reinjury decisions + hot seat updates** — ❌ Missing

### Phase 8 — League Continuity & Career Systems

66. **Unified character schema (player/coach/GM/owner)** — ❌ Missing  
67. **Persistent bios (draft/stats/awards/teams)** — ⚠️ Partial (roster + rookie rights + basic league players persist; full bios not present)  
68. **CPU staff hiring/firing + carousel** — ⚠️ Partial (`simulateCoachingCarousel` and staff model exist but not fully integrated lifecycle UI)  
69. **Ownership transitions** — ❌ Missing  
70. **Reputation tracking (league + role)** — ⚠️ Partial (coach reputation field exists; no full multi-role reputation engine)  
71. **Historical memory engine** — ❌ Missing  
72. **Award system (all listed awards) + Hall of Fame** — ❌ Missing  
73. **Ring of Iron / legacy media refs / fired→coord arc / post-firing interviews** — ❌ Missing

### Phase 9 — Long-Term Balance

74. **Age regression / career arcs / peak plateau / decline acceleration** — ❌ Missing  
75. **Contract pressure for drafted stars** — ❌ Missing  
76. **Draft philosophy identity (long-term)** — ⚠️ Partial (some draft heuristics exist; limited identity persistence)  
77. **Trade anti-cheese / pick-hoarding prevention / salary dump friction** — ❌ Missing  
78. **Compensatory structure** — ❌ Missing  
79. **Era tuning / league trends over decades / award weighting in Hall logic** — ❌ Missing

---

## MVV blockers (Top 10)
1. No complete **offseason-to-draft-to-camp-to-regular-season single route spine** in active UI runtime.  
2. Free agency lacks negotiation lifecycle (offer/counter/time waves).  
3. Draft day room (timer/trade UX/reactions) missing in active route map.  
4. Training camp install/fatigue/simplification systems absent.  
5. Postgame consequences (media/trust/hot seat) absent.  
6. Unified character schema absent (coach/GM/owner/player split models).  
7. Historical memory engine absent (critical for long-term consequences).  
8. Awards/Hall systems absent (season endpoint consequence loop missing).  
9. GM authority and REP gating not enforced across trading/roster control.  
10. Staff trust/tension systems not wired to delegation outcomes.

## Totals
- ✅ Implemented: **10**
- ⚠️ Partial: **19**
- ❌ Missing: **50**


---

## Audit Corrections (2026-02-11 addendum)

### 1) Staff meeting gate wording correction
- Prior wording that treated title-based task completion as merely “stale” was incomplete.
- Correct framing: **dual completion pathways existed** (`offseasonPlan`-based completion and task-completion-based completion), which created inconsistent completion semantics.
- Required direction: remove the title-based pathway or convert any fallback completion logic to an ID-based task contract with a single canonical gate source.
- Current gate behavior has now been tightened to canonical `offseasonPlan` completion only in runtime gating code.

### 2) Canonical data drift appendix is now enumerated from `rg`
The audit artifact now includes explicit command output for current import surfaces.

- `rg -n "from \"@/data/generatedData\"|generatedData" src`
  - `src/bundle/loadBundle.ts:4`
  - `src/ui/data/teamKeyResolver.ts:1`
  - `src/ui/data/franchises.ts:1`
  - `src/ui/runtime.ts:17`
  - `src/ui/screens/StartFlowScreens.tsx:2`
  - `src/services/staffMarket.ts:1`
  - `src/services/staffHiring.ts:1`

- `rg -n "@/data/generated/" src`
  - `src/data/generatedData.ts:1`
  - `src/data/generatedData.ts:2`
  - `src/data/generatedData.ts:3`
  - `src/services/draftDiscovery.ts:1`
  - `src/engine/scouting.ts:1`

- `rg -n "rostersPublic" src`
  - `src/data/rostersPublic.ts:37`
  - `src/data/rostersPublic.ts:56`

- Legacy table-registry accessor sweep (`rg -n "from \"@/data/TableRegistry\"|getTable\(" src`)
  - Active import + accessor usage spans `src/ui/dispatch/dispatch.ts` and service modules including `draft.ts`, `trade.ts`, `contracts.ts`, `scouting.ts`, `staff.ts`, `gameData.ts`, `owner.ts`, `pff.ts`, `draftGrades.ts`, `draftNarratives.ts`, `draftMutations.ts`, and depth-chart services.

### 3) Save/hydrate precedence recommendation sharpened
- Risk is more than drift: the merge rule allows **any non-empty save players array** to dominate canonical league field precedence.
- Recommended guard rule for next implementation step:
  - If `save.meta.version < X` **or** `save.world.lastLeagueDbHash !== currentLeagueDbHash`, rebuild league state from canonical.
  - Preserve only user-controlled deltas (transactions, signings, injuries, history, progression flags), not raw canonical-owned roster/contracts blobs.

### 4) Salary cap utility status correction
- `src/services/cap.ts` is present but currently **unused by runtime imports** in `src`.
- Therefore this module should be described as “present but currently unused,” not as active cap enforcement logic.
- Active cap checks are performed through contract/trade flow paths in other services.

### 5) Verification Matrix Delta evidence requirement
- Any future “Verification Matrix Delta” section should treat each claim as evidence-backed only when it cites concrete file + function location.
- If claim is inferred or architectural intent, mark it explicitly as inferred and separate from verified implementation state.

## Revised “Next 3 Tasks”

1. **Canonicalize read paths**
   - Include `src/data/generatedData.ts` in scope (deprecate or convert to projection wrapper over canonical `leagueDb`).
   - Acceptance criterion: **No active runtime imports of `generatedData` or `src/data/generated/*` for canonical-owned entities.**

2. **Hydrate merge hardening**
   - Implement version/hash-aware canonical rebuild strategy.
   - Add a failure-mode acceptance test: load a save carrying stale/forbidden team IDs and verify resolver + hydration produce only CITY_TEAM IDs and validation passes.

3. **Legacy decommission (flagged first)**
   - Move legacy registry pathways behind an opt-in flag before removal.
   - Practical options: exclude from tsconfig/build, or move to `/legacy/` with no active imports, preserving history without accidental runtime reactivation.
