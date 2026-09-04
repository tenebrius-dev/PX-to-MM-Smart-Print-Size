import { describe, expect, it } from 'vitest';
import { scaledGeometry } from './scale';

describe('scaledGeometry', () => {
  const geometry = { xPx: 10, yPx: 20, widthPx: 200, heightPx: 100 };

  it('scales around the selected center anchor without rounding', () => {
    expect(scaledGeometry(geometry, 1.5, 4)).toEqual({
      xPx: -40,
      yPx: -5,
      widthPx: 300,
      heightPx: 150,
    });
  });

  it('keeps the top-left anchor fixed', () => {
    expect(scaledGeometry(geometry, 2, 0)).toEqual({
      xPx: 10,
      yPx: 20,
      widthPx: 400,
      heightPx: 200,
    });
  });

  it('rejects a scale below the native minimum', () => {
    expect(scaledGeometry(geometry, 0, 4)).toBeNull();
  });
});

