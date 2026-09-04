/**
 * Format values only at the UI boundary. Geometry and conversion code keeps
 * the original double precision values; this formatter is never used before
 * a value is sent back to Figma.
 */
export function formatDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return '—';
  }

  const rounded = Object.is(value, -0) ? 0 : value;
  const result = rounded.toFixed(2).replace(/\.?0+$/, '');
  return result === '-0' ? '0' : result;
}
