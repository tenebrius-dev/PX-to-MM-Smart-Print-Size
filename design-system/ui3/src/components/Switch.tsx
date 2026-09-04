import React, { forwardRef } from 'react';
import './Switch.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className = '', disabled, ...props }, ref) => {
    return (
      <label className={`ui3-switch-label ${disabled ? 'ui3-switch-label--disabled' : ''} ${className}`.trim()}>
        <input
          type="checkbox"
          className="ui3-switch-input"
          disabled={disabled}
          ref={ref}
          role="switch"
          {...props}
        />
        <div className="ui3-switch-track" aria-hidden="true">
          <div className="ui3-switch-thumb" />
        </div>
        {label && <span className="ui3-switch-text">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
