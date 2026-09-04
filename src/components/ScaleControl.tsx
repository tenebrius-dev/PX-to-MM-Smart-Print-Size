import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import { ChevronDownIcon, MenuCheckIcon, ScaleIcon } from './Icons';
import {
  resolveFigmaMenuHorizontalPlacement,
  resolveFigmaMenuPlacement,
  resolveFigmaMenuRequestedWidth,
  type FigmaMenuHorizontalPlacement,
  type FigmaMenuPlacement,
} from '../domain/figma-menu-placement';

const SCALE_PRESETS = [0.25, 0.5, 1, 1.5, 2, 3, 4] as const;

interface ScaleControlProps {
  value: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (value: string) => void;
  onCommit: (value?: string) => boolean;
  onCancel: () => void;
  onFocusStateChange: (focused: boolean) => void;
}

interface MenuPosition {
  horizontal: FigmaMenuHorizontalPlacement;
  vertical: FigmaMenuPlacement;
}

function presetLabel(value: number): string {
  return `${value}x`;
}

function normalizedScale(value: string): string {
  return value.trim().replace(/x$/i, '').trim();
}

export const ScaleControl: FC<ScaleControlProps> = ({
  value,
  disabled = false,
  invalid = false,
  onChange,
  onCommit,
  onCancel,
  onFocusStateChange,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ignoreNextBlurRef = useRef(false);
  const selectOnClickRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuId = useId();
  const selectedPreset = SCALE_PRESETS.findIndex((preset) => normalizedScale(value) === String(preset));

  const closeMenu = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const placeMenu = useCallback(() => {
    const root = rootRef.current;
    const menu = menuRef.current;
    if (!root || !menu) {
      return;
    }

    const triggerRect = root.getBoundingClientRect();
    const panelRect = root.closest<HTMLElement>('.property-panel')?.getBoundingClientRect();
    const hasPanelBounds = Boolean(panelRect && panelRect.width > 0 && panelRect.height > 0);
    const viewportTop = hasPanelBounds ? Math.max(0, panelRect!.top) : 0;
    const viewportBottom = hasPanelBounds ? Math.min(window.innerHeight, panelRect!.bottom) : window.innerHeight;
    const viewportLeft = hasPanelBounds ? Math.max(0, panelRect!.left) : 0;
    const viewportRight = hasPanelBounds ? Math.min(window.innerWidth, panelRect!.right) : window.innerWidth;
    const horizontal = resolveFigmaMenuHorizontalPlacement({
      triggerLeft: triggerRect.left,
      triggerWidth: triggerRect.width,
      requestedWidth: resolveFigmaMenuRequestedWidth({ triggerWidth: triggerRect.width, scrollable: false }),
      viewportLeft,
      viewportRight,
    });
    const option = menu.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
      ?? menu.querySelector<HTMLElement>('[role="option"]');
    const vertical = resolveFigmaMenuPlacement({
      triggerTop: triggerRect.top,
      triggerBottom: triggerRect.bottom,
      menuHeight: menu.getBoundingClientRect().height,
      contentHeight: menu.scrollHeight || menu.getBoundingClientRect().height,
      selectedOffsetTop: option?.offsetTop ?? 0,
      selectedHeight: option?.offsetHeight ?? 24,
      viewportTop,
      viewportBottom,
    });
    setMenuPosition({ horizontal, vertical });
  }, []);

  const focusOption = useCallback((index: number) => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }
    const options = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    options[index]?.focus();
  }, []);

  const openMenu = useCallback((focusSelected = false) => {
    if (disabled) {
      return;
    }
    setOpen(true);
    window.requestAnimationFrame(() => {
      placeMenu();
      if (focusSelected) {
        focusOption(selectedPreset >= 0 ? selectedPreset : 0);
      }
    });
  }, [disabled, focusOption, placeMenu, selectedPreset]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }
    const frame = window.requestAnimationFrame(placeMenu);
    return () => window.cancelAnimationFrame(frame);
  }, [open, placeMenu, value]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && (rootRef.current?.contains(target) || menuRef.current?.contains(target))) {
        return;
      }
      closeMenu();
    };
    const closeOnViewportChange = () => closeMenu();
    window.addEventListener('pointerdown', closeOnOutsidePointer, true);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [closeMenu, open]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (onCommit()) {
        event.currentTarget.blur();
      }
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      ignoreNextBlurRef.current = true;
      onCancel();
      closeMenu();
      event.currentTarget.blur();
    }
  };

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const relatedTarget = event.relatedTarget;
    selectOnClickRef.current = false;
    if (ignoreNextBlurRef.current) {
      ignoreNextBlurRef.current = false;
      onFocusStateChange(false);
      return;
    }
    if (relatedTarget && (rootRef.current?.contains(relatedTarget) || menuRef.current?.contains(relatedTarget))) {
      return;
    }
    onFocusStateChange(false);
    onCommit();
  };

  const choosePreset = (preset: number) => {
    const nextValue = presetLabel(preset);
    ignoreNextBlurRef.current = true;
    onChange(nextValue);
    onCommit(nextValue);
    closeMenu(true);
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption((index + 1) % SCALE_PRESETS.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption((index - 1 + SCALE_PRESETS.length) % SCALE_PRESETS.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusOption(SCALE_PRESETS.length - 1);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu(true);
    }
  };

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      id={menuId}
      className="scale-control__menu"
      role="listbox"
      aria-label="Scale presets"
      style={menuPosition ? {
        left: `${menuPosition.horizontal.left}px`,
        top: `${menuPosition.vertical.top}px`,
        width: `${menuPosition.horizontal.width}px`,
        ...(menuPosition.vertical.maxHeight !== undefined ? { maxHeight: `${menuPosition.vertical.maxHeight}px` } : {}),
      } : undefined}
    >
      {SCALE_PRESETS.map((preset, index) => {
        const label = presetLabel(preset);
        const selected = index === selectedPreset;
        return (
          <button
            key={preset}
            type="button"
            className={`scale-control__option${selected ? ' selected' : ''}`}
            role="option"
            aria-selected={selected}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => choosePreset(preset)}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
          >
            {selected && <span className="scale-control__option-check"><MenuCheckIcon /></span>}
            {label}
          </button>
        );
      })}
    </div>,
    document.body,
  ) : null;

  return (
    <div ref={rootRef} className={`scale-control${disabled ? ' scale-control--disabled' : ''}`}>
      <span className="scale-control__icon" aria-hidden="true"><ScaleIcon /></span>
      <input
        type="text"
        className="scale-control__input"
        aria-label="Scale"
        aria-invalid={invalid || undefined}
        aria-autocomplete="none"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        role="combobox"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onMouseDown={(event) => {
          selectOnClickRef.current = document.activeElement !== event.currentTarget;
        }}
        onFocus={(event) => {
          onFocusStateChange(true);
          event.currentTarget.select();
        }}
        onClick={(event) => {
          if (!selectOnClickRef.current) {
            return;
          }
          selectOnClickRef.current = false;
          const input = event.currentTarget;
          window.requestAnimationFrame(() => {
            if (document.activeElement === input) {
              input.select();
            }
          });
        }}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
      />
      <button
        ref={triggerRef}
        type="button"
        className="scale-control__trigger"
        aria-label="Open scale presets"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
      >
        <ChevronDownIcon />
      </button>
      {menu}
    </div>
  );
};
