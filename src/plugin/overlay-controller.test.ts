import { describe, expect, it, vi } from 'vitest';
import { OverlayController, type OverlayTarget } from './overlay-controller';
import type { StrokeOutsets } from '../domain/stroke-bounds';

const outside: StrokeOutsets = { leftPx: 2, rightPx: 6, topPx: 1, bottomPx: 3 };

class FakePage {
  id = 'page-1';
  children: FakeRectangle[] = [];
}

class FakeRectangle {
  id = `overlay-${Math.random()}`;
  name = '';
  width = 100;
  height = 100;
  relativeTransform: Transform = [[1, 0, 0], [0, 1, 0]];
  locked = false;
  fills: Paint[] = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }];
  strokes: Paint[] = [];
  strokeAlign: 'CENTER' | 'INSIDE' | 'OUTSIDE' = 'CENTER';
  strokeWeight = 1;
  removed = false;
  readonly data = new Map<string, string>();

  readonly parent: FakePage;

  constructor(parent: FakePage) {
    this.parent = parent;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  remove(): void {
    this.removed = true;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) {
      this.parent.children.splice(index, 1);
    }
  }

  getPluginData(key: string): string {
    return this.data.get(key) ?? '';
  }

  setPluginData(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function target(transform: Transform = [[1, 0, 10], [0, 1, 20]]): OverlayTarget {
  return { id: 'target', width: 100, height: 50, absoluteTransform: transform };
}

function testController() {
  let page = new FakePage();
  let zoom = 1;
  let tick: (() => void) | null = null;
  const createRectangle = vi.fn(() => {
    const rectangle = new FakeRectangle(page);
    page.children.push(rectangle);
    return rectangle as unknown as RectangleNode;
  });
  const setIntervalMock = vi.fn((callback: () => void) => {
    tick = callback;
    return 1 as unknown as ReturnType<typeof setInterval>;
  });
  const clearIntervalMock = vi.fn();
  const runtime = {
    get currentPage() {
      return page as unknown as PageNode;
    },
    viewport: {
      get zoom() {
        return zoom;
      },
    },
    createRectangle,
  };
  const controller = new OverlayController(runtime, {
    setInterval: setIntervalMock as unknown as typeof setInterval,
    clearInterval: clearIntervalMock as unknown as typeof clearInterval,
  });

  return {
    controller,
    createRectangle,
    clearIntervalMock,
    get overlay() {
      return page.children[0];
    },
    set page(nextPage: FakePage) {
      page = nextPage;
    },
    get page() {
      return page;
    },
    set zoom(nextZoom: number) {
      zoom = nextZoom;
    },
    tick: () => tick?.(),
  };
}

describe('OverlayController', () => {
  it('draws one locked, fill-free guide at the exact outside rectangle without changing selection', () => {
    const fixture = testController();
    const selection = ['target'];

    fixture.controller.showOverlay(target(), outside);

    expect(fixture.createRectangle).toHaveBeenCalledTimes(1);
    expect(fixture.overlay).toMatchObject({
      name: 'Smart Print Size — included stroke boundary',
      width: 108,
      height: 54,
      relativeTransform: [[1, 0, 8], [0, 1, 19]],
      locked: true,
      fills: [],
      strokeAlign: 'INSIDE',
      strokeWeight: 2,
    });
    expect(fixture.overlay.strokes).toEqual([{ type: 'SOLID', color: { r: 0, g: 230 / 255, b: 118 / 255 } }]);
    expect(selection).toEqual(['target']);
  });

  it('keeps the target orientation for 90 degree and arbitrary transforms', () => {
    const fixture = testController();
    fixture.controller.updateOverlay(target([[0, -1, 100], [1, 0, 50]]), outside);
    expect(fixture.overlay.relativeTransform).toEqual([[0, -1, 101], [1, 0, 48]]);

    fixture.controller.updateOverlay(target([[0.8, -0.6, 100], [0.6, 0.8, 50]]), outside);
    expect(fixture.overlay.relativeTransform).toEqual([[0.8, -0.6, 99], [0.6, 0.8, 48]]);
  });

  it('does not create a guide for inside, zero, or unknown external geometry', () => {
    const fixture = testController();
    fixture.controller.updateOverlay(target(), { leftPx: 0, rightPx: 0, topPx: 0, bottomPx: 0 });
    expect(fixture.createRectangle).not.toHaveBeenCalled();
  });

  it('updates one existing guide and removes duplicate or stale guides', () => {
    const fixture = testController();
    fixture.controller.updateOverlay(target(), outside);
    fixture.controller.updateOverlay(target(), { leftPx: 1, rightPx: 1, topPx: 1, bottomPx: 1 });
    expect(fixture.createRectangle).toHaveBeenCalledTimes(1);
    expect(fixture.page.children).toHaveLength(1);
    expect(fixture.overlay).toMatchObject({ width: 102, height: 52, relativeTransform: [[1, 0, 9], [0, 1, 19]] });

    const duplicate = new FakeRectangle(fixture.page);
    duplicate.setPluginData('smart-print-size-overlay', 'canvas-overlay');
    fixture.page.children.push(duplicate);
    fixture.controller.updateOverlay(target(), outside);
    expect(fixture.page.children).toHaveLength(1);
    expect(duplicate.removed).toBe(true);
  });

  it('changes only guide stroke width when zoom changes and stops monitoring after removal', () => {
    const fixture = testController();
    fixture.controller.updateOverlay(target(), outside);
    fixture.zoom = 2;
    fixture.tick();
    expect(fixture.overlay.strokeWeight).toBe(1);

    fixture.controller.removeOverlay();
    expect(fixture.page.children).toHaveLength(0);
    expect(fixture.clearIntervalMock).toHaveBeenCalledTimes(1);
  });

  it('cleans remnants on the current page and allows a new page to start clean', () => {
    const fixture = testController();
    fixture.controller.updateOverlay(target(), outside);
    fixture.controller.cleanupStaleOverlays();
    expect(fixture.page.children).toHaveLength(0);

    fixture.page = new FakePage();
    fixture.controller.updateOverlay(target(), outside);
    expect(fixture.page.children).toHaveLength(1);
    fixture.controller.removeOverlay();
    expect(fixture.page.children).toHaveLength(0);
  });
});
