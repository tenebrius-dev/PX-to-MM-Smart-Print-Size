import type { FC, ReactNode } from 'react';

interface SectionTitleProps {
  children: ReactNode;
  rightAction?: ReactNode;
  pb?: number;
}

export const SectionTitle: FC<SectionTitleProps> = ({ children, rightAction, pb = 6 }) => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: '12px',
    paddingBottom: `${pb}px`,
    paddingLeft: '16px',
    paddingRight: '16px',
    margin: 0,
    boxSizing: 'border-box'
  }}>
    <h2 style={{ 
      margin: 0, 
      padding: 0,
      fontSize: 'var(--ui3-type-body-medium-fontsize)', 
      lineHeight: '16px',
      fontWeight: 'var(--ui3-type-body-medium-strong-fontweight)', 
      color: 'var(--ui3-text)' 
    }}>
      {children}
    </h2>
    {rightAction && (
      <div style={{ display: 'flex', alignItems: 'center', margin: '-4px 0' }}>
        {rightAction}
      </div>
    )}
  </div>
);
