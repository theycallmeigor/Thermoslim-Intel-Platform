import { NextResponse } from 'next/server';
import { runHealthChecks } from '@/core/qa/health-check';

/**
 * POST /api/qa/health — Manually trigger data health checks
 */
export async function POST() {
  try {
    const result = await runHealthChecks();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Health check failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
