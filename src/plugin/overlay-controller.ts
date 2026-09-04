import type { StrokeOutsets } from '../domain/stroke-bounds';

const OVERLAY_PLUGIN_DATA_KEY = 'smart-print-size-overlay';
const OVERLAY_PLUGIN_DATA_VALUE = 'canvas-overlay';
const OVERLAY_NAME = 'Smart Print Size — included stroke boundary';
// A high-contrast green deliberately separates the added stroke boundary from
// Figma's native blue selection outline, including over saturated artwork.
const OVERLAY_COLOR: RGB = { r: 0, g: 230 / 255, b: 118 / 255 };
const GUIDE_SCREEN_STROKE_PX = 2;
const ZOOM_POLL_MS = 120;

export interface OverlayTarget {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly absoluteTransform: Transform;
}

interface OverlayRuntime {
  readonly currentPage: PageNode;
  readonly viewport: Pick<ViewportAPI, 'zoom'>;
  createRectangle(): RectangleNode;
}

interface OverlayControllerOptions {
  setInterval?: typeof setInterval;
  clearInterval?: typeof clearInterval;
}

function finiteNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function hasOutsideStroke(outsets: StrokeOutsets): boolean {
  return outsets.leftPx > 0 || outsets.rightPx > 0 || outsets.topPx > 0 || outsets.bottomPx > 0;
}

function shiftedAbsoluteTransform(transform: Transform, outsets: StrokeOutsets): Transform {
  return [
    [transform[0][0], transform[0][1], transform[0][2] - transform[0][0] * outsets.leftPx - transform[0][1] * outsets.topPx],
    [transform[1][0], transform[1][1], transform[1][2] - transform[1][0] * outsets.leftPx - transform[1][1] * outsets.topPx],
  ];
}

function isUsableTarget(target: OverlayTarget, outsets: StrokeOutsets): boolean {
  return (
    finiteNonNegative(target.width)
    && finiteNonNegative(target.height)
    && finiteNonNegative(outsets.leftPx)
    && finiteNonNegative(outsets.rightPx)
    && finiteNonNegative(outsets.topPx)
    && finiteNonNegative(outsets.bottomPx)
    && hasOutsideStroke(outsets)
  );
}

function hasOverlayStroke(strokes: readonly Paint[] | PluginAPI['mixed']): boolean {
  if (!Array.isArray(strokes)) {
    return false;
  }
  const paintList = strokes as readonly Paint[];
  const stroke = paintList[0];
  return Boolean(
    paintList.length === 1
    && stroke?.type === 'SOLID'
    && stroke.color.r === OVERLAY_COLOR.r
    && stroke.color.g === OVERLAY_COLOR.g
    && stroke.color.b === OVERLAY_COLOR.b,
  );
}

/**
 * Maintains the single temporary scene node used as the included-stroke guide.
 * It deliberately never changes the editor selection or calls commitUndo().
 */
export class OverlayController {
  private readonly figmaApi: OverlayRuntime;
  private overlay: RectangleNode | null = null;
  private target: OverlayTarget | null = null;
  private outsets: StrokeOutsets | null = null;
  private lastZoom: number | null = null;
  private zoomTimer: ReturnType<typeof setInterval> | null = null;
  private readonly startInterval: typeof setInterval;
  private readonly stopInterval: typeof clearInterval;

  constructor(
    figmaApi: OverlayRuntime,
    options: OverlayControllerOptions = {},
  ) {
    this.figmaApi = figmaApi;
    this.startInterval = options.setInterval ?? setInterval;
    this.stopInterval = options.clearInterval ?? clearInterval;
  }

  isOverlayNode(node: unknown): boolean {
    if (!node || typeof node !== 'object' || !('getPluginData' in node)) {
      return false;
    }
    const getPluginData = (node as { getPluginData?: unknown }).getPluginData;
    if (typeof getPluginData !== 'function') {
      return false;
    }
    try {
      return getPluginData.call(node, OVERLAY_PLUGIN_DATA_KEY) === OVERLAY_PLUGIN_DATA_VALUE;
    } catch {
      return false;
    }
  }

  showOverlay(target: OverlayTarget, outsets: StrokeOutsets): void {
    this.updateOverlay(target, outsets);
  }

