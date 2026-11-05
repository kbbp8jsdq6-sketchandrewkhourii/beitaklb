import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// body overflow-x:hidden makes body a non-scrolling scroll container, which breaks sticky; clip avoids that.
// The Header overlays the hero on the homepage, so the stage pins at the very top.
const CSS = `
html,body{overflow-x:clip !important}
.dnh-track{--p:0;position:relative;height:280vh}
.dnh-stage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;background:#0A1530}
.dnh-scene{position:absolute;inset:0;transform:scale(calc(1.02 + var(--p) * 0.07));transform-origin:50% 62%;will-change:transform}
.dnh-layer{position:absolute;inset:0}
.dnh-bg{display:none}
.dnh-ph{display:none}
.dnh-pic,.dnh-dusk{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:56% 50%}
.dnh-pic{transition:opacity .4s ease;opacity:0}.dnh-pic.is-on{opacity:1}
.dnh-dusk{background:linear-gradient(180deg,rgba(255,138,61,.75) 0%,rgba(255,96,48,.45) 38%,rgba(255,170,90,.15) 62%,transparent 80%);mix-blend-mode:soft-light;opacity:min(clamp(0,calc(var(--p) / .28),1),clamp(0,calc((.78 - var(--p)) / .3),1))}
.dnh-lights{mix-blend-mode:lighten;opacity:clamp(0,calc((var(--p) - .14) / .3),1)}
.dnh-night{opacity:clamp(0,calc((var(--p) - .32) / .5),1)}
.dnh-shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,transparent 16%,transparent 45%,rgba(0,0,0,.7) 100%)}
.dnh-content{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:0 24px calc(env(safe-area-inset-bottom,0px) + 84px);color:#fff;pointer-events:none}
.dnh-logo{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);z-index:11;display:flex;justify-content:center;pointer-events:none;padding:0 24px}
.dnh-cue{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 26px);transform:translateX(-50%);z-index:10;display:flex;flex-direction:column;align-items:center;gap:6px;color:#fff;font-size:12px;font-weight:600;opacity:clamp(0,calc(1 - var(--p) * 5),1)}
.dnh-cue svg{animation:dnh-bob 1.8s ease-in-out infinite}
@keyframes dnh-bob{50%{transform:translateY(5px)}}
@media (max-width:767px){.dnh-bg{display:block;position:absolute;inset:0;background-size:cover;background-position:56% 50%;filter:blur(28px) saturate(1.1);transform:scale(1.2)}.dnh-ph{display:block;position:absolute;left:50%;top:13%;height:62%;aspect-ratio:2528/1684;transform:translateX(-50%);background-size:cover;filter:blur(6px);-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 16%,#000 84%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0%,#000 16%,#000 84%,transparent 100%)}.dnh-pic{inset:auto;left:50%;top:13%;height:62%;width:auto;max-width:none;transform:translateX(-50%);-webkit-mask-image:linear-gradient(180deg,transparent 0%,#000 16%,#000 84%,transparent 100%);mask-image:linear-gradient(180deg,transparent 0%,#000 16%,#000 84%,transparent 100%)}.dnh-content{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 76px)}.dnh-shade{background:linear-gradient(180deg,rgba(0,0,0,.4) 0%,transparent 18%,transparent 42%,rgba(0,0,0,.72) 100%)}.dnh-cue{bottom:calc(env(safe-area-inset-bottom,0px) + 14px)}.dnh-logo{top:calc(env(safe-area-inset-top,0px) + 10px)}}
@media (prefers-reduced-motion: reduce){.dnh-track{height:auto}.dnh-stage{position:relative}.dnh-scene{transform:none}.dnh-dusk,.dnh-lights,.dnh-night,.dnh-cue{display:none}}
`;

