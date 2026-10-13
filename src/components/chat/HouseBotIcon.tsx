/** Beitak assistant character: a small white house with two blinking red eyes. */
export function HouseBotIcon({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 34 34" className={className} aria-hidden="true" focusable="false">
      <path
        d="M17 4.5 29 14.2V27a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V14.2Z"
        fill="#FFFFFF"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g className={animated ? "housebot-eyes" : undefined}>
        <ellipse className={animated ? "housebot-eye" : undefined} cx="13" cy="20" rx="2.1" ry="3.1" fill="#CC0000" />
        <ellipse className={animated ? "housebot-eye" : undefined} cx="21" cy="20" rx="2.1" ry="3.1" fill="#CC0000" />
      </g>
    </svg>
  );
}
