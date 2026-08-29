"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Clock3, Copy, Download, LoaderCircle, Mic, RotateCcw, Search, Send, ShieldCheck } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import type { GrievanceResult } from "../../../lib/cpgrams-engine";
import { processGrievance, redactSensitiveIdentifiers } from "../../../lib/cpgrams-engine";
import {
  generateMockOTP,
  verifyMockOTP,
  processMockDocument,
  generateMockReminder,
  generateMockAppeal,
  simplifyGovernmentResponse as mockSimplifyResponse,
  mockVoiceReadback,
  mockDraftSave,
  generateMockAccountabilityMetrics,
  generateMockClusterData,
  mockTechnicalTriage,
  mockResolutionAudit,
  generateMockShareLink,
} from "../../../lib/mock-data";

type SpeechRecognitionResult = {
  transcript: string;
  confidence?: number;
};

type SpeechRecognitionAlternative = {
  0: SpeechRecognitionResult;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionResultEvent = {
  results: {
    [index: number]: SpeechRecognitionAlternative;
    length: number;
  };
  resultIndex: number;
};

type SpeechRecognitionErrorEvent = {
  error?: string;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives?: number;
  start: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type StoredGrievance = {
  result: GrievanceResult;
  summary: string;
  submittedAt: string;
};

type InterfaceMode = "standard" | "simple" | "assisted";
type AuthStep = "phone" | "otp" | "details";

type GrievanceFormProps = {
  onResultReady: () => void;
};

const STORAGE_KEY = "jan-awaz-demo-grievances";
const DRAFT_STORAGE_KEY = "jan-awaz-demo-draft";

const modes = [
  { id: "standard", label: "Standard Mode" },
  { id: "simple", label: "Simple Mode" },
  { id: "assisted", label: "Assisted Mode" },
] as const;

const progressStages = [
  "Submitted",
  "Forwarded",
  "Investigation",
  "Resolution",
] as const;

const appealReasons = [
  "No action taken",
  "Incorrect response",
  "Partially resolved",
] as const;

const jargonItems = [
  { term: "Nodal Officer", detail: "The designated government officer responsible for grievance intake and first-level review." },
  { term: "Appellate Authority", detail: "The senior officer who reviews a complaint when a citizen is dissatisfied with the initial response." },
  { term: "Disposed", detail: "A case is marked closed after a final decision or resolution has been recorded." },
  { term: "Subjudice", detail: "A matter currently under judicial consideration and therefore not to be treated as a routine administrative complaint." },
] as const;

const presets = [
  { label: "Postal Delay", value: "My Speed Post parcel has not been delivered and tracking has not updated." },
  { label: "Unauthorized Bank Fee", value: "An unauthorized service fee was deducted from my bank account this month." },
  { label: "Toll Double-Charge", value: "I was charged twice at a national highway toll plaza for one journey." },
] as const;

export default function GrievanceForm({ onResultReady }: GrievanceFormProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<GrievanceResult | null>(null);
  const [memo, setMemo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackedGrievance, setTrackedGrievance] = useState<StoredGrievance | null>(null);
  const [interfaceMode, setInterfaceMode] = useState<InterfaceMode>("standard");
  const [showTechTriage, setShowTechTriage] = useState(false);
  const [techIssueType, setTechIssueType] = useState<"website" | "service">("website");
  const [authStep, setAuthStep] = useState<AuthStep>("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [address, setAddress] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState("Not saved yet");
  const [shareLink, setShareLink] = useState("");
  const [appealReason, setAppealReason] = useState<(typeof appealReasons)[number]>("No action taken");
  const [appealDraft, setAppealDraft] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
  const [documentStatus, setDocumentStatus] = useState("No attachments processed yet.");
  const [responseSimplified, setResponseSimplified] = useState("");
  const [closureAudit, setClosureAudit] = useState<"pending" | "solved" | "partial" | "unsolved">("pending");
  const [otpSentMessage, setOtpSentMessage] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  
  // Memoize mock data to prevent regeneration on every render
  const mockClusterData = useMemo(() => generateMockClusterData(), []);
  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const draft = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draft) return;

    try {
      const parsed = JSON.parse(draft) as { input?: string; memo?: string; interfaceMode?: InterfaceMode };
      if (parsed.input) setInput(parsed.input);
      if (parsed.memo) setMemo(parsed.memo);
      if (parsed.interfaceMode) setInterfaceMode(parsed.interfaceMode);
    } catch {
      // ignore invalid draft payloads
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const payload = { input, memo, interfaceMode };
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    const saveResult = mockDraftSave(JSON.stringify(payload));
    setDraftSavedAt(saveResult.savedAt);

    const mockLink = generateMockShareLink(input || "draft");
    setShareLink(mockLink);
  }, [input, memo, interfaceMode]);

  async function submitGrievance(value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    setInput(trimmedValue);
    setIsSubmitting(true);
    setResult(null);
    setIsSubmitted(false);
    setTrackedGrievance(null);
    setCopied(false);
    setError(null);
    setDocumentStatus("Processing grievance with mock data...");
    
    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grievance: trimmedValue }),
      });

      const triage: GrievanceResult = response.ok
        ? await response.json() as GrievanceResult
        : await processGrievance(trimmedValue);

      setResult(triage);
      setMemo(triage.grievance_memo);
      setDocumentStatus(`✓ Mock triage completed - Source: ${triage.triageSource}`);
      window.requestAnimationFrame(onResultReady);
    } catch {
      const fallback = await processGrievance(trimmedValue);
      setResult(fallback);
      setMemo(fallback.grievance_memo);
      setDocumentStatus(`✓ Mock triage completed (fallback) - Source: ${fallback.triageSource}`);
      window.requestAnimationFrame(onResultReady);
    } finally {
      setIsSubmitting(false);
    }
  }

  function registerGrievance() {
    if (!result) return;

    const storedResult: GrievanceResult = { ...result, grievance_memo: redactSensitiveIdentifiers(memo), petitionDraft: redactSensitiveIdentifiers(memo) };
    const stored: StoredGrievance = { result: storedResult, summary: redactSensitiveIdentifiers(input), submittedAt: new Date().toISOString() };
    const existing = readStoredGrievances();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, [result.registrationId]: stored }));
    } catch {
      setError("We could not save this registration in your browser. Please check storage permissions and try again.");
      return;
    }
    setIsSubmitted(true);
    setTrackingId(result.registrationId);
  }

  function resetGrievance() {
    recognitionRef.current?.abort();
    setInput("");
    setResult(null);
    setMemo("");
    setIsSubmitted(false);
    setTrackingId("");
    setTrackedGrievance(null);
    setError(null);
    setCopied(false);
  }

  function trackGrievance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const stored = readStoredGrievances()[trackingId.trim().toUpperCase()];
    setTrackedGrievance(stored ?? null);
    setError(stored ? null : "We could not find that registration number in this demo portal.");
  }

  function readStoredGrievances(): Record<string, StoredGrievance> {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, StoredGrievance>
        : {};
    } catch {
      return {};
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitGrievance(input);
  }

  function startVoiceInput() {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = speechWindow.webkitSpeechRecognition ?? speechWindow.SpeechRecognition;

    if (!Recognition) {
      setError("Voice input is not available in this browser. Please use Chrome, Edge, or Safari and type your grievance instead.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new Recognition();
    
    // Enhanced language detection - support Hindi and English
    const userLang = navigator.language.toLowerCase();
    if (userLang.includes("hi") || userLang.includes("hindi")) {
      recognition.lang = "hi-IN";
    } else if (userLang.includes("ta")) {
      recognition.lang = "ta-IN";
    } else if (userLang.includes("te")) {
      recognition.lang = "te-IN";
    } else if (userLang.includes("bn")) {
      recognition.lang = "bn-IN";
    } else if (userLang.includes("mr")) {
      recognition.lang = "mr-IN";
    } else {
      recognition.lang = "en-IN";
    }
    
    // Enable continuous listening for better capture
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    
    // Better result handling with interim results
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        
        if (result.isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Update input with final transcript
      if (finalTranscript) {
        setInput((current) => {
          const newText = [current, finalTranscript].filter(Boolean).join(" ").trim();
          return newText.slice(0, 2000);
        });
      }
      
      // Show interim results in document status
      if (interimTranscript) {
        setDocumentStatus(`Listening: "${interimTranscript}"`);
      }
    };
    
    // Enhanced error handling
    recognition.onerror = (event: { error?: string }) => {
      const errorType = event.error;
      setIsListening(false);
      
      if (errorType === "no-speech") {
        setError("No speech detected. Please speak clearly and try again.");
      } else if (errorType === "audio-capture") {
        setError("Microphone not found. Please check your device settings and grant microphone permission.");
      } else if (errorType === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (errorType === "network") {
        setError("Network error. Voice recognition requires internet connection.");
      } else {
        setError("Voice input error. Please try again or type your grievance.");
      }
      
      recognitionRef.current = null;
    };
    
    // Auto-restart on end for continuous listening
    recognition.onend = () => {
      if (isListening && recognitionRef.current) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
          setDocumentStatus("Voice input completed. Click mic button to resume.");
        }
      } else {
        setIsListening(false);
        setDocumentStatus("Voice input stopped.");
      }
    };
    
    // Start handler
    recognition.onstart = () => {
      setDocumentStatus("🎤 Listening... Speak your grievance clearly. Click mic button again to stop.");
      setError(null);
    };

    recognitionRef.current = recognition;
    setError(null);
    setIsListening(true);
    
    try {
      recognition.start();
    } catch (error) {
      recognitionRef.current = null;
      setIsListening(false);
      setError("Voice input could not start. Please check microphone permission in your browser settings.");
      console.error("Speech recognition error:", error);
    }
  }
  
  function stopVoiceInput() {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setDocumentStatus("Voice input stopped. You can edit the text or click mic to resume.");
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(memo);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the draft. Please select and copy it manually.");
    }
  }

  async function copyTextToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Clipboard permission is blocked. Please copy manually from the visible text.");
    }
  }

  function saveDraftLocally() {
    if (typeof window === "undefined") return;
    const draftPayload = JSON.stringify({ input, memo, interfaceMode });
    window.localStorage.setItem(DRAFT_STORAGE_KEY, draftPayload);
    const saveResult = mockDraftSave(draftPayload);
    setDraftSavedAt(saveResult.savedAt);
    setError(null);
    setDocumentStatus(`Draft saved successfully at ${saveResult.savedAt} (${saveResult.size} bytes)`);
  }

  function downloadDraft() {
    const blob = new Blob([memo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result?.registrationId ?? "jan-awaz-grievance"}-draft.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleReminder() {
    if (!result) return;
    const mockReminder = generateMockReminder(result.registrationId, 15);
    setMemo((current) => current ? `${current}\n\n--- Reminder ---\n${mockReminder.reminderText}` : mockReminder.reminderText);
    setError(null);
  }

  function handleAppealWizard() {
    if (!result) return;
    const mockAppeal = generateMockAppeal(appealReason, result.registrationId, input);
    setAppealDraft(mockAppeal.body);
    setMemo((current) => current || mockAppeal.body);
    setError(null);
  }

  function simplifyGovernmentResponse() {
    const mockSimplified = mockSimplifyResponse();
    setResponseSimplified(mockSimplified.simplified.join("\n"));
  }

  function handleDocumentHelper() {
    const mockDoc = processMockDocument("receipt.jpg");
    setDocumentStatus(mockDoc.details);
  }

  function readDraftAloud() {
    if (!("speechSynthesis" in window)) {
      setError("Voice read-back is not available in this browser.");
      return;
    }

    const mockVoice = mockVoiceReadback(memo || "Your grievance draft is ready.", voiceLanguage);
    const utterance = new SpeechSynthesisUtterance(memo || "Your grievance draft is ready.");
    utterance.lang = voiceLanguage;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setError(null);
    setDocumentStatus(`Voice playback: ${mockVoice.message} (${mockVoice.duration}s estimated)`);
  }

  function handleSendOTP() {
    if (!mobileNumber.trim()) {
      setError("Please enter a mobile number first.");
      return;
    }
    const otpResponse = generateMockOTP(mobileNumber);
    setOtpSentMessage(otpResponse.message);
    setAuthStep("otp");
    setError(null);
    // For demo purposes, show the mock OTP in console
    if (process.env.NODE_ENV === "development") {
      console.log("Mock OTP for testing:", otpResponse.mockOtp);
    }
  }

  function handleVerifyOTP() {
    if (!otpCode.trim()) {
      setError("Please enter the OTP.");
      return;
    }
    const isValid = verifyMockOTP(mobileNumber, otpCode);
    if (isValid) {
      setOtpVerified(true);
      setAuthStep("details");
      setError(null);
      setOtpSentMessage("OTP verified successfully!");
    } else {
      setError("Invalid OTP. Try '123456' for testing or check console for the generated OTP.");
    }
  }

  function handleTechTriageRoute(issueType: "website" | "service") {
    setTechIssueType(issueType);
    setShowTechTriage(false);
    const triageResult = mockTechnicalTriage(issueType);
    setDocumentStatus(`Tech triage: ${triageResult.route} - ${triageResult.expectedResolution}`);
  }

  function handleResolutionAudit(quality: "solved" | "partial" | "unsolved") {
    if (!result) return;
    setClosureAudit(quality);
    const auditResult = mockResolutionAudit(result.registrationId, quality);
    setMemo((current) => 
      current 
        ? `${current}\n\n--- Resolution Audit ---\nStatus: ${auditResult.auditStatus}\nFeedback: ${auditResult.feedback}\nNext Steps: ${auditResult.nextSteps.join(", ")}`
        : `Resolution Audit\nStatus: ${auditResult.auditStatus}\nFeedback: ${auditResult.feedback}`
    );
    setError(null);
  }

  function performSimpleModeAction(action: "submit" | "track" | "help") {
    if (action === "submit") {
      const source = input || presets[0].value;
      void submitGrievance(source);
      return;
    }

    if (action === "track") {
      const storedEntries = Object.entries(readStoredGrievances());
      const latest = storedEntries.at(-1);
      if (latest) {
        setTrackingId(latest[0]);
        setTrackedGrievance(latest[1]);
        setError(null);
        return;
      }
      setError("No saved complaint has been created yet in this browser demo.");
      return;
    }

    setInterfaceMode("assisted");
    setAuthStep("phone");
    setError(null);
  }

  return (
    <MotionConfig reducedMotion="user">
    <section id="grievance-form" className="bg-slate-950 px-4 py-14 text-slate-50 sm:px-6 lg:px-8" aria-labelledby="report-heading">
      <div className="mx-auto w-full max-w-3xl">
        <h2 id="report-heading" className="apple-display text-3xl font-extrabold text-white sm:text-4xl">Tell us your problem</h2>
        <p className="mt-3 text-lg text-slate-200">अपनी शिकायत लिखें — We will prepare it for the right office.</p>
        <p className="mt-3 rounded-xl border border-sky-300/20 bg-sky-300/10 p-3 text-sm leading-relaxed text-sky-100" role="note">
          Synthetic demo government data. No live government system was contacted. Common identifiers are redacted before triage, and demo records stay in this browser.
        </p>

        <div className="mt-6 flex flex-wrap gap-2" aria-label="Quick grievance examples">
          {presets.map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => void submitGrievance(value)}
              disabled={isSubmitting}
              className="apple-press flex min-h-[60px] items-center rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-100 disabled:cursor-wait disabled:opacity-60"
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <label htmlFor="grievance-input" className="sr-only">Your complaint</label>
          <div className="relative">
            <textarea
              id="grievance-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Example: My speed post has not arrived."
              rows={5}
              maxLength={2000}
              required
              className={`w-full rounded-xl border-2 bg-slate-900 p-4 text-lg text-white placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300 ${
                isListening ? "border-red-500 ring-2 ring-red-500/50" : "border-slate-600"
              }`}
            />
            {isListening && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-3 py-1.5 text-sm font-bold text-white">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-white"></span>
                </span>
                Recording
              </div>
            )}
          </div>
          <p className="mt-2 text-right text-sm text-slate-400">{input.length}/2,000 characters</p>
          <p className="mt-2 text-sm text-slate-300">Hindi / English / Hinglish input supported.</p>
          {isListening && (
            <div className="mt-3 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100">
              <p className="font-bold">🎤 Voice Recording Active</p>
              <ul className="mt-2 list-disc pl-5 text-xs">
                <li>Speak clearly and naturally</li>
                <li>Pause briefly between sentences</li>
                <li>Text will appear as you speak</li>
                <li>Click the mic button again to stop</li>
              </ul>
            </div>
          )}
          <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-100">
            Privacy-safe intake: identifiers are removed before department routing, and mock records remain in-browser only.
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isSubmitting}
              aria-label={isListening ? "Stop voice input" : "Start voice input"}
              className={`apple-press flex min-h-[60px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-base font-bold disabled:cursor-wait disabled:opacity-60 ${
                isListening 
                  ? "border-red-500 bg-red-500 text-white animate-pulse" 
                  : "border-slate-500 bg-slate-800 text-white"
              }`}
            >
              <Mic className="h-5 w-5" aria-hidden="true" />
              {isListening ? "🎤 Listening... (Click to stop)" : "Speak your grievance"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="apple-press flex min-h-[60px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-base font-extrabold text-slate-950 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-5 w-5 motion-safe:animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
              {isSubmitting ? "Finding help…" : "Submit grievance"}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Interface mode</p>
            <div className="flex flex-wrap gap-2">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setInterfaceMode(mode.id)}
                  className={`apple-press min-h-[52px] rounded-xl border px-3 py-2 text-sm font-bold ${interfaceMode === mode.id ? "border-amber-300 bg-amber-300 text-slate-950" : "border-slate-600 bg-slate-800 text-slate-200"}`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          {interfaceMode === "simple" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => performSimpleModeAction("submit")} className="min-h-[72px] rounded-2xl bg-emerald-400 px-4 py-3 text-base font-extrabold text-slate-950">Submit</button>
              <button type="button" onClick={() => performSimpleModeAction("track")} className="min-h-[72px] rounded-2xl bg-amber-300 px-4 py-3 text-base font-extrabold text-slate-950">Track</button>
              <button type="button" onClick={() => performSimpleModeAction("help")} className="min-h-[72px] rounded-2xl bg-sky-400 px-4 py-3 text-base font-extrabold text-slate-950">Help</button>
            </div>
          )}
          {interfaceMode === "assisted" && (
            <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-300/10 p-3 text-sm text-sky-100">
              Step 1: enter complaint. Step 2: review route. Step 3: register and track.
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Progressive onboarding</p>
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-200">{authStep}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Mobile number</label>
              <input value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} placeholder="+91 98765 43210" className="min-h-[52px] w-full rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-400" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">OTP</label>
              <input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} placeholder="123456" className="min-h-[52px] w-full rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white placeholder:text-slate-400" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Address / details required only when necessary</label>
            <textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} placeholder="House no., locality, city, or supporting clue only if required by the target department." className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-400" />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={handleSendOTP} className="apple-press min-h-[52px] rounded-xl border border-amber-300 bg-amber-300 px-3 py-2 text-sm font-extrabold text-slate-950">Send OTP</button>
            <button type="button" onClick={handleVerifyOTP} disabled={!otpCode.trim()} className="apple-press min-h-[52px] rounded-xl border border-emerald-300 bg-emerald-300 px-3 py-2 text-sm font-extrabold text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed">Verify OTP</button>
            <button type="button" onClick={() => setAuthStep("details")} className="apple-press min-h-[52px] rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-slate-200">Continue</button>
          </div>
          {otpSentMessage && <p className="mt-2 text-sm text-emerald-300">{otpSentMessage}</p>}
          {otpVerified && <p className="mt-2 text-sm font-bold text-emerald-300">✓ Mobile number verified</p>}
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Technical support triage</p>
            <button type="button" onClick={() => setShowTechTriage(true)} className="apple-press min-h-[48px] rounded-xl border border-sky-300 bg-sky-300/10 px-3 text-xs font-bold text-sky-100">Start support check</button>
          </div>
          {showTechTriage && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => handleTechTriageRoute("website")} className="min-h-[60px] rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-bold text-white">Website / OTP / account issue</button>
              <button type="button" onClick={() => handleTechTriageRoute("service")} className="min-h-[60px] rounded-xl border border-emerald-300 bg-emerald-300/10 px-3 py-2 text-sm font-bold text-emerald-100">Government service complaint</button>
            </div>
          )}
          <p className="mt-3 text-sm text-slate-300">Current route: {techIssueType === "website" ? "Technical issue flow" : "Government service complaint flow"}</p>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/90 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Draft controls</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyTextToClipboard(shareLink || window.location.href)} className="apple-press min-h-[52px] rounded-xl border border-amber-300 bg-amber-300/10 px-3 text-sm font-bold text-amber-100">Copy secure link</button>
            <button type="button" onClick={saveDraftLocally} className="apple-press min-h-[52px] rounded-xl border border-slate-600 bg-slate-800 px-3 text-sm font-bold text-slate-200">Save draft</button>
            <button type="button" onClick={() => void copyTextToClipboard(shareLink || window.location.href)} className="apple-press min-h-[52px] rounded-xl border border-sky-300 bg-sky-300/10 px-3 text-sm font-bold text-sky-100">Share resume link</button>
          </div>
          <p className="mt-3 text-xs text-slate-400">Last saved: {draftSavedAt}</p>
        </div>

        {error && <p className="mt-4 text-base font-semibold text-red-300" role="alert">{error}</p>}

        <AnimatePresence mode="wait">
        {result && (
          <motion.section
            key={result.registrationId}
            id="triage-dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="apple-glass mt-8 rounded-2xl p-5 text-left sm:p-6"
            aria-labelledby="triage-heading"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Triage dashboard</p>
                <h3 id="triage-heading" className="mt-1 text-2xl font-bold text-white">Your complaint draft is ready</h3>
              </div>
              <span className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-extrabold text-slate-950">{result.statutory_days}-Day SLA</span>
            </div>
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm leading-relaxed text-slate-300" role="note">
              Synthetic demo government data. No live government system was contacted. Triage: {result.triageSource === "openai" ? "OpenAI-assisted" : "offline local mock"}.
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-slate-300">Target Ministry</dt>
                <dd className="mt-1 text-base font-bold text-white">{result.target_ministry}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-300">Department</dt>
                <dd className="mt-1 text-base font-bold text-white">{result.department}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-300">Sub-category</dt>
                <dd className="mt-1 text-base font-bold capitalize text-white">{result.sub_category.replace(/-/g, " ")}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-slate-300">Priority</dt>
                <dd className={`mt-1 text-base font-bold ${result.urgency === "high" ? "text-red-300" : "text-emerald-300"}`}>
                  {result.urgency === "high" ? "High Priority" : result.urgency === "medium" ? "Priority Review" : "Normal Priority"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Administrative routing</p>
                  <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-bold text-sky-200">{result.routing.queue}</span>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                    <span className="text-slate-400">Desk</span>
                    <span className="text-right font-semibold text-white">{result.routing.desk}</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                    <span className="text-slate-400">Nodal officer</span>
                    <span className="text-right font-semibold text-white">{result.routing.nodal_officer}</span>
                  </li>
                  <li className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                    <span className="text-slate-400">Jurisdiction</span>
                    <span className="text-right font-semibold text-white">{result.routing.jurisdiction}</span>
                  </li>
                  <li className="flex items-start justify-between gap-3">
                    <span className="text-slate-400">SLA</span>
                    <span className="font-semibold text-emerald-300">{result.routing.sla_days} days</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-emerald-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Privacy safe routing
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-200">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    {result.privacy.redaction_applied ? "Identifiers redacted before routing" : "No direct identifiers required"}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    Consent status: {result.privacy.consent_status}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                    {result.privacy.retention_policy}
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Mock CPGRAMS integration</p>
                <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-200">{result.integration.status}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  <span className="text-slate-400">Portal</span>
                  <div className="mt-1 font-semibold text-white">{result.integration.portal}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  <span className="text-slate-400">Queue</span>
                  <div className="mt-1 font-semibold text-white">{result.integration.queue_id}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  <span className="text-slate-400">Channel</span>
                  <div className="mt-1 font-semibold text-white">{result.integration.submission_channel}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-200">
                  <span className="text-slate-400">Checksum</span>
                  <div className="mt-1 font-semibold text-white">{result.integration.checksum}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Escalation path
              </div>
              <ol className="mt-4 space-y-3">
                {result.routing.escalation_path.map((step, index) => (
                  <li key={step} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400/20 text-xs font-extrabold text-amber-200">{index + 1}</span>
                    <span className="flex-1">{step}</span>
                    {index < result.routing.escalation_path.length - 1 && <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />}
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label htmlFor="petition-memo" className="text-sm font-bold text-white">Formal petition memo</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void copyDraft()}
                    className="apple-press inline-flex min-h-[60px] items-center gap-2 rounded-lg px-3 text-sm font-bold text-amber-200 hover:bg-white/10"
                  >
                    {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                    {copied ? "Copied" : "Copy Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadDraft}
                    className="apple-press inline-flex min-h-[60px] items-center gap-2 rounded-lg px-3 text-sm font-bold text-amber-200 hover:bg-white/10"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </button>
                </div>
              </div>
              <textarea
                id="petition-memo"
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                rows={12}
                className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 p-3 text-base leading-relaxed text-slate-100 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Unified case-centric dashboard</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Complaint thread</p>
                  <p className="mt-2 text-sm text-slate-200">{result.grievance_memo.slice(0, 180)}...</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Reminders</p>
                  <button type="button" onClick={handleReminder} className="apple-press mt-2 min-h-[48px] rounded-xl bg-amber-300 px-3 text-sm font-extrabold text-slate-950">Send Reminder</button>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Status timeline</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-4" aria-label="Complaint progress timeline">
                {progressStages.map((stage, index) => {
                  const active = index <= 2;
                  const currentStep = stage === progressStages[2] && result.urgency === "high" ? "active" : stage === "Resolution" ? "pending" : active ? "done" : "pending";
                  return (
                    <div key={stage} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                      <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${currentStep === "done" ? "bg-emerald-400" : currentStep === "active" ? "bg-amber-400" : "bg-slate-700"}`}
                          style={{ width: currentStep === "done" ? "100%" : currentStep === "active" ? "65%" : "20%" }}
                        />
                      </div>
                      <p className="text-sm font-bold text-white">{stage}</p>
                    </div>
                  );
                })}
              </div>
              <ol className="mt-4 grid gap-3 md:grid-cols-2">
                {result.statusTimeline.map((entry) => (
                  <li key={entry.stage} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-white">{entry.stage}</span>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${entry.status === "done" ? "bg-emerald-400/10 text-emerald-200" : entry.status === "active" ? "bg-amber-400/10 text-amber-200" : "bg-slate-700 text-slate-200"}`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">{entry.owner}</p>
                    <p className="mt-1 text-sm text-slate-200">{entry.note}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Structured extraction payload</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-slate-200">
{JSON.stringify({
  ministry: result.target_ministry,
  department: result.department,
  sub_category: result.sub_category,
  urgency: result.urgency,
  registration_id: result.registrationId,
  statutory_sla_days: result.statutory_days,
  nodal_officer: result.nodal_officer,
}, null, 2)}
              </pre>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Plain-language jargon support</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {jargonItems.map((item) => (
                  <div key={item.term} className="group relative">
                    <button type="button" className="min-h-[44px] rounded-full border border-slate-600 bg-slate-800 px-3 text-xs font-bold text-slate-200">ℹ {item.term}</button>
                    <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-60 rounded-xl border border-white/10 bg-slate-950 p-2 text-xs leading-relaxed text-slate-200 shadow-xl group-hover:block">
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Guided appeal wizard</p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {appealReasons.map((reason) => (
                  <button key={reason} type="button" onClick={() => setAppealReason(reason)} className={`min-h-[52px] rounded-xl border px-3 text-sm font-bold ${appealReason === reason ? "border-amber-300 bg-amber-300 text-slate-950" : "border-slate-600 bg-slate-800 text-slate-200"}`}>
                    {reason}
                  </button>
                ))}
              </div>
              <button type="button" onClick={handleAppealWizard} className="apple-press mt-3 min-h-[52px] rounded-xl bg-sky-400 px-4 py-2 text-sm font-extrabold text-slate-950">Generate appeal draft</button>
              {appealDraft && <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs leading-relaxed text-slate-200">{appealDraft}</pre>}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Voice & support utilities</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <select value={voiceLanguage} onChange={(event) => setVoiceLanguage(event.target.value)} className="min-h-[48px] rounded-xl border border-slate-600 bg-slate-900 px-3 text-sm text-white">
                  <option value="en-IN">English</option>
                  <option value="hi-IN">Hindi</option>
                </select>
                <button type="button" onClick={readDraftAloud} className="apple-press min-h-[48px] rounded-xl border border-emerald-300 bg-emerald-300/10 px-3 text-sm font-bold text-emerald-100">Read back aloud</button>
                <button type="button" onClick={handleDocumentHelper} className="apple-press min-h-[48px] rounded-xl border border-sky-300 bg-sky-300/10 px-3 text-sm font-bold text-sky-100">Optimize document</button>
              </div>
              <p className="mt-3 text-sm text-slate-300">{documentStatus}</p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Government response simplifier</p>
              <button type="button" onClick={simplifyGovernmentResponse} className="apple-press mt-3 min-h-[52px] rounded-xl border border-amber-300 bg-amber-300/10 px-3 text-sm font-bold text-amber-100">Explain in Simple Terms</button>
              {responseSimplified && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-200"><li>{responseSimplified.split("\n")[0]}</li><li>{responseSimplified.split("\n")[1]}</li></ul>}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Resolution quality verification</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["solved", "partial", "unsolved"] as const).map((option) => (
                  <button key={option} type="button" onClick={() => handleResolutionAudit(option)} className={`apple-press min-h-[48px] rounded-xl border px-3 text-sm font-bold ${closureAudit === option ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-slate-600 bg-slate-800 text-slate-200"}`}>
                    {option === "solved" ? "Yes, Solved" : option === "partial" ? "Partially Solved" : "Not Solved"}
                  </button>
                ))}
              </div>
              {closureAudit !== "pending" && (
                <p className="mt-3 text-sm text-emerald-300">✓ Quality audit recorded for {result.registrationId}</p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Duplicate grievance clustering</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {mockClusterData.map((cluster, idx) => (
                  <li key={idx} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    {cluster.clusterName} cluster — {cluster.complaintCount} complaints in {cluster.location} ({cluster.status})
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Department accountability dashboard</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {(() => {
                  const metrics = generateMockAccountabilityMetrics(result.department);
                  return (
                    <>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-400">Avg. resolution</p><p className="mt-2 text-2xl font-extrabold text-white">{metrics.avgResolutionDays} days</p></div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-400">Overdue</p><p className="mt-2 text-2xl font-extrabold text-amber-200">{metrics.overdueCount}</p></div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-400">Citizen dissatisfaction</p><p className="mt-2 text-2xl font-extrabold text-red-300">{metrics.dissatisfactionRate}%</p></div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-emerald-200">Ready for registration</p>
                <p className="mt-1 text-sm text-slate-200">Review the memo, then create a demo registration number for this browser.</p>
              </div>
              <button
                type="button"
                onClick={registerGrievance}
                disabled={isSubmitted}
                className="apple-press inline-flex min-h-[60px] shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-extrabold text-slate-950 disabled:cursor-default disabled:bg-emerald-300/50"
              >
                {isSubmitted ? <Check className="h-5 w-5" aria-hidden="true" /> : <ShieldCheck className="h-5 w-5" aria-hidden="true" />}
                {isSubmitted ? "Registered" : "Register grievance"}
              </button>
            </div>

            {isSubmitted && (
              <div className="mt-4 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4" role="status">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Demo registration created</p>
                <p className="mt-1 text-2xl font-extrabold tracking-[0.08em] text-white">{result.registrationId}</p>
                <p className="mt-2 text-sm text-slate-200">Save this number to check your grievance status below.</p>
              </div>
            )}
          </motion.section>
        )}
        </AnimatePresence>

        <section className="mt-14 border-t border-white/10 pt-10" aria-labelledby="track-heading">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-1 h-6 w-6 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <h2 id="track-heading" className="apple-display text-2xl font-extrabold text-white sm:text-3xl">Track your grievance</h2>
              <p className="mt-2 text-base text-slate-300">Enter a registration number created in this demo portal.</p>
            </div>
          </div>
          <form onSubmit={trackGrievance} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="tracking-id" className="sr-only">Registration number</label>
            <input
              id="tracking-id"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value.toUpperCase())}
              placeholder="Example: JAW-2026-123456"
              className="min-h-[60px] min-w-0 flex-1 rounded-xl border-2 border-slate-600 bg-slate-900 px-4 text-base font-bold tracking-wide text-white placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <button type="submit" className="apple-press inline-flex min-h-[60px] items-center justify-center gap-2 rounded-xl border border-amber-300 bg-transparent px-5 py-3 text-base font-extrabold text-amber-200 hover:bg-amber-300/10">
              <Search className="h-5 w-5" aria-hidden="true" />
              Check status
            </button>
          </form>

          {trackedGrievance && (
            <div className="apple-glass mt-6 rounded-2xl p-5" role="status">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-emerald-300">Registration found</p>
                  <h3 className="mt-1 text-xl font-extrabold text-white">{trackedGrievance.result.registrationId}</h3>
                </div>
                <span className="rounded-full bg-amber-400 px-3 py-1.5 text-sm font-extrabold text-slate-950">Under examination</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-200">{trackedGrievance.summary}</p>
              <ol className="mt-5 grid gap-3 sm:grid-cols-4">
                <li className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-200">1. Submitted<br /><span className="font-normal text-slate-300">Registration received</span></li>
                <li className="rounded-lg border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm font-bold text-emerald-200">2. Forwarded<br /><span className="font-normal text-slate-300">Nodal officer assigned</span></li>
                <li className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-3 text-sm font-bold text-amber-200">3. Investigation<br /><span className="font-normal text-slate-300">Currently in progress</span></li>
                <li className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-bold text-slate-400">4. Resolution<br /><span className="font-normal text-slate-500">Expected within {trackedGrievance.result.statutory_days} days</span></li>
              </ol>
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-200">Appellate escalation ladder</p>
                <ol className="mt-3 grid gap-2 text-sm text-slate-200 sm:grid-cols-3">
                  <li className="rounded-lg border border-white/10 bg-white/[0.04] p-3"><span className="font-bold text-white">1. Nodal Officer</span><br /><span className="text-slate-400">First review and action</span></li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.04] p-3"><span className="font-bold text-white">2. First Appellate Authority</span><br /><span className="text-slate-400">Appeal if unresolved</span></li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.04] p-3"><span className="font-bold text-white">3. DARPG Central Cell</span><br /><span className="text-slate-400">Central escalation path</span></li>
                </ol>
              </div>
            </div>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-400"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Demo records are stored only in this browser.</p>
          <button type="button" onClick={resetGrievance} className="apple-press mt-5 inline-flex min-h-[60px] items-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-white/10">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Start a new grievance
          </button>
        </section>
      </div>
    </section>
    </MotionConfig>
  );
}
