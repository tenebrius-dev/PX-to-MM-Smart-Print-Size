import type { InputHTMLAttributes, FC } from 'react';
import { useState } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  unit?: string;
  unitOverlay?: boolean;
  paddingRight?: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  onFocusStateChange?: (focused: boolean) => void;
  error?: boolean;
  disabled?: boolean;
}

export const Input: FC<InputProps> = ({ label, unit, unitOverlay, paddingRight, value, onChange, onBlur, onFocusStateChange, error, disabled, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Mappings for common labels to short Figma-like prefixes if possible,
  // or just use the label directly.
  let shortLabel = label;
  const LABEL_MAP: Record<string, string> = {
    'Ширина': 'Ш', 'Width': 'W',
    'Высота': 'В', 'Height': 'H',
    'Вылеты': 'В', 'Bleeds': 'B',
    'Поля': 'П', 'Margins': 'M',
    'До края': 'П', 'Поля до края': 'П', 'Поле до края': 'П',
    'Outer Edge Margins': 'E', 'Outer edge': 'E', 'Outer Edge': 'E',
    'Около фальца': 'Ф', 'У фальца': 'Ф',
    'Fold Margins': 'F', 'Fold margin': 'F', 'Fold Margin': 'F',
    'Верх': 'В', 'Top': 'T',
    'Низ': 'Н', 'Bottom': 'B',
    'Левое': 'Л', 'Left': 'L',
    'Правое': 'П', 'Right': 'R',
    'Внутри': 'В', 'Inside': 'I',
    'Снаружи': 'С', 'Outside': 'O',
    'DPI': '', 'Количество': '', 'Count': '', 'Расстояние': '', 'Gap': ''
  };

  shortLabel = LABEL_MAP[label] !== undefined ? LABEL_MAP[label] : label;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--ui3-bg-secondary)', // Matches Figma's dark gray input background
        border: `1px solid ${error ? 'var(--ui3-border-danger)' : isFocused ? 'var(--ui3-border-selected)' : 'transparent'}`,
        borderRadius: 'var(--ui3-size-radius-radius-medium, 5px)',
        height: '24px',
        minHeight: '24px',
        maxHeight: '24px',
        paddingLeft: '6px',
        paddingRight: paddingRight !== undefined ? paddingRight : (unit && !unitOverlay ? '6px' : '2px'),
        paddingTop: 0,
        paddingBottom: 0,
        flex: 1,
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'hidden',
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      {shortLabel && (
        <span
          style={{
            color: 'var(--ui3-text-tertiary)',
            fontSize: 'var(--ui3-type-body-medium-fontsize)',
            lineHeight: 'var(--ui3-type-body-medium-lineheight)',
            fontWeight: 'var(--ui3-type-body-medium-fontweight)',
            marginRight: '6px',
            userSelect: 'none',
            flexShrink: 0
          }}
        >
          {shortLabel}
        </span>
      )}
      <input
        type="number"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          setIsFocused(true);
          if (onFocusStateChange) onFocusStateChange(true);
          e.target.select();
        }}
        onClick={(e) => {
          (e.target as HTMLInputElement).select();
        }}
        onBlur={() => {
          setIsFocused(false);
          if (onFocusStateChange) onFocusStateChange(false);
          if (onBlur) onBlur();
        }}
        style={{
          flex: 1,
          width: '100%',
          minWidth: '0px',
          height: '100%',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--ui3-text)',
          fontSize: 'var(--ui3-type-body-medium-fontsize)',
          lineHeight: 'var(--ui3-type-body-medium-lineheight)',
          fontWeight: 'var(--ui3-type-body-medium-fontweight)',
          fontFamily: 'var(--ui3-type-font-family-default)',
          outline: 'none',
          padding: 0,
          paddingRight: unitOverlay ? '18px' : 0,
          position: 'relative',
          zIndex: 1
        }}
        {...props}
      />
      {unit && unitOverlay && (
        <span
          style={{
            position: 'absolute',
            right: '6px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--ui3-text-tertiary)',
            fontSize: 'var(--ui3-type-body-medium-fontsize)',
            lineHeight: 'var(--ui3-type-body-medium-lineheight)',
            fontWeight: 'var(--ui3-type-body-medium-fontweight)',
            userSelect: 'none',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: isHovered || isFocused ? 0 : 1,
            transition: 'opacity 0.15s ease'
          }}
        >
          {unit}
        </span>
      )}
      {unit && !unitOverlay && (
        <span
          style={{
            color: 'var(--ui3-text-tertiary)',
            fontSize: 'var(--ui3-type-body-medium-fontsize)',
            lineHeight: 'var(--ui3-type-body-medium-lineheight)',
            fontWeight: 'var(--ui3-type-body-medium-fontweight)',
            marginLeft: '4px',
            userSelect: 'none'
          }}
        >
          {unit}
        </span>
      )}
    </div>
  );
};
