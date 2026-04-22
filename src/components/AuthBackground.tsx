import { Home, MapPin } from "lucide-react";

/**
 * BEITAK animated auth background.
 * Pure CSS keyframes — softly drifting houses, pins, and geometric shapes.
 * Palette: red #E63030 @ 25% (houses/pins/geo), black #111111 @ 15% (houses/pins/geo).
 */
export function AuthBackground() {
  const RED = "rgba(230,48,48,0.25)";
  const BLACK = "rgba(17,17,17,0.15)";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: "#ffffff" }}
    >
      {/* Houses — 30% larger than before */}
      <span className="auth-bg-float auth-bg-house-1 absolute" style={{ color: RED }}>
        <Home className="h-[62px] w-[62px] sm:h-[83px] sm:w-[83px]" strokeWidth={1.5} />
      </span>
      <span className="auth-bg-float auth-bg-house-2 absolute" style={{ color: RED }}>
        <Home className="h-[52px] w-[52px] sm:h-[73px] sm:w-[73px]" strokeWidth={1.5} />
      </span>
      <span className="auth-bg-float auth-bg-house-3 absolute" style={{ color: BLACK }}>
        <Home className="h-[73px] w-[73px] sm:h-[104px] sm:w-[104px]" strokeWidth={1.5} />
      </span>

      {/* Map pins — 30% larger */}
      <span className="auth-bg-float auth-bg-pin-1 absolute" style={{ color: RED }}>
        <MapPin className="h-[52px] w-[52px] sm:h-[73px] sm:w-[73px]" strokeWidth={1.5} />
      </span>
      <span className="auth-bg-float auth-bg-pin-2 absolute" style={{ color: BLACK }}>
        <MapPin className="h-[42px] w-[42px] sm:h-[62px] sm:w-[62px]" strokeWidth={1.5} />
      </span>
      <span className="auth-bg-float auth-bg-pin-3 absolute" style={{ color: RED }}>
        <MapPin className="h-[62px] w-[62px] sm:h-[83px] sm:w-[83px]" strokeWidth={1.5} />
      </span>

      {/* Geometric SVGs — 30% larger */}
      <svg
        className="auth-bg-float auth-bg-geo-1 absolute h-[83px] w-[83px] sm:h-[125px] sm:w-[125px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={RED}
        strokeWidth="2"
      >
        <circle cx="50" cy="50" r="40" />
        <circle cx="50" cy="50" r="24" />
      </svg>
      <svg
        className="auth-bg-float auth-bg-geo-2 absolute h-[104px] w-[104px] sm:h-[146px] sm:w-[146px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={BLACK}
        strokeWidth="2"
      >
        <polygon points="50,10 90,80 10,80" />
      </svg>
      <svg
        className="auth-bg-float auth-bg-geo-3 absolute h-[73px] w-[73px] sm:h-[104px] sm:w-[104px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={RED}
        strokeWidth="2"
      >
        <rect x="15" y="15" width="70" height="70" rx="8" transform="rotate(15 50 50)" />
      </svg>
      <svg
        className="auth-bg-float auth-bg-geo-4 absolute h-[52px] w-[52px] sm:h-[83px] sm:w-[83px]"
        viewBox="0 0 100 100"
        fill="none"
        stroke={BLACK}
        strokeWidth="2"
      >
        <path d="M10 50 L50 10 L90 50 L50 90 Z" />
      </svg>

      <style>{`
        @keyframes auth-drift-a {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(30px, -25px) rotate(8deg); }
        }
        @keyframes auth-drift-b {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-25px, 30px) rotate(-10deg); }
        }
        @keyframes auth-drift-c {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, 25px) rotate(12deg); }
        }
        @keyframes auth-drift-d {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(-30px, -20px) rotate(-6deg); }
        }

        .auth-bg-float { will-change: transform; }

        .auth-bg-house-1 { top: 8%;  left: 6%;   animation: auth-drift-a 24s ease-in-out infinite; }
        .auth-bg-house-2 { top: 70%; left: 12%;  animation: auth-drift-b 28s ease-in-out infinite; }
        .auth-bg-house-3 { top: 18%; right: 8%;  animation: auth-drift-c 26s ease-in-out infinite; }

        .auth-bg-pin-1   { top: 40%; left: 4%;   animation: auth-drift-d 22s ease-in-out infinite; }
        .auth-bg-pin-2   { top: 78%; right: 10%; animation: auth-drift-a 30s ease-in-out infinite; }
        .auth-bg-pin-3   { top: 12%; left: 45%;  animation: auth-drift-b 25s ease-in-out infinite; }

        .auth-bg-geo-1   { top: 55%; right: 6%;  animation: auth-drift-c 27s ease-in-out infinite; }
        .auth-bg-geo-2   { top: 30%; left: 30%;  animation: auth-drift-d 29s ease-in-out infinite; }
        .auth-bg-geo-3   { bottom: 8%; left: 40%; animation: auth-drift-a 23s ease-in-out infinite; }
        .auth-bg-geo-4   { top: 50%; left: 55%;  animation: auth-drift-b 26s ease-in-out infinite; }

        @media (max-width: 640px) {
          .auth-bg-float { transform: scale(0.75); }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-bg-float { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
