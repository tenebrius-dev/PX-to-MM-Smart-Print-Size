import { describe, expect, it } from 'vitest';
import {
  FIGMA_PPI,
  fromDimensionUnit,
  mmToPx,
  parseDecimalInput,
  pxToMm,
  toDimensionUnit,
} from './units';
import { formatDisplay } from './number-format';

describe('fixed Figma units', () => {
  it('uses 72 PPI and converts one inch without rounding', () => {
    expect(FIGMA_PPI).toBe(72);
    expect(pxToMm(72)).toBe(25.4);
    expect(mmToPx(25.4)).toBe(72);
  });

  it('round-trips dimensions in either UI unit', () => {
    const sourcePx = 839.52;
    const mm = toDimensionUnit(sourcePx, 'mm');
    expect(mm).toBeCloseTo(296.164, 12);
    expect(fromDimensionUnit(mm, 'mm')).toBeCloseTo(sourcePx, 12);
    expect(toDimensionUnit(sourcePx, 'px')).toBe(sourcePx);
  });
});

describe('decimal input', () => {
  it('accepts comma and dot decimals, signs and exponent notation', () => {
    expect(parseDecimalInput(' -297,78 ')).toBe(-297.78);
    expect(parseDecimalInput('0.01')).toBe(0.01);
    expect(parseDecimalInput('1e2')).toBe(100);
  });

  it('rejects empty and malformed values', () => {
    expect(parseDecimalInput('')).toBeNull();
    expect(parseDecimalInput('—')).toBeNull();
    expect(parseDecimalInput('12,3,4')).toBeNull();
    expect(parseDecimalInput('Infinity')).toBeNull();
  });
});

describe('display formatter', () => {
  it('shows at most two decimals while preserving the source value', () => {
    const value = 25.399999999999;
    expect(formatDisplay(value)).toBe('25.4');
    expect(formatDisplay(839.52)).toBe('839.52');
    expect(formatDisplay(300)).toBe('300');
    expect(formatDisplay(-0)).toBe('0');
    expect(formatDisplay(null)).toBe('—');
  });
});
