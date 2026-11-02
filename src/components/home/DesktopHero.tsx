import { motion } from "framer-motion";
import { DayNightHero } from "@/components/home/DayNightHero";

export default function DesktopHero() {
  return (
    <DayNightHero>
      <motion.h1
        className="font-display text-[84px] leading-[0.95] max-w-[16ch] text-white [text-shadow:0_4px_24px_rgba(0,0,0,.35)]"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        Find your perfect stay in Lebanon
      </motion.h1>
      <motion.p
        className="mt-[18px] max-w-[40ch] text-[19px] leading-relaxed text-white/90 [text-wrap:balance] [text-shadow:0_2px_10px_rgba(0,0,0,.4)]"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      >
        Browse unique listings from trusted local hosts.
      </motion.p>
    </DayNightHero>
  );
}
