/**
 * Mock data utilities for Jan Awaz CPGRAMS demo
 * All functionality uses deterministic mock data - no real API calls
 */

export interface MockOTPResponse {
  success: boolean;
  message: string;
  otpSent: boolean;
  mockOtp: string;
}

export interface MockDocumentProcessing {
  status: string;
  fileName: string;
  processedAt: string;
  details: string;
}

export interface MockReminderResponse {
  success: boolean;
  reminderText: string;
  issuedAt: string;
}

export interface MockAppealDraft {
  subject: string;
  body: string;
  generatedAt: string;
}

export interface MockSimplifiedResponse {
  original: string;
  simplified: string[];
  explanationLevel: "basic" | "detailed";
}

/**
 * Generate a mock OTP for authentication flow
 */
export function generateMockOTP(mobileNumber: string): MockOTPResponse {
  // Generate deterministic 6-digit OTP based on phone number
  const hash = mobileNumber.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mockOtp = String((hash % 900000) + 100000).slice(0, 6);

  return {
    success: true,
    message: `Mock OTP sent to ${mobileNumber.slice(0, 4)}***${mobileNumber.slice(-3)}`,
    otpSent: true,
    mockOtp,
  };
}

/**
 * Verify mock OTP
 */
export function verifyMockOTP(mobileNumber: string, enteredOtp: string): boolean {
  const expected = generateMockOTP(mobileNumber);
  // Always accept "123456" as universal test OTP or the generated one
  return enteredOtp === expected.mockOtp || enteredOtp === "123456";
}

/**
 * Process mock document upload
 */
export function processMockDocument(fileName: string = "receipt.jpg"): MockDocumentProcessing {
  const processedFileName = fileName.replace(/\.[^.]+$/, ".pdf");
  
  return {
    status: "processed",
    fileName: `Application_${processedFileName}`,
    processedAt: new Date().toISOString(),
    details: `Processed: ${fileName} compressed to PDF-ready format, renamed to Application_${processedFileName}, and saved locally for mock review.`,
  };
}

/**
 * Generate mock reminder for grievance follow-up
 */
