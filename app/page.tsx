
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Chart from '@/components/Chart';
import Scanner from '@/components/Scanner';
import type { Candle, SetupResult } from '@/lib/types';
import { emaSeries } from '@/lib/series';

const defaultSymbols = (process.env.NEXT_PUBLIC_DEFAULT_SYMBOLS || 'IBM,MSFT,AAPL')
  .split(',')
  .map(s => s.trim().toUpperCase())
  .filter(Boolean);

const defaultInterval = (process.env.NEXT_PUBLIC_DEFAULT_INTERVAL || '5min');

export default function Page() {
  const [symbols, setSymbols] = useState(defaultSymbols.join(', '));
  const [interval, setIntervalValue] = useState(defaultInterval);
  const [refreshSec, setRefreshSec] = useState(15);
  const [picked, setPicked] = useState(defaultSymbols[0] || 'IBM');

  const [candles, setCandles] = useState<Candle[]>([]);
  const [scan, setScan] = useState<SetupResult[]>([]);
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const list = useMemo(() => symbols
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 25), [symbols]);

  async function runScan() {
    setLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: list, interval }),
      });
      const json = await res.json();
      setSource(json.source);
      setScan(json.results);
      if (!list.includes(picked) && list.length) setPicked(list[0]);
    } finally {
      setLoading(false);
    }
  }

  async function loadCandles(sym: string) {
    const u = new URL(window.location.origin + '/api/candles');
    u.searchParams.set('symbol', sym);
    u.searchParams.set('interval', interval);
    const res = await fetch(u.toString(), { cache: 'no-store' });
    const json = await res.json();
    setSource(json.source);
    setCandles(json.candles);
  }

  useEffect(() => { runScan(); }, []);
  useEffect(() => { loadCandles(picked); }, [picked, interval]);

  useEffect(() => {
    const id = window.setInterval(() => {
      runScan();
      loadCandles(picked);
    }, Math.max(5, refreshSec) * 1000);
    return () => window.clearInterval(id);
  }, [picked, interval, refreshSec]);

  const ema9 = useMemo(() => emaSeries(candles, 9), [candles]);
  const ema21 = useMemo(() => emaSeries(candles, 21), [candles]);
  const ema50 = useMemo(() => emaSeries(candles, 50), [candles]);

  return (
    <main className="container">
      <div className="header">
        <div>
          <div className="title">📈 Stock Analyzer (Vercel-ready)</div>
          <div className="small">Data source: <b>{source || '...'}</b> • Refresh: every <b>{refreshSec}s</b></div>
        </div>
        <div className="row">
          <button className="button secondary" onClick={runScan} disabled={loading}>{loading ? 'Scanning…' : 'Scan now'}</button>
          <button className="button" onClick={() => loadCandles(picked)}>Refresh chart</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          <input className="input" style={{ flex: 1, minWidth: 260 }} value={symbols} onChange={(e) => setSymbols(e.target.value)} placeholder="Symbols comma separated e.g. IBM,MSFT,AAPL" />

          <select value={interval} onChange={(e) => setIntervalValue(e.target.value)}>
            <option value="1min">1min</option>
            <option value="5min">5min</option>
            <option value="15min">15min</option>
            <option value="30min">30min</option>
            <option value="60min">60min</option>
          </select>

          <select value={refreshSec} onChange={(e) => setRefreshSec(Number(e.target.value))}>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>

          <button className="button" onClick={runScan}>Apply</button>
          <span className="badge">Max 25 symbols</span>
        </div>
        <div className="small" style={{ marginTop: 8 }}>Score is rule-based: Trend + Momentum + Volume + Breakout + Volatility sanity.</div>
      </div>

      <div className="grid">
        <div className="card">
          <Chart symbol={picked} candles={candles} ema9={ema9} ema21={ema21} ema50={ema50} />
          <div className="small" style={{ marginTop: 10 }}>⚠️ If you see <b>demo</b> source, add <code>ALPHAVANTAGE_API_KEY</code> in Vercel env vars.</div>
        </div>
        <div className="card">
          <Scanner results={scan} picked={picked} onPick={setPicked} />
          {scan.find(s => s.symbol === picked) ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Reasons</div>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {scan.find(s => s.symbol === picked)!.reasons.slice(0, 6).map((r, i) => (<li key={i}>{r}</li>))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="small" style={{ marginTop: 18, opacity: 0.9 }}>Built for Vercel: Next.js + API routes. For true tick-by-tick streaming you typically need a broker WebSocket backend.</div>
    </main>
  );
}
