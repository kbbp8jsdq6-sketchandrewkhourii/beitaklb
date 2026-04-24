/**
 * SectionDivider — soft SVG wave used to transition between two
 * adjacent sections. Place at the very top of the lower section,
 * passing the upper section's background color via `fill`.
 *
 * `flip` mirrors the wave vertically so consecutive dividers can
 * alternate (curve up vs. curve down) for a flowing rhythm.
 */
export function SectionDivider({
  fill,
  flip = false,
  className = "",
}: {
  /** CSS color of the section ABOVE this divider. */
  fill: string;
  flip?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none relative z-20 -mt-px w-full overflow-hidden leading-[0] ${className}`}
      style={{ transform: flip ? "scaleY(-1)" : undefined }}
    >
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="block h-[60px] w-full sm:h-[90px]"
      >
        <path
          d="M0,40 C240,90 480,0 720,32 C960,64 1200,90 1440,40 L1440,0 L0,0 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
