
import { NextResponse } from 'next/server';
import { fetchIntradayCandles } from '@/lib/providers/alphavantage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') || 'IBM').toUpperCase();
  const interval = (searchParams.get('interval') || process.env.NEXT_PUBLIC_DEFAULT_INTERVAL || '5min') as any;

  const apiKey = process.env.ALPHAVANTAGE_API_KEY;
  const candles = await fetchIntradayCandles(symbol, interval, apiKey);

  return NextResponse.json({
    symbol,
    interval,
    source: apiKey ? 'alphavantage' : 'demo',
    candles
  });
}

