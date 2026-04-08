import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/core/config';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch(
      'https://a.klaviyo.com/api/profiles?fields[profile]=email,properties&page[size]=3',
      {
        headers: {
          Authorization: `Klaviyo-API-Key ${config.klaviyo.apiKey}`,
          revision: '2024-10-15',
          Accept: 'application/json',
        },
      }
    );
    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json({ error: `HTTP ${res.status}: ${body.slice(0, 500)}` }, { status: 500 });
    }
    const json = await res.json();
    // Return just first 3 profiles with their properties
    const profiles = (json.data ?? []).map((p: { id: string; attributes: { email: string; properties: Record<string, unknown> } }) => ({
      id: p.id,
      email: p.attributes.email,
      loopProps: Object.fromEntries(
        Object.entries(p.attributes.properties ?? {}).filter(([k]) => k.startsWith('$loop') || k.startsWith('loop'))
      ),
      allPropKeys: Object.keys(p.attributes.properties ?? {}),
    }));
    return NextResponse.json({ count: json.data?.length, profiles });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown' }, { status: 500 });
  }
}
