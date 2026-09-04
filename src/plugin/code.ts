import { clampDimensionForNode, dimensionsForEdit } from '../domain/geometry';
import { isValidCoordinate } from '../domain/units';
import { isAnchorPoint, scaledGeometry } from '../domain/scale';
import {
  getNodeCapabilities,
  hasAspectRatio,
  hasEditableStrokeWeight,
  hasResize,
  hasRescale,
} from './node-capabilities';
import { getSelectionState } from './selection';
import type { PluginToUiMessage, UiToPluginMessage } from '../types/messages';
import { isUiToPluginMessage } from '../types/messages';

const UI_WIDTH = 300;
const INITIAL_UI_HEIGHT = 348;
const MIN_UI_HEIGHT = 140;
// Both Dimensions and Scale are intentionally visible together. Leave room
// for their full content (and a transient error) instead of forcing an iframe
// scrollbar.
const MAX_UI_HEIGHT = 480;
const REFRESH_DEBOUNCE_MS = 24;

let revision = 0;
let refreshToken = 0;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let attachedPage: PageNode | null = null;
let attachedPageListener: ((event: NodeChangeEvent) => void) | null = null;

figma.showUI(__html__, {
  width: UI_WIDTH,
  height: INITIAL_UI_HEIGHT,
  themeColors: true,
});

function post(message: PluginToUiMessage): void {
  figma.ui.postMessage(message);
}

function notifyError(message: string): void {
  figma.notify(message, { error: true });
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.length > 0 ? error.message : fallback;
}

function selectedNodeById(nodeId: string): SceneNode | null {
  const selection = figma.currentPage.selection;
  if (selection.length !== 1 || selection[0].id !== nodeId) {
    return null;
  }
  return selection[0];
}

function relatedToSelection(changed: SceneNode | RemovedNode, selected: SceneNode | null): boolean {
  if (!selected || changed.id === selected.id) {
    return Boolean(selected && changed.id === selected.id);
  }
  if ('parent' in changed) {
    let current: BaseNode | null = changed.parent;
    while (current && current.type !== 'DOCUMENT') {
      if (current.id === selected.id) {
        return true;
      }
      current = current.parent;
    }
  }
  let current: BaseNode | null = selected.parent;
  while (current && current.type !== 'DOCUMENT') {
    if (current.id === changed.id) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function queueRefresh(): void {
  if (refreshTimer !== null) {
    clearTimeout(refreshTimer);
  }
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshSelection();
  }, REFRESH_DEBOUNCE_MS);
}

function attachCurrentPageListener(): void {
  const page = figma.currentPage;
  if (page === attachedPage) {
    return;
  }

  const previousPage = attachedPage as (PageNode & {
    off?: (type: 'nodechange', callback: (event: NodeChangeEvent) => void) => void;
  }) | null;
  if (previousPage && attachedPageListener && typeof previousPage.off === 'function') {
    previousPage.off('nodechange', attachedPageListener);
  }

  attachedPage = page;
  attachedPageListener = (event) => {
    const selected = figma.currentPage.selection.length === 1 ? figma.currentPage.selection[0] : null;
    if (event.nodeChanges.some((change) => relatedToSelection(change.node, selected))) {
      queueRefresh();
    }
  };
  const pageApi = page as PageNode & {
    on?: (type: 'nodechange', callback: (event: NodeChangeEvent) => void) => void;
  };
  if (typeof pageApi.on === 'function') {
    pageApi.on('nodechange', attachedPageListener);
  }
}

async function refreshSelection(): Promise<void> {
  const token = ++refreshToken;
  const selection = figma.currentPage.selection;

  try {
    const state = await getSelectionState(selection, figma.mixed, {
      getImageByHash: (hash) => figma.getImageByHash(hash),
    });
    if (token !== refreshToken) {
      return;
    }
    revision += 1;
    post({ type: 'selection', selection: state, revision });
  } catch (error) {
    if (token !== refreshToken) {
      return;
    }
    revision += 1;
    const message = errorMessage(error, 'Не удалось прочитать выделенный объект.');
    post({ type: 'error', message, revision });
    notifyError(message);
  }
}

function rejectStaleMessage(): void {
  void refreshSelection();
}

function commitUndoIfChanged(changed: boolean): void {
  if (changed) {
    figma.commitUndo();
  }
}

