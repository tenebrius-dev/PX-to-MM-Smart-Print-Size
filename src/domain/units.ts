/** Figma's document coordinate system is fixed to 72 pixels per inch. */
export const FIGMA_PPI = 72;
export const MILLIMETERS_PER_INCH = 25.4;
export const MIN_NODE_SIZE_PX = 0.01;

export type DimensionUnit = 'px' | 'mm';

export function pxToMm(px: number): number {
  return px * MILLIMETERS_PER_INCH / FIGMA_PPI;
}

export function mmToPx(mm: number): number {
  return mm * FIGMA_PPI / MILLIMETERS_PER_INCH;
}

export function toDimensionUnit(px: number, unit: DimensionUnit): number {
  return unit === 'mm' ? pxToMm(px) : px;
}

export function fromDimensionUnit(value: number, unit: DimensionUnit): number {
  return unit === 'mm' ? mmToPx(value) : value;
}

export function parseDecimalInput(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.');
  if (normalized.length === 0 || !/^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:e[+-]?\d+)?$/i.test(normalized)) {
    return null;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

export function isValidDimension(value: number, allowZero = false): boolean {
  const minimum = allowZero ? 0 : MIN_NODE_SIZE_PX;
  return Number.isFinite(value) && value >= minimum;
}
