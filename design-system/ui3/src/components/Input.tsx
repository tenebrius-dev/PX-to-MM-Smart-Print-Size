import React, { forwardRef } from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', iconLeft, iconRight, ...props }, ref) => {
    return (
      <div className={`ui3-input-wrapper ${className}`.trim()}>
        {iconLeft && <div className="ui3-input__icon-left">{iconLeft}</div>}
        <input
          ref={ref}
          className={`ui3-input ${iconLeft ? 'ui3-input--with-icon-left' : ''} ${iconRight ? 'ui3-input--with-icon-right' : ''}`.trim()}
          {...props}
        />
        {iconRight && <div className="ui3-input__icon-right">{iconRight}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
