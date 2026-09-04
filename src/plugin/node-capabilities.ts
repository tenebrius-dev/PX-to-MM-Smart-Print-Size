import { currentAspectRatio } from '../domain/geometry';
import type { NodeDimensions } from '../domain/geometry';
import {
  strokeOuterBounds,
  strokeOutsets,
  type StrokeAlignment,
  type StrokeOuterBounds,
  type StrokeOutsets,
} from '../domain/stroke-bounds';

interface RecordLike {
  [key: string]: unknown;
}

export interface AspectRatioLike {
  readonly x: number;
  readonly y: number;
}

export interface ResizableNodeLike {
  readonly width: number;
  readonly height: number;
  resize(width: number, height: number): void;
}

export interface RescalableNodeLike {
  readonly width: number;
  readonly height: number;
  rescale(scale: number): void;
}

export interface AspectRatioNodeLike {
  readonly targetAspectRatio: AspectRatioLike | null;
  lockAspectRatio(): void;
  unlockAspectRatio(): void;
}

export interface StrokeWeightNodeLike {
  readonly strokes: readonly unknown[];
  strokeWeight: number;
}

export interface StrokeCapabilities {
  /** At least one stroke paint is configured and visible. */
  present: boolean;
  weightPx: number | null;
  outerBounds: StrokeOuterBounds;
  /** `null` means that no exact per-edge geometry is available. */
  outsets: StrokeOutsets | null;
}

export interface NodeCapabilities {
  canResize: boolean;
  canMove: boolean;
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
}

function asRecord(value: unknown): RecordLike | null {
  return typeof value === 'object' && value !== null ? value as RecordLike : null;
}

function readString(value: unknown, key: string): string | null {
  const record = asRecord(value);
  return typeof record?.[key] === 'string' ? record[key] as string : null;
}

function readNumber(value: unknown, key: string): number | null {
  const record = asRecord(value);
  const candidate = record?.[key];
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
}

export function hasResize(node: unknown): node is ResizableNodeLike {
  const record = asRecord(node);
  return (
    typeof record?.resize === 'function' &&
    readNumber(node, 'width') !== null &&
    readNumber(node, 'height') !== null
  );
}

export function hasRescale(node: unknown): node is RescalableNodeLike {
  const record = asRecord(node);
  return (
    typeof record?.rescale === 'function' &&
    readNumber(node, 'width') !== null &&
    readNumber(node, 'height') !== null
  );
}

export function hasAspectRatio(node: unknown): node is AspectRatioNodeLike {
  const record = asRecord(node);
  return (
    typeof record?.lockAspectRatio === 'function' &&
    typeof record?.unlockAspectRatio === 'function' &&
    'targetAspectRatio' in record
  );
}

/**
 * Figma exposes one `strokeWeight` only while every side/vertex has the same
 * thickness. Preserve a mixed value instead of pretending that one side is
 * representative of the entire object.
 */
export function getStrokeCapabilities(node: unknown): StrokeCapabilities {
  const record = asRecord(node);
  const strokes = record?.strokes;
  // Figma keeps a hidden paint in `strokes` and flips its `visible` flag.
  // Hidden paints must behave exactly like no stroke for both the displayed
  // dimensions and the editable Stroke control. A missing flag is the normal
  // visible-paint shape in older/runtime-mocked nodes, so only `false` hides it.
  const present = Array.isArray(strokes)
    && strokes.some((paint) => asRecord(paint)?.visible !== false);
  const weightPx = present ? readNumber(node, 'strokeWeight') : null;
  const alignmentValue = present ? readString(node, 'strokeAlign') : null;
  const alignment: StrokeAlignment | null = alignmentValue === 'CENTER'
    || alignmentValue === 'INSIDE'
    || alignmentValue === 'OUTSIDE'
    ? alignmentValue
    : null;
  const sideWeight = (side: 'Top' | 'Right' | 'Bottom' | 'Left'): number | null => (
    readNumber(node, `stroke${side}Weight`) ?? weightPx
  );

  const sides = {
    topPx: sideWeight('Top'),
    rightPx: sideWeight('Right'),
    bottomPx: sideWeight('Bottom'),
    leftPx: sideWeight('Left'),
  };

  return {
    present,
    weightPx,
    outerBounds: present
      ? strokeOuterBounds(alignment, sides)
      : { widthPx: null, heightPx: null },
    outsets: present ? strokeOutsets(alignment, sides) : null,
  };
}