function applyPosition(message: Extract<UiToPluginMessage, { type: 'set-position' }>): void {
  const node = selectedNodeById(message.nodeId);
  if (!node || message.revision > revision) {
    rejectStaleMessage();
    return;
  }

  if (!isValidCoordinate(message.valuePx)) {
    throw new Error('Введите корректное числовое значение позиции.');
  }

  const capabilities = getNodeCapabilities(node);
  if (capabilities.locked) {
    throw new Error('Заблокированный объект нельзя изменить.');
  }
  if (capabilities.autoLayoutPosition) {
    throw new Error('Позиция дочернего объекта Auto Layout управляется Figma.');
  }
  if (message.axis === 'x' && !capabilities.canMoveX || message.axis === 'y' && !capabilities.canMoveY) {
    throw new Error('Позиция этого объекта недоступна для редактирования.');
  }

  const oldValue = message.axis === 'x' ? node.x : node.y;
  if (message.axis === 'x') {
    node.x = message.valuePx;
  } else {
    node.y = message.valuePx;
  }
  commitUndoIfChanged(oldValue !== message.valuePx);
}

function applyDimension(message: Extract<UiToPluginMessage, { type: 'set-dimension' }>): void {
  const node = selectedNodeById(message.nodeId);
  if (!node || message.revision > revision) {
    rejectStaleMessage();
    return;
  }

  const capabilities = getNodeCapabilities(node);
  if (capabilities.locked) {
    throw new Error('Заблокированный объект нельзя изменить.');
  }
  if (capabilities.missingFont) {
    throw new Error('Размер нельзя изменить: в объекте используется отсутствующий шрифт.');
  }
  if (!capabilities.canResize || (message.axis === 'width' && !capabilities.canResizeWidth) || (message.axis === 'height' && !capabilities.canResizeHeight)) {
    throw new Error('Размер этого объекта недоступен для редактирования.');
  }

  const next = dimensionsForEdit(
    { widthPx: node.width, heightPx: node.height },
    message.axis,
    message.valuePx,
    capabilities.aspectLocked,
    capabilities.aspectRatio,
    node.type === 'LINE',
  );
  if (!next) {
    throw new Error('Размер должен быть не меньше 0,01 px.');
  }

  const width = clampDimensionForNode(next.widthPx);
  const height = node.type === 'LINE' ? 0 : clampDimensionForNode(next.heightPx);
  if (width === null || height === null) {
    throw new Error('Размер должен быть не меньше 0,01 px.');
  }

  const changed = width !== node.width || height !== node.height;
  if (!hasResize(node)) {
    throw new Error('Размер этого объекта недоступен для редактирования.');
  }
  node.resize(width, height);
  commitUndoIfChanged(changed);
}

function applyStrokeWeight(message: Extract<UiToPluginMessage, { type: 'set-stroke-weight' }>): void {
  const node = selectedNodeById(message.nodeId);
  if (!node || message.revision > revision) {
    rejectStaleMessage();
    return;
  }

  if (!Number.isFinite(message.valuePx) || message.valuePx < 0) {
    throw new Error('Толщина обводки должна быть неотрицательным числом.');
  }

  const capabilities = getNodeCapabilities(node);
  if (capabilities.locked) {
    throw new Error('Заблокированный объект нельзя изменить.');
  }
  if (!hasEditableStrokeWeight(node)) {
    throw new Error('Толщина обводки этого объекта недоступна для редактирования.');
  }

  const oldWeight = node.strokeWeight;
  node.strokeWeight = message.valuePx;
  commitUndoIfChanged(oldWeight !== message.valuePx);
}

function applyAspectLock(message: Extract<UiToPluginMessage, { type: 'set-aspect-lock' }>): void {
  const node = selectedNodeById(message.nodeId);
  if (!node || message.revision > revision) {
    rejectStaleMessage();
    return;
  }

  const capabilities = getNodeCapabilities(node);
  if (!capabilities.aspectSupported) {
    throw new Error('Для этого объекта блокировка пропорций недоступна.');
  }
  if (capabilities.locked) {
    throw new Error('Заблокированный объект нельзя изменить.');
  }

  if (!hasAspectRatio(node)) {
    throw new Error('Для этого объекта блокировка пропорций недоступна.');
  }

  if (message.locked && !capabilities.aspectLocked) {
    node.lockAspectRatio();
    figma.commitUndo();
  } else if (!message.locked && capabilities.aspectLocked) {
    node.unlockAspectRatio();
    figma.commitUndo();
  }
}

