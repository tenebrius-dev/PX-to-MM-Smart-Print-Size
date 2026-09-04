import React, { forwardRef } from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  split?: boolean;
  onSplitClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      icon,
      iconRight,
      split,
      onSplitClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const isIconOnly = !children && icon && !iconRight;
    const baseClass = `ui3-button ui3-button--${variant} ${isIconOnly ? 'ui3-button--icon-only' : ''} ${className}`.trim();

    const mainButton = (
      <button ref={ref} className={baseClass} {...props}>
        {icon && <span className="ui3-button__icon">{icon}</span>}
        {children && <span className="ui3-button__text">{children}</span>}
        {iconRight && !split && <span className="ui3-button__icon">{iconRight}</span>}
      </button>
    );

    if (split) {
      return (
        <div className="ui3-btn-group">
          {mainButton}
          <button
            type="button"
            className={`ui3-button ui3-button--${variant} ui3-button--icon-only`}
            onClick={onSplitClick}
            disabled={props.disabled}
            aria-label="More options"
          >
            {iconRight || (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 8L2 4H10L6 8Z" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>
      );
    }

    return mainButton;
  }
);

Button.displayName = 'Button';
