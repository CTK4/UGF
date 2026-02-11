# UGF Game Finish Plan

This document codifies the full game delivery order and an implementation-ready MVV path.

## Core Product Spine

Create identity → Build staff → Shape roster → Stress system → Compete weekly → Live with consequences → Leave a legacy.

---

## Phase Delivery Ladder (Priority Ordered)

### Phase 1 — New Save Initialization

**Highest priority**
- Character creation (name, age, hometown)
- Background selection (OC→HC, DC→HC, etc.)
- Unified character schema initialization
- Deterministic league seed init
- Coaching reputation baseline
- Personality baseline assignment
- Interview generation with 3-team minimum:
  - bottom-5 team
  - middle team
  - top-10 team (legend-retired opening)
  - hometown inclusion guarantee
- Owner personality generation (patience, spending, interference)
- GM personality + bias generation (RAS/speed/youth/etc.)
- Owner + GM interview question pools
- Offer guarantee logic (at least one offer)

**Secondary priority**
- Media narrative seed
- Owner expectation tier assignment
- Initial hot seat baseline
- Team difficulty label

### Phase 2 — Staff Building

**Highest priority**
- OC / DC / STC hiring
- Coordinator profile visibility:
  - scheme/playbook
  - install difficulty
  - personality + ego
  - development skill
- Delegation initialization (offense/defense/game management)
- Assistant hiring (manual/delegated)
- Staff tension meter initialization
- Coaching tree tracking

**Secondary priority**
- Staff trust baseline (user ↔ coordinators)
- Install efficiency modifiers
- Persistent coaching carousel pool tracking

### Phase 3 — January Offseason

**Highest priority**
- Weekly Hub calendar UI
- Front office view (GM/AGM/scouting)
- Staff meeting system
- Roster review + depth chart roles
- Contract review (expiring deals)
- GM-only trade authority gate until REP threshold
- Draft class generation with fog-of-war
- Legendary prospect injection in user draft #1
- Trait + RAS generation
- Rarity caps and archetype locks

**Secondary priority**
- College all-star week
- Private interviews
- Medical flags
- Combine week (RAS reveal, media frenzy, GM bias amplification)
- Scouting budget allocation
- Scheme fit projection layer

### Phase 4 — Free Agency

**Highest priority**
- Wave 1 market competition
- Time-based progression (1–4h ticks)
- Offer → Counter → Accept/Decline loop
- REP-based intel reliability
- GM negotiation execution layer
- Cap enforcement
- Contract philosophy bias
- Tampering risk
- FA decision scoring engine

**Secondary priority**
- Wave 2/3 market
- Practice squad signings
- Agent relationships
- Interest logic (location/contender/money/role)

### Phase 5 — Pre-Draft + Draft

**Highest priority**
- 30 visits with visible interest signaling
- Trade-up psychology
- CPU draft philosophy identity
- GM trade offers + user “explore trade” action
- Pick timer with pause
- Assistant input during draft
- Media pick reactions
- RAS/traits staged reveal
- Legendary prospect tiers
- Draft board reaction events
- Post-draft narrative fallout
- Historical memory (“we passed on him”)

**Secondary priority**
- UDFA battle
- Camp tryout offers
- Late FA fill

### Phase 6 — Camp + Preseason

**Highest priority**
- Install load system (offense + defense)
- Weekly Install Budget (WIB)
- Install cost per module
- Physical + cognitive fatigue
- Practice intensity control
- Position coach efficiency modifiers
- Depth chart competitions
- Preseason delegate/full-play toggle
- Simplification thresholds

**Secondary priority**
- Rookie acclimation moments
- Early dev arc triggers
- 53-man cutdown + practice squad

### Phase 7 — Regular Season

**Highest priority**
- True bye week structure (Weeks 5–14)
- Weekly Hub cadence (Sun–Sat)
- Full clock model
- Per-drive delegation toggles
- Live takeover
- Playcall grammar: Personnel → Formation → Concept → Tags
- Install simplification tiers
- Usage decay
- Opponent scouting memory
- Fatigue × complexity interaction
- Physics collision resolver
- Gamebreaker logic (top-5% override moments)
- “Why it failed” breakdown
- Assistant suggestion prompts

