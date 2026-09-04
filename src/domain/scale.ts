import { clampDimensionForNode } from './geometry';

export const MIN_SCALE = 0.01;

export type AnchorPoint = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface GeometryForScale {
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}

export interface ScaleAnchor {
  x: number;
  y: number;
}

/**
 * Anchor positions use the same reading order as Figma's 3×3 scale anchor:
 * top-left through bottom-right.
 */
export const SCALE_ANCHORS: readonly ScaleAnchor[] = [
  { x: 0, y: 0 },
  { x: 0.5, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 1, y: 0.5 },
  { x: 0, y: 1 },
  { x: 0.5, y: 1 },
  { x: 1, y: 1 },
];

export function isAnchorPoint(value: unknown): value is AnchorPoint {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 8;
}

export function anchorForPoint(anchor: AnchorPoint): ScaleAnchor {
  return SCALE_ANCHORS[anchor];
}

export function scaledGeometry(
  geometry: GeometryForScale,
  scale: number,
  anchor: AnchorPoint,
): GeometryForScale | null {
  if (
    ![geometry.xPx, geometry.yPx, geometry.widthPx, geometry.heightPx, scale].every(Number.isFinite) ||
    geometry.widthPx < 0 ||
    geometry.heightPx < 0 ||
    scale < MIN_SCALE ||
    !isAnchorPoint(anchor)
  ) {
    return null;
  }

  const anchorPosition = anchorForPoint(anchor);
  const widthPx = geometry.widthPx * scale;
  const heightPx = geometry.heightPx * scale;
  if (clampDimensionForNode(widthPx) === null || (heightPx !== 0 && clampDimensionForNode(heightPx) === null)) {
    return null;
  }

  return {
    widthPx,
    heightPx,
    xPx: geometry.xPx + (geometry.widthPx - widthPx) * anchorPosition.x,
    yPx: geometry.yPx + (geometry.heightPx - heightPx) * anchorPosition.y,
  };
}
