import { useEffect, useRef, useState, type ReactNode, type ElementType, type CSSProperties } from "react";

/**
 * Reveal — IntersectionObserver-driven fade + slide-up animation.
 * Element starts invisible and 24px below; eases to its final position
 * once it crosses the viewport threshold. Honors prefers-reduced-motion.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  duration = 700,
  className = "",
  style,
  threshold = 0.15,
  once = true,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  threshold?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) obs.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once]);

  const mergedStyle: CSSProperties = {
    transitionProperty: "opacity, transform",
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
    transitionDelay: `${delay}ms`,
    opacity: visible ? 1 : 0,
    transform: visible ? "translate3d(0,0,0)" : "translate3d(0, 28px, 0)",
    willChange: "opacity, transform",
    ...style,
  };

  return (
    <Tag ref={ref as never} className={className} style={mergedStyle}>
      {children}
    </Tag>
  );
}
