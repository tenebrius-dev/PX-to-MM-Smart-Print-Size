import type { AnchorPoint } from '../domain/scale';

export type SelectionKind = 'empty' | 'multiple' | 'selected' | 'unsupported' | 'invalid';

export interface RasterSnapshot {
  detected: boolean;
  status: 'not-applicable' | 'ready' | 'unavailable';
  widthPx?: number;
  heightPx?: number;
}

export interface StrokeSnapshot {
  /** The object has at least one configured and visible stroke paint. */
  present: boolean;
  /** `null` represents Figma's mixed per-side/vertex stroke thickness. */
  weightPx: number | null;
  canEdit: boolean;
  /** Total painted stroke extent outside the object's width contour. */
  outerWidthPx: number | null;
  /** Total painted stroke extent outside the object's height contour. */
  outerHeightPx: number | null;
}

export interface GeometrySnapshot {
  id: string;
  name: string;
  type: string;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  canMoveX: boolean;
  canMoveY: boolean;
  canResizeWidth: boolean;
  canResizeHeight: boolean;
  canScale: boolean;
  aspectSupported: boolean;
  aspectLocked: boolean;
  aspectRatio: number | null;
  locked: boolean;
  autoLayoutPosition: boolean;
  missingFont: boolean;
  stroke: StrokeSnapshot;
  raster: RasterSnapshot;
}

export type SelectionState =
  | { kind: 'empty' }
  | { kind: 'multiple'; count: number }
  | { kind: 'unsupported'; nodeType: string }
  | { kind: 'invalid'; message?: string }
  | { kind: 'selected'; node: GeometrySnapshot };

export type PluginToUiMessage =
  | { type: 'selection'; selection: SelectionState; revision: number }
  | { type: 'error'; message: string; revision: number; nodeId?: string };

export type DimensionAxis = 'width' | 'height';
export type PositionAxis = 'x' | 'y';

export type UiToPluginMessage =
  | { type: 'resize'; height: number }
  | {
      type: 'set-position';
      nodeId: string;
      revision: number;
      axis: PositionAxis;
      valuePx: number;
    }
  | {
      type: 'set-dimension';
      nodeId: string;
      revision: number;
      axis: DimensionAxis;
      valuePx: number;
    }
  | {
      type: 'set-stroke-weight';
      nodeId: string;
      revision: number;
      valuePx: number;
    }
  | {
      type: 'set-scale';
      nodeId: string;
      revision: number;
      scale: number;
      anchor: AnchorPoint;
    }
  | {
      type: 'set-aspect-lock';
      nodeId: string;
      revision: number;
      locked: boolean;
    };

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isSelectionState(value: unknown): value is SelectionState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as { kind?: unknown; count?: unknown; nodeType?: unknown; node?: unknown; message?: unknown };
  if (state.kind === 'empty') {
    return true;
  }
  if (state.kind === 'multiple') {
    return typeof state.count === 'number' && Number.isInteger(state.count) && state.count > 1;
  }
  if (state.kind === 'unsupported') {
    return typeof state.nodeType === 'string' && state.nodeType.length > 0;
  }
  if (state.kind === 'invalid') {
    return state.message === undefined || typeof state.message === 'string';
  }
  if (state.kind !== 'selected' || !state.node || typeof state.node !== 'object') {
    return false;
  }

  const node = state.node as Partial<GeometrySnapshot>;
  return (
    typeof node.id === 'string' &&
    typeof node.name === 'string' &&
    typeof node.type === 'string' &&
    isFiniteNumber(node.xPx) &&
    isFiniteNumber(node.yPx) &&
    isFiniteNumber(node.widthPx) &&
    isFiniteNumber(node.heightPx) &&
    typeof node.canMoveX === 'boolean' &&
    typeof node.canMoveY === 'boolean' &&
    typeof node.canResizeWidth === 'boolean' &&
    typeof node.canResizeHeight === 'boolean' &&
    typeof node.canScale === 'boolean' &&
    typeof node.aspectSupported === 'boolean' &&
    typeof node.aspectLocked === 'boolean' &&
    (node.aspectRatio === null || isFiniteNumber(node.aspectRatio)) &&
    typeof node.locked === 'boolean' &&
    typeof node.autoLayoutPosition === 'boolean' &&
    typeof node.missingFont === 'boolean' &&
    Boolean(node.stroke) &&
    typeof node.stroke === 'object' &&
    typeof node.stroke.present === 'boolean' &&
    (node.stroke.weightPx === null || isFiniteNumber(node.stroke.weightPx)) &&
    typeof node.stroke.canEdit === 'boolean' &&
    (node.stroke.outerWidthPx === null || isFiniteNumber(node.stroke.outerWidthPx)) &&
    (node.stroke.outerHeightPx === null || isFiniteNumber(node.stroke.outerHeightPx)) &&
    Boolean(node.raster) &&
    typeof node.raster === 'object'
  );
}

export function isPluginToUiMessage(value: unknown): value is PluginToUiMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as { type?: unknown; revision?: unknown; selection?: unknown; message?: unknown };
  if (!isFiniteNumber(message.revision) || !Number.isInteger(message.revision) || message.revision < 0) {
    return false;
  }
  if (message.type === 'selection') {
    return isSelectionState(message.selection);
  }
  return message.type === 'error' && typeof message.message === 'string' && message.message.length > 0;
}

export function isUiToPluginMessage(value: unknown): value is UiToPluginMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Partial<UiToPluginMessage> & { type?: unknown };
  if (message.type === 'resize') {
    return isFiniteNumber(message.height) && message.height > 0;
  }

  if (message.type === 'set-position') {
    return (
      typeof message.nodeId === 'string' &&
      isFiniteNumber(message.revision) &&
      Number.isInteger(message.revision) &&
      message.revision >= 0 &&
      (message.axis === 'x' || message.axis === 'y') &&
      isFiniteNumber(message.valuePx)
    );
  }

  if (message.type === 'set-dimension') {
    return (
      typeof message.nodeId === 'string' &&
      isFiniteNumber(message.revision) &&
      Number.isInteger(message.revision) &&
      message.revision >= 0 &&
      (message.axis === 'width' || message.axis === 'height') &&
      isFiniteNumber(message.valuePx)
    );
  }

  if (message.type === 'set-stroke-weight') {
    return (
      typeof message.nodeId === 'string' &&
      isFiniteNumber(message.revision) &&
      Number.isInteger(message.revision) &&
      message.revision >= 0 &&
      isFiniteNumber(message.valuePx) &&
      message.valuePx >= 0
    );
  }

  if (message.type === 'set-scale') {
    const anchor = message.anchor;
    return (
      typeof message.nodeId === 'string' &&
      isFiniteNumber(message.revision) &&
      Number.isInteger(message.revision) &&
      message.revision >= 0 &&
      isFiniteNumber(message.scale) &&
      message.scale >= 0.01 &&
      typeof anchor === 'number' &&
      Number.isInteger(anchor) &&
      anchor >= 0 &&
      anchor <= 8
    );
  }

  return (
    message.type === 'set-aspect-lock' &&
    typeof message.nodeId === 'string' &&
    isFiniteNumber(message.revision) &&
    Number.isInteger(message.revision) &&
    message.revision >= 0 &&
    typeof message.locked === 'boolean'
  );
}
