# Shared Table Component & Dark-Mode Color Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the dark-mode row-hover color bug for every table in the app by moving hover/header
styling into the shared Chakra theme recipe, and simplify the existing `CustomTable` convenience
component to rely on it instead of a JS color-mode hook.

**Architecture:** Every table in the codebase renders `Table.Root variant="line"`. The fix lives
entirely in `tableSlotRecipe` inside the shared theme config (`frontend/src/design/theme.tsx`):
add CSS-token-driven (`_dark`-aware) styling to the `"line"` variant's `row` (hover) and
`columnHeader` (header) slots. Because this is one shared recipe, every existing table picks up
the fix automatically — no per-table migration is required for the color bug itself.
`CustomTable` (`frontend/src/shared/ui/table.tsx`), the one place that hand-rolled its own
color-mode-dependent hover/header colors via `useColorModeValue()`, gets those calls removed so it
relies on the same theme recipe as everything else.

**Tech Stack:** React, TypeScript, Chakra UI 3 (`createSystem`/`defineSlotRecipe`), Vitest +
React Testing Library.

---

### Task 1: Fix table hover/header colors in the shared theme recipe

**Files:**

- Modify: `frontend/src/design/theme.tsx:246-262` (the `tableSlotRecipe` definition)
- Test: `frontend/src/design/theme.test.ts` (new)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/design/theme.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tableSlotRecipe } from './theme';

