import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { CheckoutChampAdapter } from '@/adapters/checkoutchamp';

// CC sends thin GET postbacks: ?orderId=&dateCreated=&orderStatus=&emailAddress=&campaignId=
export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  console.log('[cc webhook] GET received:', JSON.stringify(params));

  if (!params.orderId) {
    return NextResponse.json({ ok: true });
  }

  // Synchronous log — always visible regardless of waitUntil behavior
  console.log('[cc webhook] received orderId:', params.orderId, 'email:', params.emailAddress);

  const adapter = new CheckoutChampAdapter();
  waitUntil(
    (async () => {
      try {
        await adapter.handleWebhook(params);
        console.log('[cc webhook] processing complete for orderId:', params.orderId);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error('[cc webhook] processing failed:', err.message, err.stack);
      }
    })()
  );

  return NextResponse.json({ ok: true });
}

// CC may also POST full order payloads — URL path acts as the shared secret
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    let payload: Record<string, string>;

    if (contentType.includes('application/json')) {
      payload = await req.json() as Record<string, string>;
    } else {
      const text = await req.text();
      payload = Object.fromEntries(new URLSearchParams(text));
    }

    console.log('[cc webhook] POST received keys:', Object.keys(payload).join(', '));

    const adapter = new CheckoutChampAdapter();
    await adapter.handleWebhook(payload);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cc webhook] POST processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
