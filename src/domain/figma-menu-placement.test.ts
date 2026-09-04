import { describe, expect, it } from 'vitest';
import {
  resolveFigmaMenuHorizontalPlacement,
  resolveFigmaMenuPlacement,
  resolveFigmaMenuRequestedWidth,
} from './figma-menu-placement';

describe('Figma menu placement', () => {
  it('uses the complete Scale field, adds 16 px, and offsets the popup by 8 px', () => {
    const requestedWidth = resolveFigmaMenuRequestedWidth({ triggerWidth: 88, scrollable: false });
    expect(requestedWidth).toBe(104);
    expect(resolveFigmaMenuHorizontalPlacement({
      triggerLeft: 40,
      triggerWidth: 88,
      requestedWidth,
      viewportLeft: 6,
      viewportRight: 294,
    })).toEqual({ left: 32, width: 104 });
  });

  it('keeps the popup inside both horizontal viewport edges', () => {
    expect(resolveFigmaMenuHorizontalPlacement({
      triggerLeft: 2,
      triggerWidth: 104,
      requestedWidth: 120,
      viewportLeft: 6,
      viewportRight: 294,
    })).toEqual({ left: 6, width: 120 });

    expect(resolveFigmaMenuHorizontalPlacement({
      triggerLeft: 270,
      triggerWidth: 104,
      requestedWidth: 120,
      viewportLeft: 6,
      viewportRight: 294,
    })).toEqual({ left: 174, width: 120 });
  });

  it('accounts for the source scrollbar gutter only after the popup scrolls', () => {
    expect(resolveFigmaMenuRequestedWidth({ triggerWidth: 88, scrollable: true })).toBe(106);
  });

  it('aligns the selected row but clamps a tall menu to the plugin viewport', () => {
    expect(resolveFigmaMenuPlacement({
      triggerTop: 180,
      triggerBottom: 204,
      menuHeight: 160,
      contentHeight: 160,
      selectedOffsetTop: 62,
      selectedHeight: 24,
      viewportTop: 0,
      viewportBottom: 220,
    })).toEqual({ top: 54, scrollTop: 0 });

    expect(resolveFigmaMenuPlacement({
      triggerTop: 80,
      triggerBottom: 104,
      menuHeight: 300,
      contentHeight: 300,
      selectedOffsetTop: 180,
      selectedHeight: 24,
      viewportTop: 0,
      viewportBottom: 220,
    })).toEqual({ top: 6, maxHeight: 208, scrollTop: 92 });
  });
});
