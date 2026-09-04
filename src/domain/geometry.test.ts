import { describe, expect, it } from 'vitest';
import { currentAspectRatio, dimensionsForEdit } from './geometry';

describe('dimensionsForEdit', () => {
  it('changes one axis only when the aspect ratio is unlocked', () => {
    expect(dimensionsForEdit({ widthPx: 200, heightPx: 100 }, 'width', 250, false, null)).toEqual({
      widthPx: 250,
      heightPx: 100,
    });
  });

  it('calculates the companion axis at full precision when linked', () => {
    const next = dimensionsForEdit({ widthPx: 200, heightPx: 100 }, 'width', 333.3333333333333, true, 2);
    expect(next?.heightPx).toBe(166.66666666666666);
  });

  it('keeps a line height at zero and does not invent a ratio', () => {
    expect(dimensionsForEdit({ widthPx: 120, heightPx: 0 }, 'width', 200, false, null, true)).toEqual({
      widthPx: 200,
      heightPx: 0,
    });
    expect(currentAspectRatio({ widthPx: 120, heightPx: 0 })).toBeNull();
  });

  it('rejects values below Figma minimum size', () => {
    expect(dimensionsForEdit({ widthPx: 20, heightPx: 10 }, 'height', 0, false, null)).toBeNull();
  });
});
