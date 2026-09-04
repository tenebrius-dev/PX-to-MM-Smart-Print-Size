import { describe, expect, it } from 'vitest';
import { isPluginToUiMessage, isUiToPluginMessage } from './messages';

const node = {
  id: '1',
  name: 'Frame',
  type: 'FRAME',
  xPx: 0,
  yPx: 0,
  widthPx: 100,
  heightPx: 50,
  canMoveX: true,
  canMoveY: true,
  canResizeWidth: true,
  canResizeHeight: true,
  canScale: true,
  aspectSupported: true,
  aspectLocked: false,
  aspectRatio: 2,
  locked: false,
  autoLayoutPosition: false,
  missingFont: false,
  stroke: {
    present: false,
    weightPx: null,
    canEdit: false,
    outerWidthPx: null,
    outerHeightPx: null,
  },
  raster: { detected: false, status: 'not-applicable' },
};

describe('message validation', () => {
  it('accepts snapshots and rejects stale/malformed payloads', () => {
    expect(isPluginToUiMessage({ type: 'selection', revision: 4, selection: { kind: 'selected', node } })).toBe(true);
    expect(isPluginToUiMessage({ type: 'selection', revision: -1, selection: { kind: 'empty' } })).toBe(false);
    expect(isPluginToUiMessage({ type: 'selection', revision: 4, selection: { kind: 'selected', node: { ...node, widthPx: Number.NaN } } })).toBe(false);
  });

  it('accepts only finite edit messages with a current revision shape', () => {
    expect(isUiToPluginMessage({ type: 'set-dimension', nodeId: '1', revision: 4, axis: 'width', valuePx: 12.5 })).toBe(true);
    expect(isUiToPluginMessage({ type: 'set-position', nodeId: '1', revision: 4, axis: 'x', valuePx: -491 })).toBe(true);
    expect(isUiToPluginMessage({ type: 'set-stroke-weight', nodeId: '1', revision: 4, valuePx: 1.5 })).toBe(true);
    expect(isUiToPluginMessage({ type: 'set-dimension', nodeId: '1', revision: 4, axis: 'width', valuePx: Infinity })).toBe(false);
    expect(isUiToPluginMessage({ type: 'set-stroke-weight', nodeId: '1', revision: 4, valuePx: -1 })).toBe(false);
    expect(isUiToPluginMessage({ type: 'set-aspect-lock', nodeId: '1', revision: 4, locked: 'yes' })).toBe(false);
    expect(isUiToPluginMessage({ type: 'set-scale', nodeId: '1', revision: 4, scale: 2, anchor: 4 })).toBe(true);
    expect(isUiToPluginMessage({ type: 'set-scale', nodeId: '1', revision: 4, scale: 0, anchor: 4 })).toBe(false);
    expect(isUiToPluginMessage({ type: 'set-scale', nodeId: '1', revision: 4, scale: 2, anchor: 9 })).toBe(false);
  });
});
