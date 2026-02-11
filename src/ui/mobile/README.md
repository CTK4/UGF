# UGF Mobile UI Kit (Extraction Pass)

This folder contains reusable React + TypeScript mobile components recreated from the `Ugffigma-main` upload as a **non-wired** extraction step.

## What was extracted

- `MobileTopBar`: title row with optional right-side action area
- `FocusCard`: featured card with header/body and optional opponent slot
- `StatPillsRow`: horizontal row of compact stat pills
- `PrimaryActionButton` / `SecondaryActionButton`: call-to-action button variants
- `ListRow`: icon + title + subtitle + right chevron row
- `SectionCard`: reusable section container with header/body
- `tokens/tokens.ts`: base spacing, radius, and font-size tokens
- `styles/mobile.css`: core mobile visual styles used by components
- `screens/MobilePlayground.tsx`: local preview component for manual validation only

## Usage

```tsx
import {
  MobileTopBar,
  FocusCard,
  StatPillsRow,
  PrimaryActionButton,
  SecondaryActionButton,
  ListRow,
  SectionCard,
} from "@/ui/mobile/components";
```

Example:

```tsx
<FocusCard title="Weekly Focus" opponentSlot={<div>Opponent: Portland</div>}>
  <StatPillsRow pills={[{ label: "Off", value: 84 }, { label: "Def", value: 79 }]} />
  <PrimaryActionButton label="Set Gameplan" onClick={onSetGameplan} />
</FocusCard>
```

## Intentionally not wired yet

- No changes to route maps, runtime flow, or existing screen registration.
- No imports from this folder are added to current production screens.
- Asset-heavy Figma details were translated into CSS-first structural components; iconography uses simple placeholders where direct exports are unnecessary at this extraction stage.
