import type { FC, ReactNode } from 'react';

interface SectionContainerProps {
  children: ReactNode;
  gap?: number;
  paddingBottom?: number;
}

export const SectionContainer: FC<SectionContainerProps> = ({ children, gap = 8, paddingBottom = 16 }) => (
  <div style={{ 
    paddingTop: 0,
    paddingBottom: `${paddingBottom}px`,
    paddingLeft: '16px',
    paddingRight: '16px',
    margin: 0,
    display: 'flex', 
    flexDirection: 'column', 
    gap: `${gap}px`,
    boxSizing: 'border-box'
  }}>
    {children}
  </div>
);
