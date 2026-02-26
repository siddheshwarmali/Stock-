
'use client';

import React from 'react';
import type { SetupResult } from '@/lib/types';

function scoreClass(score: number) {
  if (score >= 70) return 'good';
  if (score >= 45) return 'warn';
  return 'bad';
}

export default function Scanner({
  results,
  onPick,
  picked,
}: {
  results: SetupResult[];
  onPick: (s: string) => void;
  picked: string;
}) {
  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Watchlist Scan</div>
          <div className="small">Higher score = stronger setup by the rule-based engine.</div>
        </div>
        <span className="badge">0–100</span>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Score</th>
            <th>Last</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.symbol} style={{ cursor: 'pointer', background: r.symbol === picked ? 'rgba(78,161,255,.10)' : 'transparent' }} onClick={() => onPick(r.symbol)}>
              <td style={{ fontWeight: 800 }}>{r.symbol}</td>
              <td className={`score ${scoreClass(r.score)}`}>{r.score}</td>
              <td>{r.last.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 10 }} className="small">
        Tip: click any row to load its chart.
      </div>
    </div>
  );
}
