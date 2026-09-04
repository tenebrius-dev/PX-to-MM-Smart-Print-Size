import type { RasterSnapshot } from '../types/messages';

export interface ImagePaintLike {
  readonly type: 'IMAGE';
  readonly imageHash?: string;
  readonly visible?: boolean;
}

interface RecordLike {
  [key: string]: unknown;
}

function asRecord(value: unknown): RecordLike | null {
  return typeof value === 'object' && value !== null ? value as RecordLike : null;
}

/** Matches Smart PPI's rule: use the top-most visible image paint. */
export function getTopVisibleImageFill(fills: unknown, mixedValue?: unknown): ImagePaintLike | null {
  if (mixedValue !== undefined && fills === mixedValue) {
    return null;
  }
  if (!Array.isArray(fills)) {
    return null;
  }

  for (let index = fills.length - 1; index >= 0; index -= 1) {
    const fill = fills[index];
    const record = asRecord(fill);
    if (record?.type === 'IMAGE' && record.visible !== false) {
      return record as unknown as ImagePaintLike;
    }
  }
  return null;
}

export function getImageFillFromNode(node: unknown, mixedValue?: unknown): ImagePaintLike | null {
  const record = asRecord(node);
  return getTopVisibleImageFill(record?.fills, mixedValue);
}

function findImageNode(node: unknown, mixedValue?: unknown, scanDescendants = true): unknown | null {
  if (getImageFillFromNode(node, mixedValue)) {
    return node;
  }

  if (!scanDescendants) {
    return null;
  }

  const record = asRecord(node);
  const findAll = record?.findAll;
  if (typeof findAll === 'function') {
    try {
      const found = findAll.call(node, (child: unknown) => Boolean(getImageFillFromNode(child, mixedValue)));
      if (Array.isArray(found) && found.length > 0) {
        return found[0];
      }
    } catch {
      // Fall back to a small recursive walk for test doubles and unloaded nodes.
    }
  }

  const children = record?.children;
  if (Array.isArray(children)) {
    for (const child of children) {
      const found = findImageNode(child, mixedValue, scanDescendants);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

interface ImageLike {
  getSizeAsync(): Promise<{ width: number; height: number }>;
  getBytesAsync?(): Promise<Uint8Array>;
}

export interface ImageResolver {
  getImageByHash(hash: string): ImageLike | null;
}

export async function inspectRasterNode(
  node: unknown,
  mixedValue: unknown,
  resolver: ImageResolver,
  scanDescendants = true,
): Promise<RasterSnapshot> {
  const imageNode = findImageNode(node, mixedValue, scanDescendants);
  if (!imageNode) {
    return { detected: false, status: 'not-applicable' };
  }

  const fill = getImageFillFromNode(imageNode, mixedValue);
  if (!fill?.imageHash) {
    return { detected: true, status: 'unavailable' };
  }

  let image: ImageLike | null;
  try {
    image = resolver.getImageByHash(fill.imageHash);
  } catch {
    image = null;
  }
  if (!image) {
    return { detected: true, status: 'unavailable' };
  }

  try {
    const size = await image.getSizeAsync();
    if (Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0) {
      return { detected: true, status: 'ready', widthPx: size.width, heightPx: size.height };
    }
  } catch {
    // Some images need to be materialized before their dimensions are available.
    try {
      await image.getBytesAsync?.();
      const size = await image.getSizeAsync();
      if (Number.isFinite(size.width) && Number.isFinite(size.height) && size.width > 0 && size.height > 0) {
        return { detected: true, status: 'ready', widthPx: size.width, heightPx: size.height };
      }
    } catch {
      // Report an unavailable image while keeping the node geometry editable.
    }
  }

  return { detected: true, status: 'unavailable' };
}
