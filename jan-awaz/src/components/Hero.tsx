"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionConfig, motion } from "motion/react";
import { Check, Mic } from "lucide-react";

const trustBadges = [
  "Free / मुफ़्त",
  "Identifiers redacted / पहचान सुरक्षित",
  "21-Day Govt Target / 21 दिन का लक्ष्य",
] as const;

type HeroProps = {
  onStartReporting: () => void;
};

export default function Hero({ onStartReporting }: HeroProps) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(container.current?.querySelectorAll(".hero-reveal") ?? [], {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.04,
        ease: "power2.out",
      });
    },
    { scope: container, dependencies: [], revertOnUpdate: true },
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
      ref={container}
      className="relative flex min-h-[min(700px,100svh)] items-center justify-center overflow-hidden bg-[#020817] px-4 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] text-slate-50 sm:px-6 sm:py-16 lg:px-8"
      aria-labelledby="hero-heading"
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:48px_48px]" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="apple-glass relative w-full max-w-4xl rounded-2xl px-5 py-8 text-center shadow-2xl sm:px-10 sm:py-10"
      >
        <p className="hero-reveal mb-4 text-sm font-bold tracking-[0.08em] text-amber-200 sm:mb-5 sm:tracking-[0.12em]">
          CPGRAMS AI / जन आवाज़
        </p>

        <h1
          id="hero-heading"
          className="apple-display hero-reveal mx-auto max-w-[18ch] text-[clamp(2.75rem,7vw,4.5rem)] font-extrabold text-white"
        >
          Your voice can solve a problem.
        </h1>

        <p className="hero-reveal mx-auto mt-5 max-w-2xl text-[clamp(1.0625rem,2.5vw,1.35rem)] font-medium leading-7 text-slate-200 sm:mt-6 sm:leading-8">
          अपनी शिकायत बोलकर दर्ज करें
          <span className="mx-2 text-slate-400" aria-hidden="true">·</span>
          Speak your complaint and get a CPGRAMS-ready draft for the right government office.
        </p>

        <button
          type="button"
          onClick={onStartReporting}
          aria-label="Tap and speak complaint / बोलें"
          className="apple-press hero-reveal mx-auto mt-8 flex min-h-[64px] w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-amber-400 px-5 py-4 text-lg font-extrabold leading-tight tracking-[-0.01em] text-slate-950 shadow-[0_12px_30px_-12px_rgba(251,191,36,0.7)] hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 sm:mt-10 sm:px-6 sm:text-xl"
        >
          <Mic className="h-7 w-7 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <span>Tap &amp; Speak Complaint / बोलें</span>
        </button>

        <ul className="hero-reveal mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-2 text-sm font-semibold sm:mt-10 sm:grid-cols-3 sm:gap-3">
          {trustBadges.map((badge) => (
            <li key={badge} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-slate-100">
              <Check className="mr-1 inline-block h-4 w-4" strokeWidth={3} aria-hidden="true" />
              {badge}
            </li>
          ))}
        </ul>
      </motion.div>
      </section>
    </MotionConfig>
  );
}
