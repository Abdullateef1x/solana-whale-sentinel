import React, { useState } from 'react'
import type { Signal } from '../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  signals: Signal[]
  compact?: boolean
}

const STRENGTH_CONFIG: Record<string, { color: string; bg: string; bars: number }> = {
  weak: { color: 'text-whale-dim', bg: 'bg-whale-dim', bars: 1 },
  moderate: { color: 'text-whale-yellow', bg: 'bg-whale-yellow', bars: 2 },
  strong: { color: 'text-whale-orange', bg: 'bg-whale-orange', bars: 3 },
  extreme: { color: 'text-whale-red', bg: 'bg-whale-red', bars: 4 },
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  accumulation: { icon: '▲', color: 'text-whale-green' },
  distribution: { icon: '▼', color: 'text-whale-red' },
  momentum: { icon: '→', color: 'text-whale-blue' },
  reversal: { icon: '↩', color: 'text-whale-purple' },
  breakout: { icon: '⚡', color: 'text-whale-yellow' },
  alert: { icon: '⚠', color: 'text-whale-orange' },
}

function StrengthBars({ strength }: { strength: string }) {
  const cfg = STRENGTH_CONFIG[strength] || STRENGTH_CONFIG.weak
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`w-1 rounded-sm transition-all ${i <= cfg.bars ? cfg.bg : 'bg-terminal-border'}`}
          style={{ height: `${4 + i * 2}px` }}
        />
      ))}
    </div>
  )
}

export default function SignalFeed({ signals, compact }: Props) {
  const [filter, setFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const types = ['all', 'accumulation', 'distribution', 'momentum', 'reversal', 'breakout', 'alert']
  const filtered = signals.filter(s => filter === 'all' || s.type === filter)

  return (
    <div className="flex flex-col h-full">
      {!compact && (
        <div className="flex items-center gap-1 px-3 py-2 border-b border-terminal-border flex-none overflow-x-auto">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap transition-colors ${
                filter === t ? 'bg-whale-purple/20 text-whale-purple' : 'text-whale-dim hover:text-white'
              }`}
            >
              {t === 'all' ? 'ALL' : t.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto text-xs text-whale-dim font-mono">{filtered.length} signals</div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {filtered.map(signal => {
          const typeConf = TYPE_CONFIG[signal.type] || TYPE_CONFIG.alert
          const strConf = STRENGTH_CONFIG[signal.strength] || STRENGTH_CONFIG.weak
          const isExpanded = expanded === signal.id

          return (
            <div
              key={signal.id}
              className={`border-b border-terminal-border cursor-pointer transition-all ${
                signal.isNew ? 'animate-slide-in' : ''
              } ${isExpanded ? 'bg-terminal-accent' : 'hover:bg-terminal-accent/40'}`}
              onClick={() => setExpanded(isExpanded ? null : signal.id)}
            >
              <div className={`px-3 ${compact ? 'py-1.5' : 'py-2'}`}>
                <div className="flex items-center gap-2">
                  {/* Type icon */}
                  <span className={`text-sm font-bold ${typeConf.color}`}>{typeConf.icon}</span>

                  {/* Token */}
                  <span className="text-white font-mono font-bold text-xs w-12">{signal.token}</span>

                  {/* Signal type */}
                  <span className={`text-xs font-mono font-bold ${strConf.color}`}>
                    {signal.type.toUpperCase()}
                  </span>

                  {/* Strength bars */}
                  <StrengthBars strength={signal.strength} />

                  {/* Confidence */}
                  <div className="flex items-center gap-1 ml-1">
                    <div className="w-16 h-1 bg-terminal-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          signal.confidence >= 80 ? 'bg-whale-green' :
                          signal.confidence >= 65 ? 'bg-whale-yellow' : 'bg-whale-dim'
                        }`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-whale-dim">{signal.confidence}%</span>
                  </div>

                  {signal.isNew && (
                    <span className="px-1 py-0.5 rounded bg-whale-yellow/20 text-whale-yellow text-xs font-mono font-bold animate-pulse">
                      NEW
                    </span>
                  )}

                  <span className="ml-auto text-xs text-whale-dim font-mono">
                    {signal.timeframe} · {formatDistanceToNow(signal.timestamp, { addSuffix: true })}
                  </span>
                </div>

                {!compact && (
                  <p className={`text-xs font-mono mt-1 leading-relaxed ${strConf.color} opacity-90`}>
                    {signal.message}
                  </p>
                )}

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-terminal-border grid grid-cols-3 gap-3 animate-fade-in">
                    <div>
                      <div className="text-xs text-whale-dim font-mono">ENTRY PRICE</div>
                      <div className="text-xs text-white font-mono font-bold mt-0.5">
                        ${signal.price < 0.01 ? signal.price.toExponential(3) : signal.price.toFixed(4)}
                      </div>
                    </div>
                    {signal.targetPrice && (
                      <div>
                        <div className="text-xs text-whale-dim font-mono">TARGET</div>
                        <div className="text-xs text-whale-green font-mono font-bold mt-0.5">
                          ${signal.targetPrice < 0.01 ? signal.targetPrice.toExponential(3) : signal.targetPrice.toFixed(4)}
                          <span className="text-whale-green/70 ml-1">
                            (+{(((signal.targetPrice - signal.price) / signal.price) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                    {signal.stopLoss && (
                      <div>
                        <div className="text-xs text-whale-dim font-mono">STOP LOSS</div>
                        <div className="text-xs text-whale-red font-mono font-bold mt-0.5">
                          ${signal.stopLoss < 0.01 ? signal.stopLoss.toExponential(3) : signal.stopLoss.toFixed(4)}
                          <span className="text-whale-red/70 ml-1">
                            ({(((signal.stopLoss - signal.price) / signal.price) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
