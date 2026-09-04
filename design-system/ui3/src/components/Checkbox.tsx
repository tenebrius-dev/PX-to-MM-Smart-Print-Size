import React, { forwardRef } from 'react';
import './Checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', disabled, ...props }, ref) => {
    return (
      <label className={`ui3-checkbox-label ${disabled ? 'ui3-checkbox-label--disabled' : ''} ${className}`.trim()}>
        <input
          type="checkbox"
          className="ui3-checkbox-input"
          disabled={disabled}
          ref={ref}
          {...props}
        />
        <div className="ui3-checkbox-box" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10.146 3.146a.5.5 0 0 1 .008.707l-5.006 5a.5.5 0 0 1-.707 0L1.854 6.268a.5.5 0 1 1 .708-.707l2.22 2.22 4.657-4.65A.5.5 0 0 1 10.146 3.146Z"
              fill="currentColor"
            />
          </svg>
        </div>
        {label && <span className="ui3-checkbox-text">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
