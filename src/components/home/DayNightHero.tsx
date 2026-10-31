import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// body overflow-x:hidden makes body a non-scrolling scroll container, which breaks sticky; clip avoids that.
// The site Header is sticky (64px tall) and occupies layout space, so the pinned
// stage sits just below it instead of being hidden underneath.
const CSS = `
html,body{overflow-x:clip !important}
.dnh-track{--p:0;position:relative;height:280vh}
.dnh-stage{position:sticky;top:64px;height:calc(100vh - 64px);height:calc(100svh - 64px);overflow:hidden;background:#0A1530}
.dnh-scene{position:absolute;inset:0;transform:scale(calc(1.02 + var(--p) * 0.07));transform-origin:50% 62%;will-change:transform}
.dnh-img,.dnh-dusk{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:56% 50%}
.dnh-dusk{background:linear-gradient(180deg,rgba(255,138,61,.75) 0%,rgba(255,96,48,.45) 38%,rgba(255,170,90,.15) 62%,transparent 80%);mix-blend-mode:soft-light;opacity:min(clamp(0,calc(var(--p) / .28),1),clamp(0,calc((.78 - var(--p)) / .3),1))}
.dnh-lights{mix-blend-mode:lighten;opacity:clamp(0,calc((var(--p) - .14) / .3),1)}
.dnh-night{opacity:clamp(0,calc((var(--p) - .32) / .5),1)}
.dnh-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,transparent 16%,transparent 45%,rgba(0,0,0,.7) 100%)}
.dnh-content{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:0 24px calc(env(safe-area-inset-bottom,0px) + 84px);color:#fff;pointer-events:none}
.dnh-logo{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);z-index:11;display:flex;justify-content:center;pointer-events:none;padding:0 24px}
.dnh-cue{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 26px);transform:translateX(-50%);z-index:10;display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff;font-size:12px;font-weight:600;opacity:clamp(0,calc(1 - var(--p) * 5),1)}
.dnh-cue svg{animation:dnh-bob 1.8s ease-in-out infinite}
@keyframes dnh-bob{50%{transform:translateY(5px)}}
@media (max-width:767px){.dnh-img{object-position:50% 50%}.dnh-content{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 76px)}.dnh-shade{background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,transparent 18%,transparent 42%,rgba(0,0,0,.72) 100%)}.dnh-cue{bottom:calc(env(safe-area-inset-bottom,0px) + 14px)}}
@media (prefers-reduced-motion: reduce){.dnh-track{height:auto}.dnh-stage{position:relative}.dnh-scene{transform:none}.dnh-dusk,.dnh-lights,.dnh-night,.dnh-cue{display:none}}
`;

export function DayNightHero({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const range = track.offsetHeight - window.innerHeight;
      const raw = range > 0 ? -track.getBoundingClientRect().top / range : 0;
      const p = Math.min(1, Math.max(0, raw));
      track.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={trackRef} aria-label="Beitak hero" className="dnh-track">
      <style>{CSS}</style>
      <div className="dnh-stage">
        <div className="dnh-scene" aria-hidden="true">
          <img src="/hero-day.webp" className="dnh-img" fetchPriority="high" alt="" />
          <div className="dnh-dusk" />
          <img src="/hero-night.webp" className="dnh-img dnh-lights" alt="" />
          <img src="/hero-night.webp" className="dnh-img dnh-night" alt="" />
        </div>
        <div className="dnh-shade" />
        <div className="dnh-content">{children}</div>
        <div className="dnh-cue" aria-hidden="true">
          <span>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </div>
    </section>
  );
}
