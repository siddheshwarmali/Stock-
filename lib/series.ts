
import type { Candle } from '@/lib/types';
import { EMA } from 'technicalindicators';

export function emaSeries(candles: Candle[], period: number): number[] {
  const close = candles.map(c => c.close);
  const ema = EMA.calculate({ period, values: close });
  // EMA starts after (period-1) values; pad with NaN to align
  const pad = new Array(close.length - ema.length).fill(NaN);
  return [...pad, ...ema];
}
