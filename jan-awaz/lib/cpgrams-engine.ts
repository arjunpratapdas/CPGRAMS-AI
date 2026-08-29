import taxonomyData from "./cpgrams-taxonomy.json";

type Urgency = "low" | "medium" | "high";

type TaxonomyEntry = {
  id: string;
  target_ministry: string;
  department: string;
  statutory_days: number;
  nodal_officer: string;
  keywords: string[];
  formal_template: string;
};

type Classification = {
  sub_category: string;
  target_ministry: string;
  department: string;
  statutory_days: number;
  nodal_officer: string;
  urgency: Urgency;
  grievance_memo: string;
};

export type EmployeeRole = "Nodal Officer" | "Regional Desk" | "First Appellate Authority" | "CPGRAMS Central Cell";

export type RouterQueue = "Immediate Review" | "Regional Desk" | "Central Review" | "Escalated Appeal";

export interface RouteDecision {
  route_id: string;
  ministry: string;
  department: string;
  desk: string;
  jurisdiction: string;
  nodal_officer: string;
  first_appellate_authority: string;
  escalation_path: string[];
  queue: RouterQueue;
  sla_days: number;
  evidence_required: string[];
  privacy_level: "standard" | "restricted";
  suitability: "routine" | "high-risk" | "appeal-ready";
}

export interface PrivacyAssessment {
  redaction_applied: boolean;
  pii_fields_redacted: string[];
  consent_status: "explicit" | "implicit" | "not-captured";
  retention_policy: string;
  data_minimization: string[];
}

export interface CpgramsSyncRecord {
  portal: string;
  mock_service: string;
  submission_channel: "web-form" | "voice-to-text" | "mobile" | "helpline";
  queue_id: string;
  status: "accepted" | "routed" | "under-review" | "escalated";
  last_sync: string;
  checksum: string;
}

export interface StatusTimelineEntry {
  stage: string;
  owner: EmployeeRole;
  status: "done" | "active" | "pending";
  note: string;
}

export interface GrievanceResult extends Classification {
  registrationId: string;
  triageSource: "openai" | "local-mock";
  dataMode: "synthetic-demo";
  /** Backward-compatible aliases used by the current form UI. */
  ministry: string;
  statutoryDays: number;
  petitionDraft: string;
  routing: RouteDecision;
  privacy: PrivacyAssessment;
  integration: CpgramsSyncRecord;
  statusTimeline: StatusTimelineEntry[];
}

const taxonomy = taxonomyData as TaxonomyEntry[];
const REDACTIONS = {
  aadhaar: "[Aadhaar Redacted]",
  pan: "[PAN Redacted]",
  phone: "[Phone Redacted]",
  email: "[Email Redacted]",
  account: "[Bank detail Redacted]",
  dob: "[Date of birth Redacted]",
} as const;

/**
 * Routes a grievance using ONLY local mock data.
 * All external API calls are permanently disabled for this demo.
 * This ensures deterministic, privacy-safe, and offline-capable operation.
 */
