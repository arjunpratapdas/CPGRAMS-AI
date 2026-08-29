"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MotionConfig, motion } from "motion/react";
import { Cpu, FileCheck, MessageSquareText } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Speak or type your problem",
    translation: "अपनी समस्या बोलें या लिखें",
    Icon: MessageSquareText,
  },
  {
    number: "02",
    title: "AI finds the right department",
    translation: "AI सही विभाग चुनता है",
    Icon: Cpu,
  },
  {
    number: "03",
    title: "Get your complaint draft",
    translation: "औपचारिक शिकायत पत्र प्राप्त करें",
    Icon: FileCheck,
  },
] as const;

export default function HowItWorks() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(container.current?.querySelectorAll(".step-card") ?? [], {
        opacity: 0,
        y: 20,
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: container, dependencies: [], revertOnUpdate: true },
  );

  return (
    <MotionConfig reducedMotion="user">
      <section
      ref={container}
      className="bg-slate-900 px-4 py-20 text-slate-50 sm:px-6 lg:px-8 lg:py-28"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="how-it-works-heading"
          className="apple-display text-center text-[clamp(2rem,5vw,3.5rem)] font-extrabold text-white"
        >
          How it works
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-slate-200 sm:text-lg">
          Three simple steps to make your voice heard.
        </p>

        <ol className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map(({ number, title, translation, Icon }, index) => (
            <motion.li
              key={number}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              className="apple-glass step-card rounded-2xl p-6 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.9)]"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f59e0b] text-sm font-extrabold text-slate-950 shadow-[0_8px_20px_-10px_rgba(245,158,11,0.9)]">
                  {number}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f59e0b] text-slate-950">
                  <Icon className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-[-0.01em] text-white">{title}</h3>
              <p className="mt-3 text-base font-medium leading-relaxed text-slate-200">{translation}</p>
            </motion.li>
          ))}
        </ol>
      </div>
      </section>
    </MotionConfig>
  );
}
