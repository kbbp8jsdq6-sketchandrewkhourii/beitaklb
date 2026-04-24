import { Home, MapPin } from "lucide-react";

/**
 * Subtle decorative background pattern derived from the auth pages.
 * Uses the same drifting houses, pins, and geometric shapes — but
 * lower opacity so it sits behind real content without overpowering it.
 *
 * Render this absolutely positioned inside any section that needs the
 * pattern. The parent should have `position: relative` and the section
 * content should be wrapped in `relative z-10` so it sits above.
 */
export function PatternBackground({
  variant = "subtle",
}: {
  variant?: "subtle" | "soft";
}) {
  // Lighter than auth (which uses 0.25 / 0.15) so it doesn't fight content.
  const RED = variant === "soft" ? "rgba(230,48,48,0.12)" : "rgba(230,48,48,0.07)";
  const BLACK = variant === "soft" ? "rgba(17,17,17,0.07)" : "rgba(17,17,17,0.04)";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Houses */}
      <span className="pat-bg-float pat-bg-house-1 absolute" style={{ color: RED }}>
        <Home className="h-[62px] w-[62px] sm:h-[83px] sm:w-[83px]" strokeWidth={1.5} />
      </span>
      <span className="pat-bg-float pat-bg-house-2 absolute" style={{ color: RED }}>
        <Home className="h-[52px] w-[52px] sm:h-[73px] sm:w-[73px]" strokeWidth={1.5} />
      </span>
      <span className="pat-bg-float pat-bg-house-3 absolute" style={{ color: BLACK }}>
        <Home className="h-[73px] w-[73px] sm:h-[104px] sm:w-[104px]" strokeWidth={1.5} />
      </span>

      {/* Map pins */}
      <span className="pat-bg-float pat-bg-pin-1 absolute" style={{ color: RED }}>
        <MapPin className="h-[52px] w-[52px] sm:h-[73px] sm:w-[73px]" strokeWidth={1.5} />
      </span>
      <span className="pat-bg-float pat-bg-pin-2 absolute" style={{ color: BLACK }}>
        <MapPin className="h-[42px] w-[42px] sm:h-[62px] sm:w-[62px]" strokeWidth={1.5} />
      </span>
      <span className="pat-bg-float pat-bg-pin-3 absolute" style={{ color: RED }}>
        <MapPin className="h-[62px] w-[62px] sm:h-[83px] sm:w-[83px]" strokeWidth={1.5} />
      </span>

      {/* Geometric SVGs */}
      <svg
        className="pat-bg-float pat-bg-geo-1 absolute h-[83px] w-[83px] sm:h-[125px] sm:w-[125px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={RED}
        strokeWidth="2"
      >
        <circle cx="50" cy="50" r="40" />
        <circle cx="50" cy="50" r="24" />
      </svg>
      <svg
        className="pat-bg-float pat-bg-geo-2 absolute h-[104px] w-[104px] sm:h-[146px] sm:w-[146px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={BLACK}
        strokeWidth="2"
      >
        <polygon points="50,10 90,80 10,80" />
      </svg>
      <svg
        className="pat-bg-float pat-bg-geo-3 absolute h-[73px] w-[73px] sm:h-[104px] sm:w-[104px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={RED}
        strokeWidth="2"
      >
        <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(15 50 50)" />
      </svg>
      <svg
        className="pat-bg-float pat-bg-geo-4 absolute h-[52px] w-[52px] sm:h-[83px] sm:w-[83px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={BLACK}
        strokeWidth="2"
      >
        <path d="M10 50 L50 10 L90 50 L50 90 Z" />
      </svg>

      <style>{`
        @keyframes pat-drift-a {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -25px) rotate(8deg); }
        }
        @keyframes pat-drift-b {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-25px, 30px) rotate(-10deg); }
        }
        @keyframes pat-drift-c {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, 25px) rotate(12deg); }
        }
        @keyframes pat-drift-d {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, -20px) rotate(-6deg); }
        }

        .pat-bg-float { will-change: transform; }

        .pat-bg-house-1 { top: 8%;  left: 6%;   animation: pat-drift-a 24s ease-in-out infinite; }
        .pat-bg-house-2 { top: 70%; left: 12%;  animation: pat-drift-b 28s ease-in-out infinite; }
        .pat-bg-house-3 { top: 18%; right: 8%;  animation: pat-drift-c 26s ease-in-out infinite; }

        .pat-bg-pin-1   { top: 40%; left: 4%;   animation: pat-drift-d 22s ease-in-out infinite; }
        .pat-bg-pin-2   { top: 78%; right: 10%; animation: pat-drift-a 30s ease-in-out infinite; }
        .pat-bg-pin-3   { top: 12%; left: 45%;  animation: pat-drift-b 25s ease-in-out infinite; }

        .pat-bg-geo-1   { top: 55%; right: 6%;  animation: pat-drift-c 27s ease-in-out infinite; }
        .pat-bg-geo-2   { top: 30%; left: 30%;  animation: pat-drift-d 29s ease-in-out infinite; }
        .pat-bg-geo-3   { bottom: 8%; left: 40%; animation: pat-drift-a 23s ease-in-out infinite; }
        .pat-bg-geo-4   { top: 50%; left: 55%;  animation: pat-drift-b 26s ease-in-out infinite; }

        @media (max-width: 640px) {
          .pat-bg-float { transform: scale(0.75); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pat-bg-float { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
