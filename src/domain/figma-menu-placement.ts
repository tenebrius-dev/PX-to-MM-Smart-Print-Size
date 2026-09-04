export interface FigmaMenuPlacement {
  top: number;
  maxHeight?: number;
  scrollTop: number;
}

export interface FigmaMenuHorizontalPlacement {
  left: number;
  width: number;
}

export const FIGMA_MENU_LEFT_OFFSET = 8;
export const FIGMA_MENU_EXTRA_WIDTH = 16;
export const FIGMA_MENU_MIN_WIDTH = 80;
export const FIGMA_MENU_SCROLL_GAP = 2;
export const FIGMA_MENU_SCROLLBAR_WIDTH = 6;
export const FIGMA_MENU_SCROLL_RIGHT_GAP = 2;
export const FIGMA_MENU_SCROLL_EXTRA_WIDTH = FIGMA_MENU_LEFT_OFFSET
  + FIGMA_MENU_SCROLL_GAP
  + FIGMA_MENU_SCROLLBAR_WIDTH
  + FIGMA_MENU_SCROLL_RIGHT_GAP;

export function resolveFigmaMenuRequestedWidth(input: {
  triggerWidth: number;
  scrollable: boolean;
}): number {
  const triggerWidth = Math.max(0, input.triggerWidth);
  return Math.max(
    FIGMA_MENU_MIN_WIDTH,
    triggerWidth + (input.scrollable ? FIGMA_MENU_SCROLL_EXTRA_WIDTH : FIGMA_MENU_EXTRA_WIDTH),
  );
}

export function resolveFigmaMenuHorizontalPlacement(input: {
  triggerLeft: number;
  triggerWidth: number;
  requestedWidth: number;
  leftOffset?: number;
  viewportLeft: number;
  viewportRight: number;
}): FigmaMenuHorizontalPlacement {
  const viewportLeft = Math.min(input.viewportLeft, input.viewportRight);
  const viewportRight = Math.max(input.viewportLeft, input.viewportRight);
  const availableWidth = Math.max(0, viewportRight - viewportLeft);
  const width = Math.min(Math.max(0, input.requestedWidth), availableWidth);
  const triggerWidth = Math.max(0, input.triggerWidth);
  const leftOffset = Math.max(0, input.leftOffset ?? (input.requestedWidth - triggerWidth) / 2);
  const idealLeft = input.triggerLeft - leftOffset;

  return {
    left: Math.min(viewportRight - width, Math.max(viewportLeft, idealLeft)),
    width,
  };
}

/**
 * Matches PDF Smart Import's Figma dropdown placement: the selected row is
 * aligned to the field where possible, then the complete menu is clamped to
 * the visible plugin viewport.
 */
export function resolveFigmaMenuPlacement(input: {
  triggerTop: number;
  triggerBottom: number;
  menuHeight: number;
  contentHeight?: number;
  selectedOffsetTop: number;
  selectedHeight: number;
  viewportTop: number;
  viewportBottom: number;
  gap?: number;
}): FigmaMenuPlacement {
  const gap = Math.max(0, input.gap ?? 6);
  const viewportTop = Math.max(0, input.viewportTop);
  const viewportBottom = Math.max(viewportTop, input.viewportBottom);
  const menuHeight = Math.max(0, input.menuHeight);
  const contentHeight = Math.max(menuHeight, input.contentHeight ?? menuHeight);
  const minTop = Math.min(viewportBottom, viewportTop + gap);
  const maxBottom = Math.max(minTop, viewportBottom - gap);
  const availableHeight = Math.max(0, maxBottom - minTop);
  const visibleHeight = Math.min(menuHeight, availableHeight);
  const triggerCenter = (input.triggerTop + input.triggerBottom) / 2;
  const selectedCenter = Math.min(
    contentHeight,
    Math.max(0, input.selectedOffsetTop + input.selectedHeight / 2),
  );
  const idealTop = triggerCenter - selectedCenter;
  const maxTop = Math.max(minTop, maxBottom - visibleHeight);
  const top = Math.min(maxTop, Math.max(minTop, idealTop));
  const maxScrollTop = Math.max(0, contentHeight - visibleHeight);
  const scrollTop = Math.min(maxScrollTop, Math.max(0, selectedCenter - (triggerCenter - top)));

  return {
    top,
    ...(menuHeight > availableHeight ? { maxHeight: availableHeight } : {}),
    scrollTop,
  };
}
