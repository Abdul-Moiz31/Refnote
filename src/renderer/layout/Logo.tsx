import type { CSSProperties } from 'react';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export default function Logo({
  size = 22,
  showWordmark = true,
  className,
}: LogoProps) {
  return (
    <span
      className={'logo' + (className ? ` ${className}` : '')}
      style={{ '--logo-size': `${size}px` } as CSSProperties}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="logo-mark"
        aria-hidden="true"
      >
        <circle cx="8" cy="12" r="4.5" className="logo-mark-ring" />
        <line x1="12.3" y1="12" x2="15.2" y2="12" className="logo-mark-link" />
        <circle cx="17" cy="12" r="4.5" className="logo-mark-dot" />
      </svg>
      {showWordmark && <span className="logo-wordmark">Refnote</span>}
    </span>
  );
}
