import { NextResponse } from 'next/server';

export async function GET() {
  const username = process.env.CC_API_USERNAME || '';
  const key = process.env.CC_API_KEY || '';
  const url = process.env.CC_API_URL || '';
  const proxy = process.env.QUOTEGUARD_URL || '';

  return NextResponse.json({
    CC_API_URL: url ? url.substring(0, 20) + '...' : 'EMPTY',
    CC_API_USERNAME: username ? username.substring(0, 3) + '***' + ` (${username.length} chars)` : 'EMPTY',
    CC_API_KEY: key ? key.substring(0, 3) + '***' + ` (${key.length} chars)` : 'EMPTY',
    QUOTEGUARD_URL: proxy ? 'SET' : 'EMPTY',
  });
}
