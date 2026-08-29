"use client";

import GrievanceForm from "@/components/GrievanceForm";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";

export default function Home() {
  function startReporting() {
    const grievanceForm = document.getElementById("grievance-form");
    if (!grievanceForm) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    grievanceForm.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  function scrollToTriageDashboard() {
    const dashboard = document.getElementById("triage-dashboard");
    if (!dashboard) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dashboard.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950">
      <Hero onStartReporting={startReporting} />
      <HowItWorks />
      <GrievanceForm onResultReady={scrollToTriageDashboard} />
    </main>
  );
}
