import type { FC, KeyboardEvent } from 'react';
import type { AnchorPoint } from '../domain/scale';

interface AnchorGridProps {
  value: AnchorPoint;
  disabled?: boolean;
  onChange: (value: AnchorPoint) => void;
}

const ANCHOR_LABELS = [
  'Top left',
  'Top center',
  'Top right',
  'Center left',
  'Center',
  'Center right',
  'Bottom left',
  'Bottom center',
  'Bottom right',
] as const;

function moveAnchor(value: AnchorPoint, key: string): AnchorPoint | null {
  const row = Math.floor(value / 3);
  const column = value % 3;
  if (key === 'ArrowUp' && row > 0) return (value - 3) as AnchorPoint;
  if (key === 'ArrowDown' && row < 2) return (value + 3) as AnchorPoint;
  if (key === 'ArrowLeft' && column > 0) return (value - 1) as AnchorPoint;
  if (key === 'ArrowRight' && column < 2) return (value + 1) as AnchorPoint;
  return null;
}

export const AnchorGrid: FC<AnchorGridProps> = ({ value, disabled = false, onChange }) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, point: AnchorPoint): void => {
    const next = moveAnchor(point, event.key);
    if (next === null) {
      return;
    }
    event.preventDefault();
    onChange(next);
    const target = event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-anchor="${next}"]`);
    target?.focus();
  };

  return (
    <div className="anchor-grid" role="radiogroup" aria-label="Anchor point">
      {ANCHOR_LABELS.map((label, index) => {
        const point = index as AnchorPoint;
        return (
          <button
            key={label}
            type="button"
            className={`anchor-grid__point${value === point ? ' anchor-grid__point--active' : ''}`}
            data-anchor={point}
            role="radio"
            aria-label={label}
            aria-checked={value === point}
            disabled={disabled}
            tabIndex={value === point ? 0 : -1}
            onClick={() => onChange(point)}
            onKeyDown={(event) => handleKeyDown(event, point)}
          >
            <span aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
};