export async function processGrievance(
  userInput: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _apiKey?: string,
): Promise<GrievanceResult> {
  const registrationId = createRegistrationId();
  const redactedSummary = summariseAndRedact(userInput);

  // STRICTLY MOCK DATA ONLY - No real API calls are made
  // This demo intentionally runs only on synthetic/mock data.
  // Real-time AI or external service calls are permanently disabled to keep the experience safe,
  // deterministic, and compliant with the mock-only requirement.
  return toResult(classifyLocally(redactedSummary), registrationId, "local-mock");
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function classifyWithOpenAI(
  redactedSummary: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apiKey: string,
): Promise<Classification | null> {
  // PERMANENTLY DISABLED - This function is not used in the mock-only demo
  // All classification happens via classifyLocally() for deterministic behavior
  console.warn("OpenAI API is disabled - using local mock classification only");
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getOutputText(payload: {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
}): string | null {
  // PERMANENTLY DISABLED - This function is not used in the mock-only demo
  return null;
}

function classifyLocally(redactedSummary: string): Classification {
  const normalizedInput = redactedSummary.toLocaleLowerCase("en-IN");
  const scoredEntries = taxonomy.map((candidate) => ({ candidate, score: score(candidate, normalizedInput) }));
  const bestMatch = scoredEntries.reduce((best, current) => current.score > best.score ? current : best, scoredEntries[0]);
  if (!bestMatch || bestMatch.score === 0) {
    return {
      sub_category: "needs-review",
      target_ministry: "Needs citizen confirmation",
      department: "Jan-Awaz triage desk",
      statutory_days: 21,
      nodal_officer: "Citizen must confirm the responsible authority",
      urgency: determineUrgency(normalizedInput),
      grievance_memo: createReviewMemo(redactedSummary),
    };
  }

  const entry = bestMatch.candidate;

  return {
    sub_category: entry.id,
    target_ministry: entry.target_ministry,
    department: entry.department,
    statutory_days: entry.statutory_days,
    nodal_officer: entry.nodal_officer,
    urgency: determineUrgency(normalizedInput),
    grievance_memo: createLocalMemo(entry, redactedSummary),
  };
}

function createReviewMemo(redactedSummary: string): string {
  return `To,\nThe appropriate public authority\n\nSubject: Citizen grievance requiring department confirmation\n\nRespected Sir/Madam,\n\nI respectfully submit the following grievance for examination:\n${redactedSummary}\n\nPlease confirm the responsible department before submission.\n\nYours faithfully,\nCitizen\nDate: ${new Date().getFullYear()}`;
}

function score(entry: TaxonomyEntry, input: string): number {
  return entry.keywords.reduce((total, keyword) => {
    const normalizedKeyword = keyword.toLocaleLowerCase("en-IN");
    if (input.includes(normalizedKeyword)) return total + normalizedKeyword.length * 2;

    return (
      total +
      normalizedKeyword
        .split(/\s+/)
        .filter((word) => word.length > 2 && input.includes(word)).length
    );
  }, 0);
}

function determineUrgency(input: string): Urgency {
  if (
    /accident|unsafe|injury|danger|emergency|fraud|scam|urgent|stuck\s+passport|blocked\s+pension|unauthorized\s+debit|misappropriation|harassment|threat|폭행|दुर्घटना|खतरा|पासपोर्ट|पेंशन|अनधिकृत\s+डेबिट|अवांछित\s+डेबिट/.test(input)
  ) {
    return "high";
  }
  if (
    /delay(?:ed)?|not\s+(?:yet\s+)?(?:been\s+)?(?:received|delivered)|failed|issue|complaint|payment|refund|fee|duplicate|charge|denied|passport|pension|debit|bank|toll|postal|देरी|समस्या|भुगतान|रिफंड|शुल्क|दोबारा|चार्ज|बैंक|टोल|डाक/.test(input)
  ) {
    return "medium";
  }
  return "low";
}

function createLocalMemo(entry: TaxonomyEntry, redactedSummary: string): string {
  const year = new Date().getFullYear();
  const prayer =
    "I respectfully submit this representation under the citizen grievance redressal framework and pray that the competent authority may examine the facts, facilitate a prompt inquiry, and provide a written resolution within the statutory timeline prescribed under the applicable citizen charter and grievance redressal norms.";

  const charterNote =
    "As a citizen, I invoke the grievance redressal mechanism under the applicable public service charter and request that the matter be examined in a time-bound, transparent, and accountable manner.";

  const statementOfFacts =
    "The facts of the case are as follows: " +
    redactedSummary.trim() +
    " This grievance affects public service delivery and has remained unresolved despite reasonable attempts to seek redressal.";

  return [
    `To,`,
    `${entry.nodal_officer}`,
    `${entry.department}, ${entry.target_ministry}`,
    "",
    `Subject: Formal grievance petition for redressal and relief`,
    "",
    "Respected Sir/Madam,",
    "",
    "I, the undersigned citizen, respectfully submit this formal representation seeking expeditious redressal of the grievance detailed below.",
    "",
    "Statement of Facts:",
    statementOfFacts,
    "",
    "Citizen Charter / Administrative Consideration:",
    charterNote,
    "",
    "I request that the competent authority examine this grievance, initiate the necessary inquiry, and issue a reasoned response with clear follow-up action in line with the applicable grievance redressal framework.",
    "",
    "Prayer for Relief:",
    prayer,
    "",
    "I therefore request the intervention of the concerned nodal authority and a written update on the action taken, including the status of this complaint and the expected resolution path.",
    "",
    "Yours faithfully,",
    "Citizen",
    `Date: ${year}`,
  ].join("\n");
}

function toResult(
  classification: Classification,
  registrationId: string,
  triageSource: GrievanceResult["triageSource"],
): GrievanceResult {
  const routing = buildRouteDecision(classification);
  const privacy = buildPrivacyAssessment(classification.grievance_memo);
  const integration = buildCpgramsIntegration(classification, registrationId, triageSource);

  return {
    registrationId,
    triageSource,
    dataMode: "synthetic-demo",
    ...classification,
    ministry: classification.target_ministry,
    statutoryDays: classification.statutory_days,
    petitionDraft: classification.grievance_memo,
    routing,
    privacy,
    integration,
    statusTimeline: buildStatusTimeline(classification, routing),
  };
}

function buildRouteDecision(classification: Classification): RouteDecision {
  const office = classification.department;
  const ministry = classification.target_ministry;
  const queue: RouterQueue =
    classification.urgency === "high"
      ? "Immediate Review"
      : classification.urgency === "medium"
        ? "Regional Desk"
        : "Central Review";

  return {
    route_id: `ROUTE-${classification.sub_category.toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    ministry,
    department: office,
    desk: `${office} Grievance Desk`,
    jurisdiction: `${classification.target_ministry} / ${office}`,
    nodal_officer: classification.nodal_officer,
    first_appellate_authority: `${office} First Appellate Authority`,
    escalation_path: [
      classification.nodal_officer,
      `${office} First Appellate Authority`,
      "CPGRAMS Central Monitoring Cell",
    ],
    queue,
    sla_days: classification.statutory_days,
    evidence_required: [
      "Complaint summary",
      "Supporting documents if available",
      classification.urgency === "high" ? "Urgency note and incident evidence" : "Case correspondence log",
    ],
    privacy_level: classification.urgency === "high" ? "restricted" : "standard",
    suitability: classification.urgency === "high" ? "high-risk" : classification.urgency === "medium" ? "routine" : "routine",
  };
}

function buildPrivacyAssessment(grievanceMemo: string): PrivacyAssessment {
  const redactedFields = [
    "Aadhaar",
    "PAN",
    "phone number",
    "email address",
    "bank account",
    "date of birth",
  ];

  const matches = [
    /aadhaar|pan|phone|email|account|dob/i.test(grievanceMemo),
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(grievanceMemo),
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(grievanceMemo),
  ].filter(Boolean).length;

  return {
    redaction_applied: matches > 0,
    pii_fields_redacted: redactedFields.filter((field) => /aadhaar|pan|phone|email|account|dob/i.test(field) && matches > 0),
    consent_status: "explicit",
    retention_policy: "Auto-expire after 180 days unless escalated or under legal hold.",
    data_minimization: [
      "Only department-relevant complaint content is retained",
      "Personal identifiers are redacted before routing",
      "No non-essential metadata is shared with external authorities",
    ],
  };
}

function buildCpgramsIntegration(
  classification: Classification,
  registrationId: string,
  triageSource: GrievanceResult["triageSource"],
): CpgramsSyncRecord {
  const channel: CpgramsSyncRecord["submission_channel"] =
    /voice|speak|listen|mic/i.test(classification.grievance_memo) ? "voice-to-text" : "web-form";

  return {
    portal: "CPGRAMS Mock Integration",
    mock_service: triageSource === "openai" ? "AI-assisted CPGRAMS Desk" : "Deterministic CPGRAMS Triage",
    submission_channel: channel,
    queue_id: `${classification.target_ministry.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
    status: "accepted",
    last_sync: new Date().toISOString(),
    checksum: `${registrationId}-${classification.target_ministry.replace(/\s+/g, "-").toLowerCase()}`,
  };
}

function buildStatusTimeline(
  classification: Classification,
  routing: RouteDecision,
): StatusTimelineEntry[] {
  return [
    {
      stage: "Submitted",
      owner: "Nodal Officer",
      status: "done",
      note: `${routing.department} received the application via the public grievance intake flow.`,
    },
    {
      stage: "Routed",
      owner: "Regional Desk",
      status: classification.urgency === "high" ? "active" : "done",
      note: `${routing.desk} assigned to ${routing.ministry}.`,
    },
    {
      stage: "Review",
      owner: "Nodal Officer",
      status: classification.urgency === "high" ? "active" : "pending",
      note: `Case is being reviewed for statutory timeline of ${routing.sla_days} days.`,
    },
    {
      stage: "Appeal path",
      owner: "First Appellate Authority",
      status: "pending",
      note: `Escalation path: ${routing.escalation_path.join(" → ")}.`,
    },
  ];
}

/** Redacts common direct identifiers before data leaves the local process. */
export function redactSensitiveIdentifiers(input: string): string {
  return input
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTIONS.email)
    .replace(/(?:\+91[-\s]?)?[6-9]\d{9}\b/g, REDACTIONS.phone)
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, REDACTIONS.aadhaar)
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, REDACTIONS.pan)
    .replace(/\b(?:account|a\/c|bank account|card)\s*(?:number|no\.?|#)?\s*[:#-]?\s*\d{6,18}\b/gi, (match) =>
      match.replace(/\d{6,18}/, REDACTIONS.account),
    )
    .replace(/\b(?:dob|date of birth)\s*[:#-]?\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}\b/gi, (match) =>
      match.replace(/\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/, REDACTIONS.dob),
    );
}

function summariseAndRedact(input: string): string {
  const compact = redactSensitiveIdentifiers(input.trim().replace(/\s+/g, " "));
  if (!compact) return "No grievance details were provided.";
  return compact.slice(0, 2000);
}

function createRegistrationId(): string {
  const serial = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `CPGRAMS-${new Date().getFullYear()}-IN-${serial}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isClassification(value: unknown): value is Classification {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.target_ministry === "string" &&
    typeof candidate.sub_category === "string" &&
    typeof candidate.department === "string" &&
    typeof candidate.statutory_days === "number" &&
    typeof candidate.nodal_officer === "string" &&
    (candidate.urgency === "low" ||
      candidate.urgency === "medium" ||
      candidate.urgency === "high") &&
    typeof candidate.grievance_memo === "string"
  );
}