function applyScale(message: Extract<UiToPluginMessage, { type: 'set-scale' }>): void {
  const node = selectedNodeById(message.nodeId);
  if (!node || message.revision > revision) {
    rejectStaleMessage();
    return;
  }

  if (!Number.isFinite(message.scale) || message.scale < 0.01 || !isAnchorPoint(message.anchor)) {
    throw new Error('Введите корректный коэффициент масштаба.');
  }

  const capabilities = getNodeCapabilities(node);
  if (capabilities.locked) {
    throw new Error('Заблокированный объект нельзя изменить.');
  }
  if (capabilities.missingFont) {
    throw new Error('Масштаб нельзя изменить: в объекте используется отсутствующий шрифт.');
  }
  if (!capabilities.canScale) {
    throw new Error('Масштаб этого объекта недоступен для редактирования.');
  }

  const before = {
    xPx: node.x,
    yPx: node.y,
    widthPx: node.width,
    heightPx: node.height,
  };
  const next = scaledGeometry(before, message.scale, message.anchor);
  if (!next) {
    throw new Error('Масштаб должен быть не меньше 0,01.');
  }

  const targetWidth = clampDimensionForNode(next.widthPx);
  const targetHeight = node.type === 'LINE' ? 0 : clampDimensionForNode(next.heightPx);
  if (targetWidth === null || targetHeight === null) {
    throw new Error('Масштаб приводит к недопустимому размеру объекта.');
  }

  if (hasRescale(node)) {
    node.rescale(message.scale);
  } else if (hasResize(node)) {
    node.resize(targetWidth, targetHeight);
  } else {
    throw new Error('Масштаб этого объекта недоступен для редактирования.');
  }

  // Figma's native rescale operation is anchored at the top-left. Move the
  // node after rescaling so the selected 3×3 anchor remains stationary.
  // Use the exact geometric target when resize() was the fallback. For
  // rescale(), derive the position from the actual post-operation dimensions
  // to avoid accumulating rounding in Figma's internal geometry.
  const anchorColumn = (message.anchor % 3) / 2;
  const anchorRow = Math.floor(message.anchor / 3) / 2;
  const nextX = before.xPx + (before.widthPx - node.width) * anchorColumn;
  const nextY = before.yPx + (before.heightPx - node.height) * anchorRow;
  if (capabilities.canMoveX) {
    node.x = nextX;
  }
  if (capabilities.canMoveY) {
    node.y = nextY;
  }

  const changed = before.xPx !== node.x || before.yPx !== node.y || before.widthPx !== node.width || before.heightPx !== node.height;
  commitUndoIfChanged(changed);
}

function handleGeometryMessage(message: UiToPluginMessage): void {
  try {
    if (message.type === 'set-position') {
      applyPosition(message);
    } else if (message.type === 'set-dimension') {
      applyDimension(message);
    } else if (message.type === 'set-stroke-weight') {
      applyStrokeWeight(message);
    } else if (message.type === 'set-aspect-lock') {
      applyAspectLock(message);
    } else if (message.type === 'set-scale') {
      applyScale(message);
    } else {
      return;
    }
    void refreshSelection();
  } catch (error) {
    const messageText = errorMessage(error, 'Не удалось изменить геометрию объекта.');
    post({ type: 'error', message: messageText, revision, nodeId: message.type === 'resize' ? undefined : message.nodeId });
    notifyError(messageText);
    void refreshSelection();
  }
}

figma.on('selectionchange', () => {
  attachCurrentPageListener();
  queueRefresh();
});

figma.on('currentpagechange', () => {
  attachCurrentPageListener();
  queueRefresh();
});

figma.ui.onmessage = (message: unknown) => {
  if (!isUiToPluginMessage(message)) {
    return;
  }

  if (message.type === 'resize') {
    const height = Math.round(Math.min(MAX_UI_HEIGHT, Math.max(MIN_UI_HEIGHT, message.height)));
    figma.ui.resize(UI_WIDTH, height);
    return;
  }

  handleGeometryMessage(message);
};

attachCurrentPageListener();

async function initialize(): Promise<void> {
  // Dynamic-page documents can expose the current page before its selection
  // has been hydrated in the plugin VM. Loading the page first keeps the
  // initial snapshot consistent with a selection that existed before launch.
  try {
    await figma.currentPage.loadAsync();
  } catch {
    // Older runtimes may not expose page loading; selectionchange still keeps
    // the panel synchronized after launch.
  }
  await refreshSelection();
}

void initialize().then(() => {
  // A Developer VM can hydrate the editor selection a little after the page
  // itself. A few cheap retries make launch-with-existing-selection behave
  // like a normal selectionchange without keeping a polling loop alive.
  for (const delay of [150, 500, 1200]) {
    setTimeout(() => void refreshSelection(), delay);
  }
});
