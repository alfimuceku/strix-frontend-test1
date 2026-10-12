/**
 * The X's square aperture as a small animated mark: a thin seam of ice light
 * with a soft inner glow and a slow scan. Pure SVG + CSS; static with reduced motion.
 */
export function ApertureMark({ className = "" }: { className?: string }) {
  return (
    <span className={`aperture-mark ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 64 64">
        <defs>
          <radialGradient id="am-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9DDCFF" stopOpacity="0.55" />
            <stop offset="55%" stopColor="#3185FF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#175CFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path className="aperture-mark__x" d="M6 6 L24 24 M58 6 L40 24 M6 58 L24 40 M58 58 L40 40" />
        <rect className="aperture-mark__glow" x="20" y="20" width="24" height="24" fill="url(#am-glow)" />
        <rect className="aperture-mark__seam" x="20" y="20" width="24" height="24" />
        <rect className="aperture-mark__scan" x="21" y="21" width="22" height="2" />
      </svg>
    </span>
  );
}
