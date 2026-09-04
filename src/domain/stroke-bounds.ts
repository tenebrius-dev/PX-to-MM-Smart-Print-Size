import type { DimensionAxis, NodeDimensions } from './geometry';

export type StrokeAlignment = 'CENTER' | 'INSIDE' | 'OUTSIDE';

export interface StrokeSideWeights {
  topPx: number | null;
  rightPx: number | null;
  bottomPx: number | null;
  leftPx: number | null;
}

/** Total visible expansion beyond the object's geometric width and height. */
export interface StrokeOuterBounds {
  widthPx: number | null;
  heightPx: number | null;
}

/** Visible painted extent beyond each edge of the node's geometry contour. */
export interface StrokeOutsets {
  leftPx: number;
  rightPx: number;
  topPx: number;
  bottomPx: number;
}

function validWeight(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

/**
 * Figma's node width/height describe the geometry contour, not the portion of
 * a center or outside stroke painted beyond that contour. This returns the
 * total extra size on each axis: 0 for inside, one stroke width for center,
 * and two stroke widths for outside alignment.
 */
export function strokeOuterBounds(
  alignment: StrokeAlignment | null,
  sides: StrokeSideWeights,
): StrokeOuterBounds {
  const outsets = strokeOutsets(alignment, sides);
  if (!outsets) {
    return { widthPx: null, heightPx: null };
  }
  return {
    widthPx: outsets.leftPx + outsets.rightPx,
    heightPx: outsets.topPx + outsets.bottomPx,
  };
}

/**
 * Returns `null` when the exact outside geometry is unavailable. Callers that
 * draw on the canvas must prefer no visual over a misleading approximation.
 */
export function strokeOutsets(
  alignment: StrokeAlignment | null,
  sides: StrokeSideWeights,
): StrokeOutsets | null {
  if (alignment === 'INSIDE') {
    return { leftPx: 0, rightPx: 0, topPx: 0, bottomPx: 0 };
  }
  if (alignment === null || !validWeight(sides.leftPx) || !validWeight(sides.rightPx)
    || !validWeight(sides.topPx) || !validWeight(sides.bottomPx)) {
    return null;
  }

  const multiplier = alignment === 'CENTER' ? 0.5 : 1;
  return {
    leftPx: sides.leftPx * multiplier,
    rightPx: sides.rightPx * multiplier,
    topPx: sides.topPx * multiplier,
    bottomPx: sides.bottomPx * multiplier,
  };
}

function outsideForAxis(bounds: StrokeOuterBounds, axis: DimensionAxis, included: boolean): number {
  if (!included) {
    return 0;
  }
  const value = axis === 'width' ? bounds.widthPx : bounds.heightPx;
  return validWeight(value) ? value : 0;
}

export function dimensionsWithOutsideStroke(
  dimensions: NodeDimensions,
  bounds: StrokeOuterBounds,
  included: boolean,
): NodeDimensions {
  return {
    widthPx: dimensions.widthPx + outsideForAxis(bounds, 'width', included),
    heightPx: dimensions.heightPx + outsideForAxis(bounds, 'height', included),
  };
}

/** Converts a displayed physical size back to Figma's geometric node size. */
export function nodeDimensionFromDisplayedSize(
  valuePx: number,
  axis: DimensionAxis,
  bounds: StrokeOuterBounds,
  included: boolean,
): number {
  return valuePx - outsideForAxis(bounds, axis, included);
}
