
export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Indicators = {
  ema9?: number;
  ema21?: number;
  ema50?: number;
  rsi14?: number;
  atr14?: number;
};

export type SetupResult = {
  symbol: string;
  score: number;
  last: number;
  reasons: string[];
  indicators: Indicators;
};
