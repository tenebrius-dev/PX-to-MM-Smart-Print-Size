import type { ReactNode, CSSProperties } from 'react';

const containerStyle: CSSProperties = {
  display: 'flex',
  backgroundColor: 'var(--ui3-bg-secondary)',
  padding: '0',
  borderRadius: 'var(--ui3-size-radius-radius-medium, 5px)',
  gap: '0',
  height: '24px'
};

const itemStyle = (isSelected: boolean, autoWidth?: boolean, disabled?: boolean): CSSProperties => ({
  flex: autoWidth ? '1 1 auto' : 1,
  minWidth: 0,
  padding: autoWidth ? '0 4px' : 0,
  height: '100%',
  backgroundColor: isSelected ? 'var(--ui3-bg)' : 'transparent',
  border: 'none',
  boxShadow: isSelected ? '0 0 0 1px var(--ui3-border) inset' : 'none',
  color: isSelected ? 'var(--ui3-text)' : 'var(--ui3-text-secondary)',
  borderRadius: 'var(--ui3-size-radius-radius-medium, 5px)',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
  fontSize: 'var(--ui3-type-body-medium-fontsize)',
  fontWeight: 'var(--ui3-type-body-medium-fontweight)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  pointerEvents: disabled ? 'none' : 'auto'
});

export interface SegmentedOption<T extends string> {
  value: T;
  label?: string;
  icon?: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  autoWidth?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  style?: CSSProperties;
}

export function SegmentedControl<T extends string>({ options, value, onChange, autoWidth = false, disabled = false, ariaLabel, style }: SegmentedControlProps<T>) {
  return (
    <div className="ui3-segmented" role="group" aria-label={ariaLabel} style={{ ...containerStyle, opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto', ...style }}>
        {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className="ui3-segment"
          disabled={disabled}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
          style={itemStyle(value === opt.value, autoWidth, disabled)}
        >
          {opt.icon ?? opt.label ?? opt.value}
        </button>
      ))}
    </div>
  );
}
