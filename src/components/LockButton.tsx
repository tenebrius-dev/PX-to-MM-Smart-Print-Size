import type { FC } from 'react';
import { LinkIcon } from './Icons';

interface LockButtonProps {
  linked: boolean;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
}

export const LockButton: FC<LockButtonProps> = ({ linked, onClick, title, disabled = false }) => {
  return (
    <button
      type="button"
      className="ui3-icon-button lock-button"
      aria-pressed={linked}
      aria-label={title ?? (linked ? 'Unlock aspect ratio' : 'Lock aspect ratio')}
      disabled={disabled}
      onClick={onClick}
      title={title}
    >
      <LinkIcon linked={linked} />
    </button>
  );
};
