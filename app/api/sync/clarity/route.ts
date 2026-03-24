import { NextResponse } from 'next/server';
import { ClarityAdapter } from '@/adapters/clarity';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const days = body.days ?? 1;

    const adapter = new ClarityAdapter();
    await adapter.connect();

    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 86400000);

    const result = await adapter.sync({ startDate, endDate });
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clarity sync failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
