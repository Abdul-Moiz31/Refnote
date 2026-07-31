interface DocumentIconProps {
  size?: number;
  className?: string;
}

export default function DocumentIcon({ size = 15, className }: DocumentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={'document-icon' + (className ? ` ${className}` : '')}
      aria-hidden="true"
    >
      <path d="M6.5 3.5h8l4 4v13a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M14.5 3.5v4h4" />
      <line x1="9" y1="12" x2="16" y2="12" />
      <line x1="9" y1="15.5" x2="16" y2="15.5" />
      <line x1="9" y1="19" x2="13" y2="19" />
    </svg>
  );
}