export function generateMockReminder(registrationId: string, daysElapsed: number = 15): MockReminderResponse {
  const reminderText = [
    `Reminder issued for registration ${registrationId}:`,
    `${daysElapsed} days have elapsed since submission.`,
    `Statutory timeline requires action within the prescribed SLA period.`,
    `A follow-up request has been generated and forwarded to the nodal officer.`,
    `Please expect a written update within 7 working days.`,
  ].join("\n");

  return {
    success: true,
    reminderText,
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Generate mock appeal draft based on reason
 */
export function generateMockAppeal(
  reason: string,
  registrationId: string,
  originalGrievance: string,
): MockAppealDraft {
  const reasonMap: Record<string, string> = {
    "No action taken": "no concrete action or follow-up has been initiated despite the passage of the statutory timeline",
    "Incorrect response": "the response provided does not address the factual or substantive issues raised in the original complaint",
    "Partially resolved": "only partial relief has been granted and the core grievance remains unresolved",
  };

  const reasonText = reasonMap[reason] || "the original response was unsatisfactory";

  const body = [
    "To,",
    "First Appellate Authority",
    "",
    "Subject: Appeal against disposal order for grievance redressal",
    "",
    `Registration ID: ${registrationId}`,
    "",
    "Respected Sir/Madam,",
    "",
    "I respectfully submit this appeal under the grievance redressal framework.",
    "",
    `Original Complaint Summary: ${originalGrievance.slice(0, 200)}${originalGrievance.length > 200 ? "..." : ""}`,
    "",
    `Reason for Appeal: ${reasonText}.`,
    "",
    "I request a fresh review by the appellate authority and a reasoned order with clear status update and corrective action within the prescribed appellate timeline.",
    "",
    "Prayer for Relief:",
    "I pray that the First Appellate Authority may examine the facts afresh, set aside or modify the original disposal order, and grant appropriate relief in accordance with the applicable citizen charter and grievance redressal norms.",
    "",
    "Yours faithfully,",
    "Citizen",
    `Date: ${new Date().toLocaleDateString("en-IN")}`,
  ].join("\n");

  return {
    subject: "Appeal against unsatisfactory grievance disposal",
    body,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Simplify government response into plain language
 */
export function simplifyGovernmentResponse(officialResponse?: string): MockSimplifiedResponse {
  const defaultResponse = "Your complaint has been received and is under review by the concerned nodal officer. You will receive a written update within the statutory timeline.";
  
  const original = officialResponse || defaultResponse;

  const simplified = [
    "1. Your complaint has been officially recorded in the system.",
    "2. A government officer has been assigned to review your case.",
    "3. You should receive an update within 21 days (3 weeks).",
    "4. Keep your complaint ID safe - you'll need it to check status.",
    "5. If you don't hear back within the timeline, you can send a reminder or file an appeal.",
  ];

  return {
    original,
    simplified,
    explanationLevel: "basic",
  };
}

/**
 * Generate mock tracking data for a grievance
 */
export function generateMockTrackingData(
  registrationId: string,
  daysElapsed: number = 5,
): {
  status: string;
  currentStage: string;
  progressPercentage: number;
  estimatedResolution: string;
  updates: Array<{ date: string; action: string; officer: string }>;
} {
  const stages = ["Submitted", "Forwarded", "Investigation", "Resolution"];
  const currentStageIndex = Math.min(Math.floor(daysElapsed / 7), 2);
  const currentStage = stages[currentStageIndex];

  return {
    status: "Under Review",
    currentStage,
    progressPercentage: ((currentStageIndex + 1) / stages.length) * 100,
    estimatedResolution: `${21 - daysElapsed} days remaining`,
    updates: [
      {
        date: new Date(Date.now() - daysElapsed * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
        action: "Complaint received and registration number issued",
        officer: "CPGRAMS Intake Desk",
      },
      {
        date: new Date(Date.now() - (daysElapsed - 2) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
        action: "Forwarded to nodal officer for examination",
        officer: "Regional Desk Officer",
      },
      ...(currentStageIndex >= 2
        ? [
            {
              date: new Date(Date.now() - (daysElapsed - 5) * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN"),
              action: "Under investigation - facts verification in progress",
              officer: "Nodal Officer",
            },
          ]
        : []),
    ],
  };
}

/**
 * Mock voice synthesis response (text-to-speech simulation)
 */
export function mockVoiceReadback(text: string, language: string = "en-IN"): {
  success: boolean;
  message: string;
  duration: number;
} {
  // Estimate reading time: ~150 words per minute
  const wordCount = text.split(/\s+/).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);

  return {
    success: true,
    message: `Voice readback initiated in ${language}. Playing audio simulation.`,
    duration: estimatedDuration,
  };
}

/**
 * Mock draft auto-save response
 */
export function mockDraftSave(draftContent: string): {
  success: boolean;
  savedAt: string;
  size: number;
} {
  return {
    success: true,
    savedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    size: new Blob([draftContent]).size,
  };
}

/**
 * Mock department accountability metrics
 */
export function generateMockAccountabilityMetrics(department: string) {
  return {
    department,
    avgResolutionDays: Math.floor(Math.random() * 10) + 12,
    overdueCount: Math.floor(Math.random() * 50) + 30,
    satisfactionRate: Math.floor(Math.random() * 15) + 85,
    dissatisfactionRate: Math.floor(Math.random() * 10) + 5,
    totalComplaints: Math.floor(Math.random() * 500) + 200,
  };
}

/**
 * Mock duplicate complaint clustering
 */
export function generateMockClusterData() {
  return [
    {
      clusterName: "Water supply outage",
      location: "District sector 6",
      complaintCount: Math.floor(Math.random() * 100) + 150,
      status: "Under mass investigation",
    },
    {
      clusterName: "Unpaid pension follow-up",
      location: "Regional pension office",
      complaintCount: Math.floor(Math.random() * 50) + 70,
      status: "Awaiting escalation",
    },
    {
      clusterName: "Road pothole maintenance",
      location: "National Highway 44 zone",
      complaintCount: Math.floor(Math.random() * 80) + 45,
      status: "Work order issued",
    },
  ];
}

/**
 * Mock technical support triage
 */
export function mockTechnicalTriage(issueType: "website" | "service"): {
  route: string;
  category: string;
  supportChannel: string;
  expectedResolution: string;
} {
  if (issueType === "website") {
    return {
      route: "Technical Support Flow",
      category: "Website/Portal Issue",
      supportChannel: "IT Helpdesk",
      expectedResolution: "Technical issues are typically resolved within 48-72 hours",
    };
  }

  return {
    route: "Government Service Complaint Flow",
    category: "Service Delivery Issue",
    supportChannel: "Nodal Officer Desk",
    expectedResolution: "Service complaints follow standard 21-day statutory timeline",
  };
}

/**
 * Mock quality verification audit
 */
export function mockResolutionAudit(
  registrationId: string,
  quality: "solved" | "partial" | "unsolved",
): {
  auditStatus: string;
  feedback: string;
  nextSteps: string[];
} {
  const feedbackMap = {
    solved: "Citizen has confirmed complete resolution. Case marked as successfully closed.",
    partial: "Citizen reports partial resolution. Additional follow-up required.",
    unsolved: "Citizen reports no resolution. Case flagged for appellate review.",
  };

  const nextStepsMap = {
    solved: ["Archive case after 30-day feedback period", "Update satisfaction metrics"],
    partial: ["Issue fresh reminder to nodal officer", "Schedule review meeting", "Extend monitoring period"],
    unsolved: [
      "Generate appeal draft automatically",
      "Forward to First Appellate Authority",
      "Flag for senior review",
      "Citizen notified of escalation path",
    ],
  };

  return {
    auditStatus: quality === "solved" ? "Closed - Satisfactory" : quality === "partial" ? "Open - Under Review" : "Open - Escalation Required",
    feedback: feedbackMap[quality],
    nextSteps: nextStepsMap[quality],
  };
}

/**
 * Mock share link generation
 */
export function generateMockShareLink(content: string): string {
  const token = encodeURIComponent(content.replace(/\s+/g, "-").slice(0, 32));
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jan-awaz.example.com";
  return `${baseUrl}/?draft=${token}`;
}

/**
 * Mock progressive onboarding flow
 */
export function mockProgressiveAuth(step: "phone" | "otp" | "details"): {
  currentStep: string;
  nextStep: string | null;
  message: string;
} {
  const flowMap = {
    phone: {
      currentStep: "Mobile Number Entry",
      nextStep: "OTP Verification",
      message: "Enter your mobile number to receive OTP",
    },
    otp: {
      currentStep: "OTP Verification",
      nextStep: "Additional Details",
      message: "Enter the 6-digit OTP sent to your mobile",
    },
    details: {
      currentStep: "Additional Details",
      nextStep: null,
      message: "Provide address only if required by the department",
    },
  };

  return flowMap[step];
}
