# Shared table component & dark-mode color fix

## Problem

The app renders tables in over a dozen places (`UserTable`, `AttendanceSection`, `StudentsSection`,
`ExcusesSection`, `DocumentsSection`, `PresentationsSection`, `NextPresentationsSection`,
`ClassesPage`, `ChildrenPage`, `PresentationsAccordion`, and the shared `CustomTable`). Every one of
them uses Chakra UI's `Table.Root variant="line"` with no exceptions.

In dark mode, hovering a row can turn its background white while the text stays white (from
`_dark` text tokens), making the row unreadable. The only place row hover is styled today is
`CustomTable` ([table.tsx](../../../frontend/src/shared/ui/table.tsx)), via a
`useColorModeValue()` React hook. That hook resolves color mode in JS (via `next-themes`), while
text color is resolved by Chakra's CSS `_dark` selector on semantic tokens. These two mechanisms
can desync, which is the likely source of the bug. Every other table has no hover styling at all
(Chakra's base `"line"` variant recipe defines no `_hover`), so they don't currently show the bug,
but they also have no shared visual language — inconsistent colors, header styling, and hover
behavior across the app.

Two additional table components, `ProfileChildrenTable.tsx` and `PresentationsTable.tsx`, exist
but are not imported anywhere.

## Goals

- Fix the dark-mode hover bug at its root, for every table in the app, not just `CustomTable`.
- Establish one consistent visual style for tables (row hover, header) driven by theme tokens, not
  per-component JS color-mode hooks.
- Keep a low-friction, low-risk migration: don't force complex tables (conditional columns,
  responsive column hiding, tooltips) into a rigid data-driven API they don't fit.
- Remove dead code.

## Non-goals

- Rewriting complex tables' business logic (filtering, pagination wiring, conditional columns) —
  only their visual styling is in scope.
- Introducing sorting, column resizing, or other new table features.
- Changing the row background color itself (only hover is part of the reported bug).

## Design

### 1. Theme-level fix (the foundation)

Because every table in the codebase uses `variant="line"`, the fix belongs in the shared
`tableSlotRecipe` in [theme.tsx](../../../frontend/src/design/theme.tsx), under
`variants.variant.line`:

- **Row hover**: `_hover: { bg: 'bg-brand-subtle' }`. `bg-brand-subtle` is an existing semantic
  token (`brand.primary.300` light / `brand.primary.700` dark) resolved via CSS `_dark`, so it
  can't desync from the CSS-driven text color the way a JS hook can.
- **Header row** (`columnHeader` slot): `bg: 'brand.primary.900'`, `color: 'white'`, in both light
  and dark mode. This matches the existing (currently unused) `headerRecipe` already defined in
  the theme file.
- Row background itself is left untouched — it's not part of the reported bug, and changing it
  risks mismatches with tables rendered inside cards/surfaces elsewhere.

This single change fixes hover/header colors for every existing table immediately, with zero
per-file migration required.

Remove the theme's dead `"simple"` table variant (unused anywhere in the codebase) — it's
superseded by the fixed `"line"` variant.

### 2. Component architecture: theme fix + convenience wrapper

Two tiers, matching how tables are actually used in this codebase:

- **Primitives** (`Table.Root` / `Table.Header` / `Table.Row` / `Table.Cell` from Chakra, styled by
  the theme recipe above): used directly by tables with conditional columns, responsive
  base/md column visibility, tooltips, or other per-cell custom logic (e.g. `AttendanceSection`,
  `StudentsSection`, `ExcusesSection`). These keep their existing hand-authored JSX structure and
  get correct colors for free from the theme change — no rewrite needed.
- **Convenience wrapper**: `CustomTable` ([table.tsx](../../../frontend/src/shared/ui/table.tsx))
  stays the `headers: string[]` + `data: ReactNode[][]` component for tables with a fixed column
  set and simple per-cell content (currently `UserTable`). Remove its `useColorModeValue` calls and
  the `headerBg` / `rowBg` / `rowHoverBg` props it currently passes down — the theme recipe now
  supplies all of that automatically, so `CustomTable` no longer needs to know about color mode at
  all.

No other existing table is being forced onto the `CustomTable` API as part of this change — if a
future table happens to fit the simple headers+data shape, it can adopt `CustomTable`, but
migrating today's complex tables into that shape is out of scope (see Non-goals).

### 3. Cleanup

Delete the two unused components:

- `frontend/src/profile/components/ProfileChildrenTable.tsx`
- `frontend/src/schedule/components/PresentationsTable.tsx`

## Verification

- `npm run typecheck` and `npm run lint` in `frontend/`.
- Manual check, light and dark mode, of a representative sample:
  - `UserTable` (convenience wrapper) — header color, row hover.
  - `AttendanceSection` (complex/responsive columns, tooltips) — header color, row hover, confirm
    tooltip and action buttons remain legible.
  - `ExcusesSection` (complex, conditional action column) — header color, row hover.
- Confirm no other `Table.Root` usage regresses (full list above) by spot-checking at least one
  more, e.g. `ChildrenPage`.