**Secondary priority**
- Press conferences
- Staff trust changes from delegation
- Locker room factions
- Narrative shifts
- Reinjury decisions
- Owner hot seat updates

### Phase 8 — League Continuity

**Highest priority**
- Unified character schema for player/coach/GM/owner
- Persistent bios (draft/stats/awards/teams)
- CPU staff hire/fire
- Coaching carousel
- Ownership transitions
- Reputation tracking (league + role)
- Historical memory engine
- Awards:
  - Iron Crown
  - Founders’ Diadem
  - Rowan Trophy
  - Iron Standard (regular MVP)
  - Coach of Year
  - Executive of Year
  - All-Pro
- Hall of Fame tracking

**Secondary priority**
- Franchise Ring of Iron
- Legacy references in media
- Career arc branching after firing
- Job interviews post-firing

### Phase 9 — Long-Term Balance

**Highest priority**
- Age regression curves
- Position-based career arcs
- Peak plateau windows
- Post-30 decline acceleration
- Contract pressure for drafted stars
- Draft philosophy identity
- Trade anti-cheese guards
- Pick-hoarding prevention
- Salary dump friction
- Compensatory structure (NFL default)

**Secondary priority**
- Era tuning
- League trend shifts over decades
- Hall weighting with awards

---

## MVV Roadmap (Smallest Playable Vision)

### Goal
Player can create coach, get hired, hire coordinators, run one offseason, draft, complete one season, and observe consequences (media/REP/owner pressure).

### MVV Phase A — Foundation Engine
- Unified character schema
- Deterministic RNG
- Team container (roster/staff/cap/expectations)
- REP system
- Delegation toggles
- Weekly Hub calendar shell
- Save/load persistence

### MVV Phase B — Playable Loop
- Offseason: draft class gen, simplified scouting, baseline FA offers, GM trade execution
- Draft: pick timer, basic trades, media line, recap
- Camp: install load (L/M/H), depth chart
- Season: weekly loop, play-by-play, per-drive delegation, postgame press conference, weekly grade + REP update

### MVV Phase C — Depth Layer
- RAS, trait risk, private workouts, combine presentation
- Install simplification tiers, usage decay, gamebreakers
- Locker room factions, staff tension, owner hot seat
- Carousel, trade-up psychology, historical draft memory, ownership transitions

---

## Technical Build Hierarchy
1. Unified character model
2. Team + league container
3. Weekly Hub engine
4. Simulation core
5. Roster + contracts + cap/trade
6. Narrative layer on top of data

---

## Canonical Systems

### Offensive systems (20)
West Coast (Classic), West Coast (Modern/Shanahan), Air Coryell, Vertical Spread, Spread RPO, Power Run (Gap), Zone Run (Wide Zone), Inside Zone/Duo, Pro-Style Balanced, Erhardt–Perkins, Run & Shoot, Pistol, Option/Power Option, Smashmouth/Ball Control, Quick Game/Timing, Empty/Five-Wide, Two-TE Heavy, Motion/Misdirection, Play-Action Vertical, College Hybrid Tempo.

### Defensive systems (20)
4–3 Over, 4–3 Under, 3–4 Two-Gap, 3–4 One-Gap, 4–2–5 Nickel, 3–3–5 Stack, Tampa 2, Cover 2 Traditional, Cover 3 Single-High, Quarters, Match Quarters, Fangio Two-High Match, Man-Heavy Press, Zone Blitz, Fire Zone, Hybrid Multiple, Big Nickel, Dime Pressure, Prevent Shell, Blitz-Heavy.

### Special teams philosophies (6)
Conservative Field Position, Aggressive Returns, Block-Oriented Pressure, Safe Hands, Directional Control, Fake-Ready Opportunistic.

### Canon constraints
- Coaches get one primary system + optional secondary tendency.
- AI behavior keys off system identity first, ratings second.
- New systems only enter via explicit canon extension.
