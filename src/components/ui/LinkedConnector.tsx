import type { FC } from 'react';
import { useId } from 'react';

interface LinkedConnectorProps {
  linked?: boolean;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  leftActive?: boolean;
  rightActive?: boolean;
}

export const LinkedConnector: FC<LinkedConnectorProps> = ({
  linked = true,
  leftDisabled = false,
  rightDisabled = false,
  leftActive = false,
  rightActive = false,
}) => {
  const uniqueId = useId().replace(/:/g, '');

  if (!linked) {
    return <div style={{ width: '8px', height: '24px', flexShrink: 0 }} />;
  }

  const gradId = `connector-grad-${uniqueId}`;
  const baseColor = 'var(--ui3-bg-secondary, #F5F5F5)';

  let fillStyle = baseColor;
  let defs = null;
  let elementOpacity = 1;

  if (leftDisabled && rightDisabled) {
    elementOpacity = 0.4;
    fillStyle = baseColor;
  } else if (leftDisabled && !rightDisabled) {
    fillStyle = `url(#${gradId})`;
    defs = (
      <defs>
        <linearGradient id={gradId} x1="0" y1="12" x2="8" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={baseColor} stopOpacity="0.4" />
          <stop offset="1" stopColor={baseColor} stopOpacity="1" />
        </linearGradient>
      </defs>
    );
  } else if (!leftDisabled && rightDisabled) {
    fillStyle = `url(#${gradId})`;
    defs = (
      <defs>
        <linearGradient id={gradId} x1="0" y1="12" x2="8" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={baseColor} stopOpacity="1" />
          <stop offset="1" stopColor={baseColor} stopOpacity="0.4" />
        </linearGradient>
      </defs>
    );
  } else if (leftActive && !rightActive) {
    const activeColor = 'var(--ui3-border-selected, #0D99FF)';
    fillStyle = `url(#${gradId})`;
    defs = (
      <defs>
        <linearGradient id={gradId} x1="0" y1="12" x2="8" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={activeColor} />
          <stop offset="1" stopColor={baseColor} />
        </linearGradient>
      </defs>
    );
  } else if (!leftActive && rightActive) {
    const activeColor = 'var(--ui3-border-selected, #0D99FF)';
    fillStyle = `url(#${gradId})`;
    defs = (
      <defs>
        <linearGradient id={gradId} x1="0" y1="12" x2="8" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={baseColor} />
          <stop offset="1" stopColor={activeColor} />
        </linearGradient>
      </defs>
    );
  } else if (leftActive && rightActive) {
    fillStyle = 'var(--ui3-border-selected, #0D99FF)';
  }

  return (
    <div
      style={{
        width: '8px',
        height: '24px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: elementOpacity,
        zIndex: 0,
      }}
    >
      <svg width="8" height="24" viewBox="0 0 8 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {defs}
        <path
          d="M4.36679e-05 5C4.36679e-05 7.66667 1.33338 9 4.00004 9C6.66671 9 8.00004 7.66667 8.00004 5V19C8.00004 16.3333 6.66671 15 4.00004 15C1.33338 15 4.36679e-05 16.3333 4.36679e-05 19C4.36679e-05 19 -0.0588314 7.46164 4.36679e-05 5Z"
          fill={fillStyle}
        />
      </svg>
    </div>
  );
};
