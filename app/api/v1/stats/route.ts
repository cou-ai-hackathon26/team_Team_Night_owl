import { NextResponse } from 'next/server';

export async function GET() {
  // Spec 8.2: Return real aggregate counts only. Empty or zeros if no data. Never fabricate numbers.
  return NextResponse.json({
    total_analyses: 0,
    total_scams_detected: 0,
    total_reports_submitted: 0,
    top_threat_categories: [],
    last_updated: new Date().toISOString(),
  });
}