export function hasEditableStrokeWeight(node: unknown): node is StrokeWeightNodeLike {
  const stroke = getStrokeCapabilities(node);
  return stroke.present && stroke.weightPx !== null;
}

export function isEffectivelyLocked(node: unknown): boolean {
  let current: unknown = node;
  const visited = new Set<unknown>();

  while (current && !visited.has(current)) {
    visited.add(current);
    const record = asRecord(current);
    if (record?.locked === true) {
      return true;
    }
    current = record?.parent ?? null;
  }

  return false;
}

export function isAutoLayoutPosition(node: unknown): boolean {
  const record = asRecord(node);
  if (record?.layoutPositioning !== 'AUTO') {
    return false;
  }

  const parent = asRecord(record.parent);
  return parent?.layoutMode !== undefined && parent.layoutMode !== 'NONE';
}

export function hasMissingFontInSubtree(node: unknown): boolean {
  const record = asRecord(node);
  if (record?.hasMissingFont === true) {
    return true;
  }

  const children = record?.children;
  if (!Array.isArray(children)) {
    return false;
  }
  return children.some((child) => hasMissingFontInSubtree(child));
}

function readTargetAspectRatio(node: AspectRatioNodeLike): number | null {
  try {
    const ratio = node.targetAspectRatio;
    if (!ratio || !Number.isFinite(ratio.x) || !Number.isFinite(ratio.y) || ratio.x <= 0 || ratio.y <= 0) {
      return null;
    }
    return ratio.x / ratio.y;
  } catch {
    return null;
  }
}

export function getNodeCapabilities(node: unknown): NodeCapabilities {
  const type = readString(node, 'type');
  const dimensions: NodeDimensions = {
    widthPx: readNumber(node, 'width') ?? Number.NaN,
    heightPx: readNumber(node, 'height') ?? Number.NaN,
  };
  const resizable = hasResize(node);
  const rescalable = hasRescale(node);
  const textAutoResize = readString(node, 'textAutoResize');
  const autoResizeText = type === 'TEXT' && textAutoResize !== null && textAutoResize !== 'NONE';
  const aspectSupported = hasAspectRatio(node) && type !== 'LINE' && !autoResizeText;
  const targetRatio = hasAspectRatio(node) ? readTargetAspectRatio(node) : null;
  const calculatedRatio = type === 'LINE' ? null : currentAspectRatio(dimensions);
  const locked = isEffectivelyLocked(node);
  const autoLayoutPosition = isAutoLayoutPosition(node);
  // Do not recursively walk a large frame just to determine whether its
  // dimensions can be edited. The missing-font guard is actionable for a
  // selected TEXT node; container resizing remains available and Figma will
  // report an API error if a particular document disallows it.
  const missingFont = type === 'TEXT' && hasMissingFontInSubtree(node);
  // Figma warns specifically when resizing a text node whose own font is
  // missing. Containers may still be resized: their children are laid out by
  // Figma, and refusing a whole frame because it contains one text child is
  // more restrictive than the native properties panel.
  const blockedByMissingFont = type === 'TEXT' && missingFont;
  const editable = resizable && !locked && !blockedByMissingFont;

  return {
    canResize: resizable,
    canMove: !locked && !autoLayoutPosition,
    canMoveX: !locked && !autoLayoutPosition,
    canMoveY: !locked && !autoLayoutPosition,
    canResizeWidth: editable,
    canResizeHeight: editable && type !== 'LINE',
    canScale: (resizable || rescalable) && !locked && !blockedByMissingFont,
    aspectSupported,
    aspectLocked: aspectSupported && targetRatio !== null,
    aspectRatio: aspectSupported ? targetRatio ?? calculatedRatio : null,
    locked,
    autoLayoutPosition,
    missingFont,
  };
}
