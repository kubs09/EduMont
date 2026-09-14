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
