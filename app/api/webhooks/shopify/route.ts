import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { config } from '@/core/config';
import { ShopifyAdapter } from '@/adapters/shopify';

export async function POST(req: NextRequest) {
  const hmac = req.headers.get('x-shopify-hmac-sha256');
  const topic = req.headers.get('x-shopify-topic');
  const body = await req.text();

  // Verify webhook authenticity via HMAC-SHA256
  const computed = crypto
    .createHmac('sha256', config.shopify.apiSecret)
    .update(body, 'utf8')
    .digest('base64');

  let isValid = false;
  try {
    isValid = !!hmac && crypto.timingSafeEqual(
      Buffer.from(computed, 'base64'),
      Buffer.from(hmac, 'base64'),
    );
  } catch {
    // Malformed base64 or length mismatch — reject
    isValid = false;
  }
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = JSON.parse(body);
    const adapter = new ShopifyAdapter();
    await adapter.handleWebhook({ topic, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[shopify webhook] processing error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
