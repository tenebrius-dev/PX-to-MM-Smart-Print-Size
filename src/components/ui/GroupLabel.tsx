import type { FC, ReactNode, CSSProperties } from 'react';

interface GroupLabelProps {
  children: ReactNode;
  align?: 'left' | 'center';
  letterSpacing?: string;
  style?: CSSProperties;
}

export const GroupLabel: FC<GroupLabelProps> = ({ children, align = 'left', letterSpacing, style }) => (
  <p style={{ 
    margin: '0 0 4px 0', 
    fontSize: 'var(--ui3-type-body-small-fontsize)', 
    lineHeight: 'var(--ui3-type-body-small-lineheight)', 
    letterSpacing: letterSpacing || 'var(--ui3-type-body-small-letterspacing)', 
    color: 'var(--ui3-text-secondary)', 
    fontWeight: 'var(--ui3-type-body-small-fontweight)',
    textAlign: align,
    whiteSpace: 'nowrap',
    ...style
  }}>
    {children}
  </p>
);
