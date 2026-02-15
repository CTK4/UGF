# Team Logos (UGF Coach RPG)

## File conventions

- Folder per team: `src/assets/teamLogos/<TEAM_ID>/`
- Primary mark: `mark.png` (preferred), or `mark.svg`, or `mark.jpeg`
- If a team has no logo, the UI falls back to `src/assets/teamLogos/placeholder.jpeg`.

## Recommended exports

### Primary “mark” (square)
- Source size: **256×256** (or 512×512 for extra sharpness)
- Transparent background (PNG) preferred.
- Safe area: keep artwork inside ~**85%** of the square.

### UI render sizes
- Lists/schedule rows: **18px**
- Card/header: **22–28px**
- Team pages/hero: **48–72px**

## Design constraints
- Must read on a dark background.
- Avoid thin strokes and low-contrast marks.
- Avoid marks that require sharp outer corners (UI uses rounded containers).
