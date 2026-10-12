/** Typographic STRIX wordmark; the X carries the square aperture used across the site. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg className={`wordmark ${className}`} viewBox="0 0 142 40" role="img" aria-label="Strix">
      <g fill="currentColor">
        {/* S */}
        <path d="M0 0h24v6H6v11h18v23H0v-6h18V23H0z" />
        {/* T */}
        <path d="M32 0h24v6h-9v34h-6V6h-9z" />
        {/* R */}
        <path d="M64 0h21v17h-6l9 23h-7l-8.5-23H70v23h-6zm6 6v5h9V6z" />
        {/* I */}
        <path d="M96 0h8v40h-8z" />
        {/* X with aperture */}
        <path d="M112 0h7.5l7.5 13 7.5-13H142l-10.5 18.2V21.8L142 40h-7.5L127 27l-7.5 13H112l10.5-18.2v-3.6z" />
      </g>
      <rect x="123.2" y="16.2" width="7.6" height="7.6" fill="none" stroke="var(--ice)" strokeWidth="1.6" />
    </svg>
  );
}
