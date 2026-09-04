import { isValidDimension, MIN_NODE_SIZE_PX } from './units';

export type DimensionAxis = 'width' | 'height';

export interface NodeDimensions {
  widthPx: number;
  heightPx: number;
}

export function currentAspectRatio(dimensions: NodeDimensions): number | null {
  if (!isValidDimension(dimensions.widthPx) || !isValidDimension(dimensions.heightPx)) {
    return null;
  }
  return dimensions.widthPx / dimensions.heightPx;
}

export function dimensionsForEdit(
  dimensions: NodeDimensions,
  axis: DimensionAxis,
  valuePx: number,
  keepAspect: boolean,
  ratio: number | null,
  allowZeroHeight = false,
): NodeDimensions | null {
  if (!Number.isFinite(valuePx)) {
    return null;
  }

  const nextRatio = keepAspect && ratio !== null && Number.isFinite(ratio) && ratio > 0
    ? ratio
    : null;
  const width = axis === 'width' ? valuePx : dimensions.widthPx;
  const height = axis === 'height' ? valuePx : dimensions.heightPx;

  if (nextRatio !== null) {
    if (axis === 'width') {
      return {
        widthPx: valuePx,
        heightPx: valuePx / nextRatio,
      };
    }
    return {
      widthPx: valuePx * nextRatio,
      heightPx: valuePx,
    };
  }

  if (!isValidDimension(width) || !isValidDimension(height, allowZeroHeight)) {
    return null;
  }

  return { widthPx: width, heightPx: height };
}

export function clampDimensionForNode(valuePx: number, allowZero = false): number | null {
  if (!Number.isFinite(valuePx)) {
    return null;
  }
  if (allowZero && valuePx === 0) {
    return 0;
  }
  return valuePx >= MIN_NODE_SIZE_PX ? valuePx : null;
}
