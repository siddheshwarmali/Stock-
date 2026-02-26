
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchIntradayCandles } from '@/lib/providers/alphavantage';
import { scoreSetup } from '@/lib/scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  symbols: z.array(z.string()).min(1).max(25),
  interval: z.enum(['1min','5min','15min','30min','60min']).default('5min')
});

export async function POST(req: Request) {
  const apiKey = process.env.ALPHAVANTAGE_API_KEY;

  const body = Body.parse(await req.json());
  const symbols = body.symbols.map(s => s.trim().toUpperCase()).filter(Boolean);

  // Alpha Vantage rate limits are strict. We scan sequentially to reduce bursts.
  const results = [];
  for (const s of symbols) {
    const candles = await fetchIntradayCandles(s, body.interval, apiKey);
    results.push(scoreSetup(s, candles));
  }

  results.sort((a,b) => b.score - a.score);
  return NextResponse.json({
    interval: body.interval,
    source: apiKey ? 'alphavantage' : 'demo',
    results
  });
}
