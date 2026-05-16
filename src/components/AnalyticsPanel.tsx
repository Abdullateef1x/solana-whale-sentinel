import React, { useMemo } from 'react'
import type { BacktestResult, Signal } from '../types'

interface Props {
  backtestResults: BacktestResult[]
  signals: Signal[]
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-terminal-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-whale-dim text-xs font-mono">
      {label}
    </div>
  )
}

export default function AnalyticsPanel({ backtestResults, signals }: Props) {
  const stats = useMemo(() => {
    const total  = backtestResults.length
    const wins   = backtestResults.filter(r => r.outcome === 'win')
    const losses = backtestResults.filter(r => r.outcome === 'loss')

    const avgWin  = wins.length
      ? wins.reduce((a, r) => a + r.pnlPct, 0) / wins.length
      : 0
    const avgLoss = losses.length
      ? losses.reduce((a, r) => a + r.pnlPct, 0) / losses.length
      : 0

    const winRate   = total ? wins.length / total : 0
    const expectancy = winRate * avgWin + (1 - winRate) * avgLoss

    // ── Token performance ──────────────────────────────────────────
    const tokenMap = new Map<string, { wins: number; losses: number; pnl: number }>()
    backtestResults.forEach(r => {
      if (!tokenMap.has(r.token)) tokenMap.set(r.token, { wins: 0, losses: 0, pnl: 0 })
      const t = tokenMap.get(r.token)!
      if (r.outcome === 'win') t.wins++; else t.losses++
      t.pnl += r.pnlPct
    })
    const tokenPerf = Array.from(tokenMap.entries())
      .map(([token, d]) => ({
        token,
        ...d,
        winRate: (d.wins + d.losses) > 0 ? d.wins / (d.wins + d.losses) : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl)

    // ── Signal type effectiveness ──────────────────────────────────
    // "High confidence" threshold is 70 — keeps the same semantics as
    // the original but derived from the live signals array.
    const HIGH_CONF = 70
    const typeMap = new Map<string, { count: number; wins: number }>()
    signals.forEach(s => {
      if (!typeMap.has(s.type)) typeMap.set(s.type, { count: 0, wins: 0 })
      const t = typeMap.get(s.type)!
      t.count++
      if (s.confidence >= HIGH_CONF) t.wins++
    })
    const typePerf = Array.from(typeMap.entries())
      .map(([type, d]) => ({ type, ...d, rate: d.count > 0 ? d.wins / d.count : 0 }))
      .sort((a, b) => b.rate - a.rate)

    // ── PnL distribution buckets ───────────────────────────────────
    type BucketKey = 'Loss >20%' | 'Loss 10-20%' | 'Loss 0-10%' | 'Win 0-10%' | 'Win 10-20%' | 'Win >20%'
    const pnlBuckets: Record<BucketKey, number> = {
      'Loss >20%': 0, 'Loss 10-20%': 0, 'Loss 0-10%': 0,
      'Win 0-10%': 0, 'Win 10-20%': 0, 'Win >20%':   0,
    }
    backtestResults.forEach(r => {
      if      (r.pnlPct < -20) pnlBuckets['Loss >20%']++
      else if (r.pnlPct < -10) pnlBuckets['Loss 10-20%']++
      else if (r.pnlPct <   0) pnlBuckets['Loss 0-10%']++
      else if (r.pnlPct <  10) pnlBuckets['Win 0-10%']++
      else if (r.pnlPct <  20) pnlBuckets['Win 10-20%']++
      else                     pnlBuckets['Win >20%']++
    })

    // Bucket bar scale: softer cap so small datasets still look readable
    const bucketMax = Math.max(...Object.values(pnlBuckets), 1)

    return {
      total, wins: wins.length, losses: losses.length,
      avgWin, avgLoss, winRate, expectancy,
      tokenPerf, typePerf, pnlBuckets, bucketMax,
    }
  }, [backtestResults, signals])

  const fmt = (n: number, d = 1) => (n >= 0 ? '+' : '') + n.toFixed(d) + '%'

  const hasResults = backtestResults.length > 0
  const hasSignals = signals.length > 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-6">

        {/* ── Summary KPIs ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">
            SIGNAL BACKTEST PERFORMANCE
            {hasResults && (
              <span className="ml-2 text-whale-blue normal-case font-normal">
                ({stats.total} signal{stats.total !== 1 ? 's' : ''})
              </span>
            )}
          </h2>

          {!hasResults ? (
            <Empty label="No backtest results yet — stream whale signals to populate." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: 'WIN RATE',
                  value: `${(stats.winRate * 100).toFixed(1)}%`,
                  color: stats.winRate >= 0.5 ? 'text-whale-green' : 'text-whale-red',
                },
                {
                  label: 'EXPECTANCY',
                  value: fmt(stats.expectancy),
                  color: stats.expectancy >= 0 ? 'text-whale-green' : 'text-whale-red',
                },
                {
                  label: 'AVG WIN',
                  value: fmt(stats.avgWin),
                  color: 'text-whale-green',
                },
                {
                  label: 'AVG LOSS',
                  value: fmt(stats.avgLoss),
                  color: 'text-whale-red',
                },
              ].map(kpi => (
                <div key={kpi.label} className="bg-terminal-panel border border-terminal-border rounded p-3">
                  <div className="text-whale-dim text-xs font-mono mb-1">{kpi.label}</div>
                  <div className={`text-xl font-mono font-bold ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Win / Loss distribution ───────────────────────────────── */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">
            WIN / LOSS DISTRIBUTION
          </h3>

          {!hasResults ? (
            <Empty label="Awaiting backtest data." />
          ) : (
            <div className="space-y-2">
              {(Object.entries(stats.pnlBuckets) as [string, number][]).map(([label, count]) => {
                const isWin = label.startsWith('Win')
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`text-xs font-mono w-28 ${isWin ? 'text-whale-green' : 'text-whale-red'}`}>
                      {label}
                    </span>
                    <div className="flex-1">
                      <Bar
                        value={count}
                        max={stats.bucketMax}
                        color={isWin ? 'bg-whale-green' : 'bg-whale-red'}
                      />
                    </div>
                    <span className="text-xs font-mono text-whale-dim w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Token performance ─────────────────────────────────────── */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">
            PERFORMANCE BY TOKEN
          </h3>

          {!hasResults ? (
            <Empty label="No token performance data yet." />
          ) : (
            <div className="space-y-2">
              {stats.tokenPerf.slice(0, 6).map(tp => {
                // Scale bar against the best absolute pnl so relative size is meaningful
                const maxPnl = Math.max(...stats.tokenPerf.map(t => Math.abs(t.pnl)), 1)
                return (
                  <div key={tp.token} className="flex items-center gap-3">
                    <span className="text-white font-mono text-xs font-bold w-16">{tp.token}</span>
                    <div className="flex-1">
                      <Bar
                        value={Math.abs(tp.pnl)}
                        max={maxPnl}
                        color={tp.pnl >= 0 ? 'bg-whale-green' : 'bg-whale-red'}
                      />
                    </div>
                    <span className={`text-xs font-mono w-16 text-right ${tp.pnl >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                      {fmt(tp.pnl)}
                    </span>
                    <span className="text-xs font-mono text-whale-blue w-16 text-right">
                      {(tp.winRate * 100).toFixed(0)}% WR
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Signal type effectiveness ─────────────────────────────── */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">
            SIGNAL TYPE EFFECTIVENESS
          </h3>

          {!hasSignals ? (
            <Empty label="No signals received yet." />
          ) : (
            <div className="space-y-2">
              {stats.typePerf.map(tp => (
                <div key={tp.type} className="flex items-center gap-3">
                  <span className="text-white font-mono text-xs w-24">{tp.type.toUpperCase()}</span>
                  <div className="flex-1">
                    <Bar value={tp.rate * 100} max={100} color="bg-whale-blue" />
                  </div>
                  <span className="text-xs font-mono text-whale-blue w-12 text-right">
                    {(tp.rate * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-mono text-whale-dim w-20 text-right">
                    {tp.count} signal{tp.count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Recent signal outcomes ────────────────────────────────── */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">
            RECENT SIGNAL OUTCOMES
          </h3>

          {!hasResults ? (
            <Empty label="Results will appear once signals complete." />
          ) : (
            <div className="border border-terminal-border rounded overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-terminal-panel border-b border-terminal-border text-xs text-whale-dim font-mono">
                <span>TOKEN</span>
                <span className="text-right">ENTRY</span>
                <span className="text-right">EXIT</span>
                <span className="text-right">PNL</span>
                <span className="text-right">DURATION</span>
              </div>
              {backtestResults.slice(0, 10).map(r => (
                <div
                  key={r.signalId}
                  className={`grid grid-cols-5 gap-2 px-3 py-1.5 border-b border-terminal-border text-xs font-mono transition-colors ${
                    r.outcome === 'win' ? 'hover:bg-whale-green/5' : 'hover:bg-whale-red/5'
                  }`}
                >
                  <span className="text-white font-bold">{r.token}</span>
                  <span className="text-whale-dim text-right">${r.entryPrice.toFixed(4)}</span>
                  <span className="text-whale-dim text-right">${r.exitPrice.toFixed(4)}</span>
                  <span className={`text-right font-bold ${r.outcome === 'win' ? 'text-whale-green' : 'text-whale-red'}`}>
                    {fmt(r.pnlPct)}
                  </span>
                  <span className="text-whale-dim text-right">{r.duration}h</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
