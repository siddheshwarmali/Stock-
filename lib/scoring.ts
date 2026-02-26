
import type { Candle, SetupResult } from '@/lib/types';
import { computeIndicators } from '@/lib/indicators';

export function scoreSetup(symbol: string, candles: Candle[]): SetupResult {
  if (candles.length < 60) {
    return {
      symbol,
      score: 0,
      last: candles.at(-1)?.close ?? 0,
      reasons: ['Not enough candles to score (need ~60+)'],
      indicators: {}
    };
  }

  const ind = computeIndicators(candles);
  const last = candles[candles.length - 1];

  let score = 0;
  const reasons: string[] = [];

  // Trend
  if (ind.ema50 !== undefined && last.close > ind.ema50) {
    score += 20; reasons.push('Price above EMA50 (trend positive)');
  }
  if (ind.ema9 !== undefined && ind.ema21 !== undefined && ind.ema9 > ind.ema21) {
    score += 15; reasons.push('EMA9 > EMA21 (short-term bullish)');
  }

  // Momentum
  if (ind.rsi14 !== undefined && ind.rsi14 > 50 && ind.rsi14 < 70) {
    score += 15; reasons.push('RSI in bullish zone (50–70)');
  }
  // Rising RSI (compare last 2 if possible)
  const rsiSeriesLen = candles.length;
  if (rsiSeriesLen > 20) {
    // crude rising check using close difference
    if (candles.at(-1)!.close > candles.at(-2)!.close) {
      score += 8; reasons.push('Last close higher than previous close');
    }
  }

  // Volume confirmation
  const vol = candles.map(c => c.volume);
  const vol20 = vol.slice(-20);
  const volMA = vol20.reduce((a,b)=>a+b,0) / Math.max(1, vol20.length);
  if (last.volume > 1.5 * volMA) {
    score += 20; reasons.push('Volume spike > 1.5× 20-bar average');
  }

  // Volatility sanity
  if (ind.atr14 !== undefined && (ind.atr14 / last.close) < 0.03) {
    score += 10; reasons.push('ATR% < 3% (controlled volatility)');
  }

  // Breakout check (20-bar high)
  const highs = candles.slice(-21, -1).map(c => c.high);
  const resistance = Math.max(...highs);
  if (last.close > resistance) {
    score += 12; reasons.push('Breakout above last 20-bar high');
  }

  return {
    symbol,
    score: Math.min(100, score),
    last: last.close,
    reasons,
    indicators: ind
  };
}