const DAY_TINY = "data:image/webp;base64,UklGRswBAABXRUJQVlA4IMABAADwCACdASowACAAPulgpk2pJaOiMAqpIB0JbACxJUFTvfiPJfShpvFGzvKAsDrelx571XQcZDhLkpQFTCeqAlaAZom+6A84mck6cbWiSp/TIAD+86J6NrextmPTseM7p6mV4bcWlieOAJjjHNf5Pv5OtfSpwYKlq1g06B3opxK+aZr3MJG5PNt7RfnV3VGI62pK1VyQC5pe3OqTJjjiC5B12Py7D9r3FfgZ0p+WNrbk+uQN0aV7GxTOqgBSg6L3DahilSlYIhOn13+oXW10Bm+KC9of7sYWCu7wf7Pikg8echjf3777wmZNRe1r2xzE4sNBL8/qUcV2pKgE2wVs05184W3INe30Wi8hpLD2168+0tb0T45CaMrg0U8XVfVB5nVVqkk1DhVdE/TZZ3v2oKKbQTbPjm8BYd/ilZ2dcVhS9ZSDOpYXNoK8JJ8Adhrc3sBoQkgoyM5YVSXpwtPeOPsTUf/3sKvRoSuorgDOKqiYKv+ggvu7ayW+Yj1A/ctav30yBkiI0SQ3Zsxt0znNpf+ZdapQS4CjGLw/5YkXHYo42Z1YNsuKLgG4xcueOUiZEgUdx8YWeRWNy0wYqyDwAAAA";
const NIGHT_TINY = "data:image/webp;base64,UklGRrQBAABXRUJQVlA4IKgBAAAwCQCdASowACAAPu1qrE+ppiQiKrgMATAdiWwAsR7HAac1ti5QwYfHqe9Lj0qxCK8H+lEZDZkPjIH4qh35o15jvWeReOokLeIl37AR6OzSXPYgAP78VBLyzelDmxja6FU2lfmyqTL2qHBMiK5/tEnzIKXoFPr8seSPaxzsTH//BhOmY2SiGpkImGVgbLanoQY2c2jKj3nMjHoxdysxpttkDa9/VMROeVYrb8ODgDsWUHv54iT4/V6fUzSxarKj1M6CnnsMg8hdRwQ5h38pHy/TztZ3NFcShLCbzNoCMTZdTh+USi+ZZXio6w6WaWiGNBsHW/SsCZUHZGrA2XiN9whxEGucGPVZGtnhls6wLrbT6g7wCdsZjhusDx37pqdExNmQHSPwqHltnMp3tL4CloYa4BGkbeuuPLZSoWSy5vBp6tSBj6HNwVt4loWO+9w3exJDGqYDafKfY822GE27KVKm02JIcB94p9sw7146sqNPqcZTcPrIUrBIM/8ukV+hCv+H9r9eAFjgnJnABhb6mhfGhbFgZEdxwVvoZj1H4VLMN/lkO6SDpgAA";

function HeroPhoto({ mobile, desktop, priority, onLoaded }: { mobile: string; desktop: string; priority?: boolean; onLoaded?: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const [on, setOn] = useState(false);
  const done = () => {
    setOn(true);
    onLoaded?.();
  };
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <picture>
      <source media="(max-width: 767px)" srcSet={mobile} />
      <img
        ref={ref}
        src={desktop}
        className={`dnh-pic${on ? " is-on" : ""}`}
        alt=""
        aria-hidden="true"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        onLoad={done}
        onError={() => setOn(false)}
      />
    </picture>
  );
}

function Layer({ tiny, className, children }: { tiny: string; className?: string; children?: ReactNode }) {
  const bg = { backgroundImage: `url(${tiny})` };
  return (
    <div className={`dnh-layer${className ? " " + className : ""}`}>
      <div className="dnh-bg" style={bg} />
      <div className="dnh-ph" style={bg} />
      {children}
    </div>
  );
}

export function DayNightHero({ children, logo }: { children: ReactNode; logo?: ReactNode }) {
  const trackRef = useRef<HTMLElement>(null);
  const [showNight, setShowNight] = useState(false);

  useEffect(() => {
    if (showNight) return;
    const go = () => setShowNight(true);
    window.addEventListener("scroll", go, { passive: true, once: true });
    return () => window.removeEventListener("scroll", go);
  }, [showNight]);

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
          <Layer tiny={DAY_TINY}>
            <HeroPhoto mobile="/hero-day-mobile.webp" desktop="/hero-day.webp" priority onLoaded={() => setShowNight(true)} />
          </Layer>
          <div className="dnh-dusk" />
          <Layer tiny={NIGHT_TINY} className="dnh-lights">
            {showNight ? <HeroPhoto mobile="/hero-night-mobile.webp" desktop="/hero-night.webp" /> : null}
          </Layer>
          <Layer tiny={NIGHT_TINY} className="dnh-night">
            {showNight ? <HeroPhoto mobile="/hero-night-mobile.webp" desktop="/hero-night.webp" /> : null}
          </Layer>
        </div>
        <div className="dnh-shade" />
        {logo ? <div className="dnh-logo">{logo}</div> : null}
        <div className="dnh-content">{children}</div>
        <div className="dnh-cue" aria-hidden="true">
          <span>Scroll</span>
          <ChevronDown size={18} />
        </div>
      </div>
    </section>
  );
}
