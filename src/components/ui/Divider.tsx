import type { FC } from 'react';

interface DividerProps {
  marginTop?: number;
  marginBottom?: number;
}

export const Divider: FC<DividerProps> = ({ marginTop = 0, marginBottom = 0 }) => (
  <div style={{
    width: '100%',
    height: '1px',
    marginTop: `${marginTop}px`,
    marginBottom: `${marginBottom}px`,
    backgroundColor: 'var(--ui3-border)',
  }} />
);
