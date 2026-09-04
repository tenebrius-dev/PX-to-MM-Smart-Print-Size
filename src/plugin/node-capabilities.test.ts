import { describe, expect, it, vi } from 'vitest';
import {
  getNodeCapabilities,
  getStrokeCapabilities,
  hasEditableStrokeWeight,
  hasMissingFontInSubtree,
  isAutoLayoutPosition,
} from './node-capabilities';

function node(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'RECTANGLE',
    width: 200,
    height: 100,
    x: 10,
    y: 20,
    locked: false,
    resize: vi.fn(),
    targetAspectRatio: null,
    lockAspectRatio: vi.fn(),
    unlockAspectRatio: vi.fn(),
    ...overrides,
  };
}

describe('node capabilities', () => {
  it('supports a regular raster-like shape and derives its current ratio', () => {
    const capabilities = getNodeCapabilities(node());
    expect(capabilities.canResizeWidth).toBe(true);
    expect(capabilities.canResizeHeight).toBe(true);
    expect(capabilities.aspectSupported).toBe(true);
    expect(capabilities.aspectLocked).toBe(false);
    expect(capabilities.aspectRatio).toBe(2);
    expect(capabilities.canScale).toBe(true);
  });

  it('uses the native target aspect ratio when it is locked', () => {
    const capabilities = getNodeCapabilities(node({ targetAspectRatio: { x: 3, y: 2 } }));
    expect(capabilities.aspectLocked).toBe(true);
    expect(capabilities.aspectRatio).toBe(1.5);
  });

  it('disables edits for locked ancestors and auto-layout children', () => {
    const parent = node({ type: 'FRAME', locked: true, layoutMode: 'NONE' });
    const locked = getNodeCapabilities(node({ parent }));
    expect(locked.locked).toBe(true);
    expect(locked.canMove).toBe(false);
    expect(locked.canResize).toBe(true);
    expect(locked.canResizeWidth).toBe(false);

    const autoParent = node({ type: 'FRAME', layoutMode: 'HORIZONTAL', locked: false });
    const autoChild = node({ parent: autoParent, layoutPositioning: 'AUTO' });
    expect(isAutoLayoutPosition(autoChild)).toBe(true);
    expect(getNodeCapabilities(autoChild).canMove).toBe(false);
  });

  it('handles line height and missing fonts safely', () => {
    const line = getNodeCapabilities(node({ type: 'LINE' }));
    expect(line.aspectSupported).toBe(false);
    expect(line.canResizeWidth).toBe(true);
    expect(line.canResizeHeight).toBe(false);

    const text = node({ type: 'TEXT', hasMissingFont: true });
    expect(hasMissingFontInSubtree(node({ children: [text] }))).toBe(true);
    expect(getNodeCapabilities(text).canResizeWidth).toBe(false);

    const autoText = getNodeCapabilities(node({ type: 'TEXT', textAutoResize: 'HEIGHT' }));
    expect(autoText.aspectSupported).toBe(false);
  });

  it('exposes one editable stroke weight only when Figma reports a uniform value', () => {
    const uniform = node({ strokes: [{ type: 'SOLID' }], strokeWeight: 1.5 });
    expect(getStrokeCapabilities(uniform)).toEqual({
      present: true,
      weightPx: 1.5,
      outerBounds: { widthPx: null, heightPx: null },
    });
    expect(hasEditableStrokeWeight(uniform)).toBe(true);

    const mixed = node({ strokes: [{ type: 'SOLID' }], strokeWeight: Symbol('mixed') });
    expect(getStrokeCapabilities(mixed)).toEqual({
      present: true,
      weightPx: null,
      outerBounds: { widthPx: null, heightPx: null },
    });
    expect(hasEditableStrokeWeight(mixed)).toBe(false);
    expect(getStrokeCapabilities(node())).toEqual({
      present: false,
      weightPx: null,
      outerBounds: { widthPx: null, heightPx: null },
    });
  });

  it('reports the visible extent beyond the object contour for any stroked node', () => {
    const outside = node({
      strokes: [{ type: 'SOLID' }],
      strokeWeight: 3,
      strokeAlign: 'OUTSIDE',
    });
    expect(getStrokeCapabilities(outside)).toEqual({
      present: true,
      weightPx: 3,
      outerBounds: { widthPx: 6, heightPx: 6 },
    });

    const centered = node({
      strokes: [{ type: 'SOLID' }],
      strokeWeight: 4,
      strokeAlign: 'CENTER',
      strokeLeftWeight: 2,
      strokeRightWeight: 6,
      strokeTopWeight: 1,
      strokeBottomWeight: 3,
    });
    expect(getStrokeCapabilities(centered).outerBounds).toEqual({ widthPx: 4, heightPx: 2 });
  });

  it('treats hidden stroke paints as absent and ignores them in the bounds', () => {
    const hidden = node({
      strokes: [{ type: 'SOLID', visible: false }],
      strokeWeight: 3,
      strokeAlign: 'OUTSIDE',
    });
    expect(getStrokeCapabilities(hidden)).toEqual({
      present: false,
      weightPx: null,
      outerBounds: { widthPx: null, heightPx: null },
    });
    expect(hasEditableStrokeWeight(hidden)).toBe(false);

    const oneVisible = node({
      strokes: [
        { type: 'SOLID', visible: false },
        { type: 'SOLID', visible: true },
      ],
      strokeWeight: 3,
      strokeAlign: 'OUTSIDE',
    });
    expect(getStrokeCapabilities(oneVisible).outerBounds).toEqual({ widthPx: 6, heightPx: 6 });
  });
});
