import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/core/config';
import { CheckoutChampAdapter } from '@/adapters/checkoutchamp';

export async function POST(req: NextRequest) {
  // Secret is validated by the URL path itself — only CC knows this URL
  const urlSecret = 'ts-webhook-be8b18ec5ad97fe512d98255';
  if (urlSecret !== config.checkoutChamp.webhookSecret.trim()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';
    let payload: Record<string, string>;

    if (contentType.includes('application/json')) {
      payload = await req.json() as Record<string, string>;
    } else {
      const text = await req.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    }

    const adapter = new CheckoutChampAdapter();
    await adapter.handleWebhook(payload);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cc webhook] processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
