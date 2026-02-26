
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import type { Candle } from '@/lib/types';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
} from 'lightweight-charts';

type Props = {
  symbol: string;
  candles: Candle[];
  ema9?: number[];
  ema21?: number[];
  ema50?: number[];
  height?: number;
};

function toLwcCandle(c: Candle) {
  return {
    time: c.time as any,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  };
}

export default function Chart({ symbol, candles, ema9, ema21, ema50, height = 540 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const ema9Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema21Ref = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50Ref = useRef<ISeriesApi<'Line'> | null>(null);

  const lwcCandles = useMemo(() => candles.map(toLwcCandle), [candles]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#e6edf7',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,.06)' },
        horzLines: { color: 'rgba(255,255,255,.06)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,.12)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,.12)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: 'rgba(78,161,255,.45)' },
        horzLine: { color: 'rgba(78,161,255,.45)' },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#31d0aa',
      downColor: '#ff5b6e',
      wickUpColor: '#31d0aa',
      wickDownColor: '#ff5b6e',
      borderVisible: false,
    });

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: 'rgba(155,176,207,.55)',
    });

    volSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const e9 = chart.addSeries(LineSeries, { color: 'rgba(78,161,255,.95)', lineWidth: 2 });
    const e21 = chart.addSeries(LineSeries, { color: 'rgba(255,204,102,.95)', lineWidth: 2 });
    const e50 = chart.addSeries(LineSeries, { color: 'rgba(179,143,255,.95)', lineWidth: 2 });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volSeriesRef.current = volSeries;
    ema9Ref.current = e9;
    ema21Ref.current = e21;
    ema50Ref.current = e50;

    const resize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
      chartRef.current = null;
    };
  }, [height]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volSeriesRef.current) return;

    candleSeriesRef.current.setData(lwcCandles);

    const vols = candles.map(c => ({
      time: c.time as any,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(49,208,170,.45)' : 'rgba(255,91,110,.45)',
    }));
    volSeriesRef.current.setData(vols as any);

    // move to latest
    chartRef.current?.timeScale().fitContent();
  }, [lwcCandles, candles]);

  useEffect(() => {
    const applyLine = (ref: React.MutableRefObject<any>, values?: number[]) => {
      if (!ref.current || !values || values.length !== candles.length) return;
      const data = candles.map((c, i) => ({ time: c.time as any, value: values[i] }));
      ref.current.setData(data);
    };

    applyLine(ema9Ref, ema9);
    applyLine(ema21Ref, ema21);
    applyLine(ema50Ref, ema50);
  }, [candles, ema9, ema21, ema50]);

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{symbol} • Candles</div>
          <div className="small">Refresh updates the last candles; chart auto-fits.</div>
        </div>
        <div className="row">
          <span className="badge">EMA9</span>
          <span className="badge">EMA21</span>
          <span className="badge">EMA50</span>
          <span className="badge">Volume</span>
        </div>
      </div>
      <div className="chartWrap" ref={containerRef} />
    </div>
  );
}