describe('tableSlotRecipe', () => {
  it('keeps the slots array aligned with Chakra table anatomy order', () => {
    // Chakra merges this array with its own built-in table anatomy
    // (root, header, body, row, columnHeader, cell, footer, caption) by
    // array index. A mismatched order/length silently renames the wrong
    // slot, so this must always match exactly.
    expect(tableSlotRecipe.slots).toEqual([
      'root',
      'header',
      'body',
      'row',
      'columnHeader',
      'cell',
      'footer',
      'caption',
    ]);
  });

  it('uses the brand-subtle token (not a hardcoded color) for line-variant row hover', () => {
    const line = tableSlotRecipe.variants?.variant?.line;
    expect(line?.row?._hover?.bg).toBe('bg-brand-subtle');
  });

  it('gives the line variant a solid brand header with white text', () => {
    const line = tableSlotRecipe.variants?.variant?.line;
    expect(line?.columnHeader?.bg).toBe('brand.primary.900');
    expect(line?.columnHeader?.color).toBe('white');
  });

  it('no longer defines the unused simple variant', () => {
    const variants = tableSlotRecipe.variants?.variant as Record<string, unknown>;
    expect(variants.simple).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `frontend/`): `npx vitest run src/design/theme.test.ts`
Expected: FAIL — `tableSlotRecipe` is not exported from `./theme` (it's currently a private
`const`), so the import fails.

- [ ] **Step 3: Replace the recipe definition**

In `frontend/src/design/theme.tsx`, replace the existing block (currently lines 246-262):

```ts
const tableSlotRecipe = defineSlotRecipe({
  slots: ['row'],
  variants: {
    variant: {
      simple: {
        row: {
          _hover: {
            bg: 'gray.200',
            _dark: {
              bg: 'whiteAlpha.50',
            },
          },
        },
      },
    },
  },
});
```

with:

```ts
export const tableSlotRecipe = defineSlotRecipe({
  // Mirrors Chakra's own table anatomy order exactly (see the test in
  // theme.test.ts for why: this array is merged with Chakra's built-in
  // one by index, so a mismatched order/length silently renames slots).
  slots: ['root', 'header', 'body', 'row', 'columnHeader', 'cell', 'footer', 'caption'],
  variants: {
    variant: {
      line: {
        row: {
          _hover: {
            bg: 'bg-brand-subtle',
          },
        },
        columnHeader: {
          bg: 'brand.primary.900',
          color: 'white',
        },
      },
    },
  },
});
```

This targets the `"line"` variant (the only variant used anywhere in the app) instead of the
unused `"simple"` variant, and uses `bg-brand-subtle` — an existing semantic token already defined
in this same file (`brand.primary.300` light / `brand.primary.700` dark) that resolves via CSS
`_dark`, so it can't desync from CSS-driven text color the way a JS `useColorModeValue()` hook can.

- [ ] **Step 4: Run the test to verify it passes**

Run (from `frontend/`): `npx vitest run src/design/theme.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/design/theme.tsx frontend/src/design/theme.test.ts
git commit -m "$(cat <<'EOF'
fix: move table hover/header colors into the shared theme recipe

Every table in the app uses Table.Root variant="line", but only
CustomTable styled hover manually via useColorModeValue() — a JS hook
that can desync from the CSS-driven _dark text color, producing
white-background/white-text rows in dark mode. Styling the "line"
variant's row and columnHeader slots directly fixes every table at
once via CSS-driven semantic tokens.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Simplify `CustomTable` to rely on the theme recipe

**Files:**

- Modify: `frontend/src/shared/ui/table.tsx`
- Test: `frontend/src/shared/ui/table.test.tsx` (new)

- [ ] **Step 1: Write the failing test**

Create `frontend/src/shared/ui/table.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChakraProvider } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import system from '../../design/theme';
import { CustomTable } from './table';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

describe('CustomTable', () => {
  it('renders headers and row data', () => {
    render(
      <CustomTable
        headers={['Name', 'Email']}
        data={[
          ['Jana Novak', 'jana@example.com'],
          ['Petr Svoboda', 'petr@example.com'],
        ]}
      />,
      { wrapper }
    );

    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument();
    expect(screen.getByText('Jana Novak')).toBeInTheDocument();
    expect(screen.getByText('petr@example.com')).toBeInTheDocument();
  });

  it('renders an actions cell per row when actions is provided', () => {
    const actions = vi.fn((rowIndex: number) => <button>Delete row {rowIndex}</button>);
    render(
      <CustomTable
        headers={['Name']}
        data={[['Jana Novak'], ['Petr Svoboda']]}
        actions={actions}
      />,
      { wrapper }
    );

    expect(screen.getByRole('button', { name: 'Delete row 0' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete row 1' })).toBeInTheDocument();
    expect(actions).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it passes against the current implementation**

Run (from `frontend/`): `npx vitest run src/shared/ui/table.test.tsx`
Expected: PASS (2 tests) — this characterizes `CustomTable`'s current rendering behavior before
the refactor in the next step, so Step 4 proves nothing broke.

- [ ] **Step 3: Remove the color-mode hook from `CustomTable`**

Replace the full contents of `frontend/src/shared/ui/table.tsx`:

```tsx
import React from 'react';
import { Table, TableRootProps } from '@chakra-ui/react';

interface CustomTableProps extends TableRootProps {
  headers: string[];
  data: React.ReactNode[][];
  actions?: (rowIndex: number) => React.ReactNode;
}

export const CustomTable: React.FC<CustomTableProps> = ({ headers, data, actions, ...props }) => {
  return (
    <Table.Root {...props}>
      <Table.Header>
        <Table.Row>
          {headers.map((header, index) => (
            <Table.ColumnHeader key={index}>{header}</Table.ColumnHeader>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((row, rowIndex) => (
          <Table.Row key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <Table.Cell key={cellIndex}>{cell}</Table.Cell>
            ))}
            {actions && <Table.Cell>{actions(rowIndex)}</Table.Cell>}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};
```

`Table.Root`'s default variant is `"line"` (set in Chakra's base recipe), so no `variant` prop is
needed here — it now inherits header/hover colors from the recipe fixed in Task 1 instead of
computing them itself.

- [ ] **Step 4: Run the test to verify it still passes**

Run (from `frontend/`): `npx vitest run src/shared/ui/table.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/shared/ui/table.tsx frontend/src/shared/ui/table.test.tsx
git commit -m "$(cat <<'EOF'
refactor: drop CustomTable's manual color-mode hover styling

Header/row hover colors now come from the shared theme recipe (see
previous commit), so CustomTable no longer needs its own
useColorModeValue()-driven bg/hover values.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Remove unused table components

**Files:**

- Delete: `frontend/src/profile/components/ProfileChildrenTable.tsx`
- Delete: `frontend/src/schedule/components/PresentationsTable.tsx`

- [ ] **Step 1: Confirm they're unreferenced**

Run: `grep -rn "ProfileChildrenTable\|PresentationsTable" frontend/src --include="*.ts" --include="*.tsx"`
Expected: only the files' own internal declarations/exports match (no import sites elsewhere).

- [ ] **Step 2: Delete the files**

```bash
git rm frontend/src/profile/components/ProfileChildrenTable.tsx
git rm frontend/src/schedule/components/PresentationsTable.tsx
```

- [ ] **Step 3: Run typecheck and lint to confirm nothing referenced them**

`typecheck` and `lint` are defined in the repo-root `package.json` (not `frontend/package.json`),
and already point at the `frontend/` sources, so run these from the repo root:

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: remove unused table components

ProfileChildrenTable and PresentationsTable have no import sites
anywhere in the app.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Run the full automated check and manually verify colors in the browser

**Files:** none (verification only)

- [ ] **Step 1: Run the full frontend test suite**

Run (from `frontend/`): `npm run test`
Expected: all tests pass, including the new `theme.test.ts` and `table.test.tsx`.

- [ ] **Step 2: Run typecheck and lint one more time on the full tree**

Run (from the repo root, not `frontend/` — these scripts live in the root `package.json`):
`npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Start the dev server and check colors manually**

Run (from `frontend/`): `npm run start` (this is a Vite dev server, despite the script being
named `start` rather than `dev`)

In the browser, toggle dark mode and check, on each of the following pages, that (a) the header
row is a solid blue with white text, and (b) hovering a body row tints it without ever showing
white-on-white text:

- User dashboard table (uses `CustomTable`)
- A class's Attendance tab (`AttendanceSection` — responsive/conditional columns, tooltips)
- A child's Excuses tab (`ExcusesSection` — conditional action column)
- The Children page table (`ChildrenPage`)

Repeat the same check in light mode to confirm nothing regressed there.

- [ ] **Step 4: Report results**

If every page above shows correct header/hover colors in both themes, the work is done. If any
page still shows a color problem, note which page and what's wrong before considering this task
complete — do not mark it done on the basis of the automated tests alone, since they can't observe
real hover-pseudo-class rendering in jsdom.
