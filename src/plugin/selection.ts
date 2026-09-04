import { getNodeCapabilities, getStrokeCapabilities } from './node-capabilities';
import { inspectRasterNode, type ImageResolver } from './raster';
import type { GeometrySnapshot, SelectionState } from '../types/messages';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export async function getSelectionState(
  selection: readonly unknown[],
  mixedValue: unknown,
  resolver: ImageResolver,
): Promise<SelectionState> {
  if (selection.length === 0) {
    return { kind: 'empty' };
  }
  if (selection.length > 1) {
    return { kind: 'multiple', count: selection.length };
  }

  const candidate = selection[0];
  if (!candidate || typeof candidate !== 'object') {
    return { kind: 'invalid', message: 'Не удалось прочитать выделенный объект.' };
  }

  const node = candidate as {
    id?: unknown;
    name?: unknown;
    type?: unknown;
    x?: unknown;
    y?: unknown;
    width?: unknown;
    height?: unknown;
  };
  if (typeof node.id !== 'string' || typeof node.name !== 'string' || typeof node.type !== 'string') {
    return { kind: 'invalid', message: 'У выделенного объекта отсутствуют геометрические данные.' };
  }

  if (!finite(node.x) || !finite(node.y) || !finite(node.width) || !finite(node.height)) {
    return { kind: 'invalid', message: 'Не удалось прочитать геометрию выделенного объекта.' };
  }

  const capabilities = getNodeCapabilities(candidate);
  const stroke = getStrokeCapabilities(candidate);
  // Geometry snapshots stay synchronous in practice even for very large
  // frames. A selected group is resized as one node; descendants do not need
  // to be traversed merely to paint the compact panel.
  const raster = await inspectRasterNode(candidate, mixedValue, resolver, false);
  const snapshot: GeometrySnapshot = {
    id: node.id,
    name: node.name,
    type: node.type,
    xPx: node.x,
    yPx: node.y,
    widthPx: node.width,
    heightPx: node.height,
    canMoveX: capabilities.canMoveX,
    canMoveY: capabilities.canMoveY,
    canResizeWidth: capabilities.canResizeWidth,
    canResizeHeight: capabilities.canResizeHeight,
    canScale: capabilities.canScale,
    aspectSupported: capabilities.aspectSupported,
    aspectLocked: capabilities.aspectLocked,
    aspectRatio: capabilities.aspectRatio,
    locked: capabilities.locked,
    autoLayoutPosition: capabilities.autoLayoutPosition,
    missingFont: capabilities.missingFont,
    stroke: {
      present: stroke.present,
      weightPx: stroke.weightPx,
      canEdit: stroke.present && stroke.weightPx !== null && !capabilities.locked,
      outerWidthPx: stroke.outerBounds.widthPx,
      outerHeightPx: stroke.outerBounds.heightPx,
    },
    raster,
  };
  return { kind: 'selected', node: snapshot };
}
