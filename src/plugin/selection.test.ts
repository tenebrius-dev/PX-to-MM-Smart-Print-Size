import { describe, expect, it } from 'vitest';
import { getSelectionState } from './selection';

const resolver = {
  getImageByHash: () => ({ getSizeAsync: async () => ({ width: 1, height: 1 }) }),
};

describe('getSelectionState', () => {
  it('keeps fields disabled for an empty or multiple selection', async () => {
    await expect(getSelectionState([], Symbol('mixed'), resolver)).resolves.toEqual({ kind: 'empty' });
    await expect(getSelectionState([{ id: '1' }, { id: '2' }], Symbol('mixed'), resolver)).resolves.toEqual({ kind: 'multiple', count: 2 });
  });

  it('returns geometry for a frame, group, vector or raster-like node', async () => {
    const state = await getSelectionState([{
      id: '42',
      name: 'Poster',
      type: 'GROUP',
      x: -491,
      y: -297.78,
      width: 839.52,
      height: 595.56,
      resize: () => undefined,
      targetAspectRatio: { x: 839.52, y: 595.56 },
      lockAspectRatio: () => undefined,
      unlockAspectRatio: () => undefined,
      fills: [{ type: 'IMAGE', imageHash: 'hash' }],
      strokes: [{ type: 'SOLID' }],
      strokeWeight: 2.5,
      strokeAlign: 'OUTSIDE',
    }], Symbol('mixed'), resolver);

    expect(state.kind).toBe('selected');
    if (state.kind === 'selected') {
      expect(state.node.xPx).toBe(-491);
      expect(state.node.widthPx).toBe(839.52);
      expect(state.node.raster).toMatchObject({ detected: true, status: 'ready' });
      expect(state.node.aspectLocked).toBe(true);
      expect(state.node.stroke).toEqual({
        present: true,
        weightPx: 2.5,
        canEdit: true,
        outerWidthPx: 5,
        outerHeightPx: 5,
      });
    }
  });

  it('reports malformed geometry as invalid instead of throwing', async () => {
    await expect(getSelectionState([{
      id: 'broken', name: 'Broken', type: 'RECTANGLE', x: Number.NaN, y: 0, width: 10, height: 10,
    }], Symbol('mixed'), resolver)).resolves.toMatchObject({ kind: 'invalid' });
  });
});
