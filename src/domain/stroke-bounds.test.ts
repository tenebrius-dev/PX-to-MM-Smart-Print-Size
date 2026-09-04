import { describe, expect, it } from 'vitest';
import {
  dimensionsWithOutsideStroke,
  nodeDimensionFromDisplayedSize,
  strokeOuterBounds,
  strokeOutsets,
} from './stroke-bounds';

describe('stroke outer bounds', () => {
  const uniform = { topPx: 4, rightPx: 4, bottomPx: 4, leftPx: 4 };

  it('accounts only for the painted part outside the geometry contour', () => {
    expect(strokeOuterBounds('INSIDE', uniform)).toEqual({ widthPx: 0, heightPx: 0 });
    expect(strokeOuterBounds('CENTER', uniform)).toEqual({ widthPx: 4, heightPx: 4 });
    expect(strokeOuterBounds('OUTSIDE', uniform)).toEqual({ widthPx: 8, heightPx: 8 });
  });

  it('uses individual side weights when Figma reports them', () => {
    expect(strokeOuterBounds('OUTSIDE', {
      topPx: 1,
      rightPx: 6,
      bottomPx: 3,
      leftPx: 2,
    })).toEqual({ widthPx: 8, heightPx: 4 });
  });

  it('keeps four independent outsets for an overlay while using one shared dimension calculation', () => {
    expect(strokeOutsets('INSIDE', { topPx: 1, rightPx: 6, bottomPx: 3, leftPx: 2 })).toEqual({
      leftPx: 0,
      rightPx: 0,
      topPx: 0,
      bottomPx: 0,
    });
    expect(strokeOutsets('CENTER', { topPx: 1, rightPx: 6, bottomPx: 3, leftPx: 2 })).toEqual({
      leftPx: 1,
      rightPx: 3,
      topPx: 0.5,
      bottomPx: 1.5,
    });
    expect(strokeOutsets('OUTSIDE', { topPx: 1, rightPx: 6, bottomPx: 3, leftPx: 2 })).toEqual({
      leftPx: 2,
      rightPx: 6,
      topPx: 1,
      bottomPx: 3,
    });
    expect(strokeOutsets('OUTSIDE', { topPx: 1, rightPx: null, bottomPx: 3, leftPx: 2 })).toBeNull();
  });

  it('converts displayed dimensions back to the node contour without rounding', () => {
    const bounds = { widthPx: 6, heightPx: 6 };
    expect(dimensionsWithOutsideStroke({ widthPx: 72, heightPx: 36 }, bounds, true)).toEqual({
      widthPx: 78,
      heightPx: 42,
    });
    expect(nodeDimensionFromDisplayedSize(100.3333333333333, 'width', bounds, true)).toBe(94.3333333333333);
    expect(nodeDimensionFromDisplayedSize(100, 'width', bounds, false)).toBe(100);
  });
});
