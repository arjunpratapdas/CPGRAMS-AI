import { NextResponse } from "next/server";
import { processGrievance } from "../../../../../lib/cpgrams-engine";

/**
 * MOCK-ONLY API ENDPOINT
 * This endpoint ALWAYS uses local mock data classification.
 * No external API calls are made. All responses are deterministic and privacy-safe.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { grievance?: unknown };
    if (typeof body.grievance !== "string" || !body.grievance.trim()) {
      return NextResponse.json({ error: "A grievance is required." }, { status: 400 });
    }

    // STRICTLY MOCK DATA ONLY - processGrievance uses only local classification
    const result = await processGrievance(body.grievance);
    
    return NextResponse.json(result, {
      headers: { 
        "Cache-Control": "no-store",
        "X-Mock-Data": "true", // Explicitly mark as mock data response
        "X-Triage-Source": "local-mock"
      },
    });
  } catch (error) {
    console.error("Mock triage error:", error);
    return NextResponse.json({ error: "Unable to process grievance." }, { status: 500 });
  }
}