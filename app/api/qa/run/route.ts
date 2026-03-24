import { NextRequest, NextResponse } from 'next/server';
import { forceQARun } from '@/core/ingestion/post-hooks';

/**
 * POST /api/qa/run — Manually trigger QA analysis
 * Body: { days?: number, quick?: boolean }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { days?: number; quick?: boolean };
    const result = await forceQARun({
      days: body.days ?? 10,
      quick: body.quick ?? false,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'QA already running' }, { status: 409 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'QA run failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
