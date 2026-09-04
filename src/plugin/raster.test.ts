import { describe, expect, it, vi } from 'vitest';
import { getTopVisibleImageFill, inspectRasterNode } from './raster';

describe('Smart PPI raster helpers', () => {
  it('selects the top visible image paint', () => {
    const hidden = { type: 'IMAGE', imageHash: 'hidden', visible: false };
    const visible = { type: 'IMAGE', imageHash: 'visible' };
    expect(getTopVisibleImageFill([{ type: 'SOLID' }, hidden, visible], Symbol('mixed'))?.imageHash).toBe('visible');
    expect(getTopVisibleImageFill([hidden], Symbol('mixed'))).toBeNull();
  });

  it('loads native image dimensions and retries after materializing bytes', async () => {
    const image = {
      getSizeAsync: vi.fn()
        .mockRejectedValueOnce(new Error('not loaded'))
        .mockResolvedValueOnce({ width: 1200, height: 800 }),
      getBytesAsync: vi.fn().mockResolvedValue(new Uint8Array([1])),
    };
    const result = await inspectRasterNode(
      { fills: [{ type: 'IMAGE', imageHash: 'hash' }] },
      Symbol('mixed'),
      { getImageByHash: () => image },
    );
    expect(result).toEqual({ detected: true, status: 'ready', widthPx: 1200, heightPx: 800 });
    expect(image.getBytesAsync).toHaveBeenCalledOnce();
  });

  it('finds a raster in a selected group without changing its geometry', async () => {
    const result = await inspectRasterNode(
      { children: [{ fills: [{ type: 'IMAGE', imageHash: 'hash' }] }] },
      Symbol('mixed'),
      { getImageByHash: () => ({ getSizeAsync: async () => ({ width: 10, height: 20 }) }) },
    );
    expect(result.detected).toBe(true);
    expect(result.status).toBe('ready');
  });
});
