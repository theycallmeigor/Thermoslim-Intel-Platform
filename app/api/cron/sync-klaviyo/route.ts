import { NextRequest, NextResponse } from 'next/server';
import { syncKlaviyo } from '@/services/sync-klaviyo';

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncKlaviyo();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Klaviyo sync failed';
    console.error('[cron:sync-klaviyo] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
