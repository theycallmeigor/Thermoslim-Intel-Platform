import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/core/config';
import { CheckoutChampAdapter } from '@/adapters/checkoutchamp';

export async function POST(req: NextRequest) {
  // Verify shared secret — CC postback should include ?secret=CC_WEBHOOK_SECRET
  const secret = req.nextUrl.searchParams.get('secret');
  if (config.checkoutChamp.webhookSecret && secret !== config.checkoutChamp.webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // CC sends form-encoded or JSON depending on postback profile config
    const contentType = req.headers.get('content-type') ?? '';
    let payload: Record<string, string>;

    if (contentType.includes('application/json')) {
      payload = await req.json() as Record<string, string>;
    } else {
      const text = await req.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    }

    const adapter = new CheckoutChampAdapter();
    await adapter.handleWebhook(payload, { source: 'webhook' });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cc webhook] processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
