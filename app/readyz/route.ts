import { NextResponse } from 'next/server';

export async function GET() {
  // Readiness check: returns ready status
  const hasDbConfig = Boolean(process.env.DATABASE_URL);

  return NextResponse.json({
    status: 'ready',
    database_configured: hasDbConfig,
    timestamp: new Date().toISOString(),
  });
}
