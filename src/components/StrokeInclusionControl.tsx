import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type KeyboardEvent,
} from 'react';
import { ChevronDownIcon, MenuCheckIcon } from './Icons';
import {
  resolveFigmaMenuHorizontalPlacement,
  resolveFigmaMenuPlacement,
  resolveFigmaMenuRequestedWidth,
  type FigmaMenuHorizontalPlacement,
  type FigmaMenuPlacement,
} from '../domain/figma-menu-placement';

interface StrokeInclusionControlProps {
  value: boolean;
  disabled?: boolean;
  onChange: (included: boolean) => void;
}

interface MenuPosition {
  horizontal: FigmaMenuHorizontalPlacement;
  vertical: FigmaMenuPlacement;
}

const OPTIONS = [
  { value: false, label: 'Excluded' },
  { value: true, label: 'Included' },
] as const;

export const StrokeInclusionControl: FC<StrokeInclusionControlProps> = ({
  value,
  disabled = false,
  onChange,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const menuId = useId();
  const selectedIndex = OPTIONS.findIndex((option) => option.value === value);

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
    const selected = menu.querySelector<HTMLElement>('[role="option"][aria-selected="true"]')
      ?? menu.querySelector<HTMLElement>('[role="option"]');
    const vertical = resolveFigmaMenuPlacement({
      triggerTop: triggerRect.top,
      triggerBottom: triggerRect.bottom,
      menuHeight: menu.getBoundingClientRect().height,
      contentHeight: menu.scrollHeight || menu.getBoundingClientRect().height,
      selectedOffsetTop: selected?.offsetTop ?? 0,
      selectedHeight: selected?.offsetHeight ?? 24,
      viewportTop,
      viewportBottom,
    });
    setMenuPosition({ horizontal, vertical });
  }, []);

  const focusOption = useCallback((index: number) => {
    const options = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]');
    options?.[index]?.focus();
  }, []);

  const openMenu = useCallback((focusSelected = false) => {
    if (disabled) {
      return;
    }
    setOpen(true);
    window.requestAnimationFrame(() => {
      placeMenu();
      if (focusSelected) {
        focusOption(selectedIndex);
      }
    });
  }, [disabled, focusOption, placeMenu, selectedIndex]);

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

  const chooseOption = (included: boolean) => {
    onChange(included);
    closeMenu(true);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(true);
    }
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption((index + 1) % OPTIONS.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption((index - 1 + OPTIONS.length) % OPTIONS.length);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      focusOption(OPTIONS.length - 1);
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
      className="stroke-inclusion-control__menu"
      role="listbox"
      aria-label="Outside stroke options"
      style={menuPosition ? {
        left: `${menuPosition.horizontal.left}px`,
        top: `${menuPosition.vertical.top}px`,
        width: `${menuPosition.horizontal.width}px`,
        ...(menuPosition.vertical.maxHeight !== undefined ? { maxHeight: `${menuPosition.vertical.maxHeight}px` } : {}),
      } : undefined}
    >
      {OPTIONS.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={option.label}
            type="button"
            className={`stroke-inclusion-control__option${selected ? ' selected' : ''}`}
            role="option"
            aria-selected={selected}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => chooseOption(option.value)}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
          >
            {selected && <span className="stroke-inclusion-control__option-check"><MenuCheckIcon /></span>}
            {option.label}
          </button>
        );
      })}
    </div>,
    document.body,
  ) : null;

  const label = value ? 'Included' : 'Excluded';
  return (
    <div ref={rootRef} className={`stroke-inclusion-control${disabled ? ' stroke-inclusion-control--disabled' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="stroke-inclusion-control__trigger"
        aria-label="Outside stroke"
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className="stroke-inclusion-control__value">{label}</span>
        <ChevronDownIcon />
      </button>
      {menu}
    </div>
  );
};
