
import { z } from 'zod';
import type { Candle } from '@/lib/types';

const AV_INTERVALS = ['1min','5min','15min','30min','60min'] as const;
export type AvInterval = (typeof AV_INTERVALS)[number];

const CandleZ = z.object({
  time: z.number(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume: z.number()
});

// Very small demo dataset (minute-ish candles)
export function demoCandles(): Candle[] {
  const now = Math.floor(Date.now() / 1000);
  const out: Candle[] = [];
  let price = 100;
  for (let i = 120; i >= 0; i--) {
    const t = now - i * 60;
    const drift = Math.sin(i/9) * 0.2;
    const noise = (Math.random() - 0.5) * 0.7;
    const open = price;
    const close = Math.max(1, price + drift + noise);
    const high = Math.max(open, close) + Math.random() * 0.4;
    const low = Math.min(open, close) - Math.random() * 0.4;
    const volume = Math.floor(900 + Math.random() * 600);
    out.push({ time: t, open, high, low, close, volume });
    price = close;
  }
  return out;
}

const cache = new Map<string, { ts: number; candles: Candle[] }>();

export async function fetchIntradayCandles(symbol: string, interval: AvInterval, apiKey?: string): Promise<Candle[]> {
  if (!apiKey) return demoCandles();

  const key = `${symbol}|${interval}`;
  const hit = cache.get(key);
  const now = Date.now();
  // Cache for 20 seconds to reduce API calls
  if (hit && (now - hit.ts) < 20_000) return hit.candles;

  const url = new URL('https://www.alphavantage.co/query');
  url.searchParams.set('function', 'TIME_SERIES_INTRADAY');
  url.searchParams.set('symbol', symbol);
  url.searchParams.set('interval', interval);
  url.searchParams.set('outputsize', 'compact');
  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  const json = await res.json();

  // Error or rate limit messages
  if (json['Error Message'] || json['Note']) {
    // Return demo candles so UI still works, and include the message in console.
    console.warn('Alpha Vantage response:', json['Error Message'] || json['Note']);
    return demoCandles();
  }

  const seriesKey = `Time Series (${interval})`;
  const series = json[seriesKey];
  if (!series) {
    return demoCandles();
  }

  const candles: Candle[] = Object.entries(series).map(([ts, v]: any) => {
    const t = Math.floor(new Date(ts).getTime() / 1000);
    return {
      time: t,
      open: Number(v['1. open']),
      high: Number(v['2. high']),
      low: Number(v['3. low']),
      close: Number(v['4. close']),
      volume: Number(v['5. volume'])
    };
  }).sort((a,b) => a.time - b.time);

  // Validate a couple of rows (light)
  for (const c of candles.slice(-5)) CandleZ.parse(c);

  cache.set(key, { ts: now, candles });
  return candles;
}
