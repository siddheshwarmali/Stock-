
import type { Candle, Indicators } from '@/lib/types';
import { EMA, RSI, ATR } from 'technicalindicators';

export function computeIndicators(candles: Candle[]): Indicators {
  if (candles.length < 60) return {};

  const close = candles.map(c => c.close);
  const high = candles.map(c => c.high);
  const low  = candles.map(c => c.low);

  const ema9 = EMA.calculate({ period: 9, values: close }).at(-1);
  const ema21 = EMA.calculate({ period: 21, values: close }).at(-1);
  const ema50 = EMA.calculate({ period: 50, values: close }).at(-1);
  const rsi14 = RSI.calculate({ period: 14, values: close }).at(-1);
  const atr14 = ATR.calculate({ period: 14, high, low, close }).at(-1);

  return { ema9, ema21, ema50, rsi14, atr14 };
}