  updateOverlay(target: OverlayTarget, outsets: StrokeOutsets): void {
    if (!isUsableTarget(target, outsets)) {
      this.removeOverlay();
      return;
    }

    const overlay = this.findOrCreateOverlay(target.id);
    this.target = target;
    this.outsets = outsets;
    this.configureOverlay(overlay, target, outsets);
    this.startZoomMonitor();
  }

  removeOverlay(): void {
    this.stopZoomMonitor();
    if (this.overlay && !this.overlay.removed) {
      this.overlay.remove();
    }
    this.overlay = null;
    this.target = null;
    this.outsets = null;
    this.lastZoom = null;
  }

  /** Removes remnants left by a previously interrupted plugin run on this page. */
  cleanupStaleOverlays(): void {
    for (const node of this.figmaApi.currentPage.children) {
      if (this.isOverlayNode(node)) {
        node.remove();
      }
    }
    this.overlay = null;
    this.target = null;
    this.outsets = null;
    this.lastZoom = null;
    this.stopZoomMonitor();
  }

  private findOrCreateOverlay(targetId: string): RectangleNode {
    const candidates = this.figmaApi.currentPage.children.filter((node) => this.isOverlayNode(node));
    const active = this.overlay && !this.overlay.removed && this.overlay.parent === this.figmaApi.currentPage
      ? this.overlay
      : candidates.shift() as RectangleNode | undefined;

    for (const candidate of candidates) {
      if (candidate !== active) {
        candidate.remove();
      }
    }

    const overlay = active ?? this.figmaApi.createRectangle();
    if (overlay.getPluginData('target-id') !== targetId) {
      overlay.setPluginData('target-id', targetId);
    }
    if (overlay.getPluginData(OVERLAY_PLUGIN_DATA_KEY) !== OVERLAY_PLUGIN_DATA_VALUE) {
      overlay.setPluginData(OVERLAY_PLUGIN_DATA_KEY, OVERLAY_PLUGIN_DATA_VALUE);
    }
    this.overlay = overlay;
    return overlay;
  }

  private configureOverlay(overlay: RectangleNode, target: OverlayTarget, outsets: StrokeOutsets): void {
    const width = target.width + outsets.leftPx + outsets.rightPx;
    const height = target.height + outsets.topPx + outsets.bottomPx;
    if (overlay.width !== width || overlay.height !== height) {
      overlay.resize(width, height);
    }
    const transform = shiftedAbsoluteTransform(target.absoluteTransform, outsets);
    if (JSON.stringify(overlay.relativeTransform) !== JSON.stringify(transform)) {
      overlay.relativeTransform = transform;
    }
    if (overlay.name !== OVERLAY_NAME) {
      overlay.name = OVERLAY_NAME;
    }
    if (overlay.locked !== true) {
      overlay.locked = true;
    }
    const fills = overlay.fills;
    if (!Array.isArray(fills) || (fills as readonly Paint[]).length !== 0) {
      overlay.fills = [];
    }
    if (!hasOverlayStroke(overlay.strokes)) {
      overlay.strokes = [{ type: 'SOLID', color: OVERLAY_COLOR }];
    }
    if (overlay.strokeAlign !== 'INSIDE') {
      overlay.strokeAlign = 'INSIDE';
    }
    this.updateStrokeWeight();
  }

  private updateStrokeWeight(): void {
    if (!this.overlay || this.overlay.removed) {
      return;
    }
    const zoom = this.figmaApi.viewport.zoom;
    if (!Number.isFinite(zoom) || zoom <= 0) {
      return;
    }
    const strokeWeight = GUIDE_SCREEN_STROKE_PX / zoom;
    if (this.overlay.strokeWeight !== strokeWeight) {
      this.overlay.strokeWeight = strokeWeight;
    }
    this.lastZoom = zoom;
  }

  private startZoomMonitor(): void {
    if (this.zoomTimer !== null) {
      return;
    }
    this.zoomTimer = this.startInterval(() => {
      if (!this.overlay || !this.target || !this.outsets) {
        this.stopZoomMonitor();
        return;
      }
      if (this.figmaApi.viewport.zoom !== this.lastZoom) {
        this.updateStrokeWeight();
      }
    }, ZOOM_POLL_MS);
  }

  private stopZoomMonitor(): void {
    if (this.zoomTimer !== null) {
      this.stopInterval(this.zoomTimer);
      this.zoomTimer = null;
    }
  }
}
