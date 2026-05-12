import React, { useState } from 'react'
import type { WhaleTransaction } from '../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  transactions: WhaleTransaction[]
  compact?: boolean
}

const IMPACT_COLORS: Record<string, string> = {
  extreme: 'text-whale-red border-whale-red/40 bg-whale-red/10',
  high: 'text-whale-orange border-whale-orange/40 bg-whale-orange/10',
  medium: 'text-whale-yellow border-whale-yellow/40 bg-whale-yellow/10',
  low: 'text-whale-dim border-terminal-border bg-transparent',
}

const TYPE_COLORS: Record<string, string> = {
  buy: 'text-whale-green bg-whale-green/15',
  sell: 'text-whale-red bg-whale-red/15',
  swap: 'text-whale-blue bg-whale-blue/15',
  transfer: 'text-whale-purple bg-whale-purple/15',
}

const CATEGORY_ICONS: Record<string, string> = {
  fund: '🏛',
  market_maker: '⚡',
  insider: '🔮',
  smart_money: '🧠',
  exchange: '🏦',
  unknown: '👤',
}

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function WhaleFeed({ transactions, compact }: Props) {
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell' | 'swap'>('all')
  const [minSize, setMinSize] = useState<'all' | '100k' | '500k' | '1m'>('all')

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false
    if (minSize === '100k' && tx.amountUsd < 100_000) return false
    if (minSize === '500k' && tx.amountUsd < 500_000) return false
    if (minSize === '1m' && tx.amountUsd < 1_000_000) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      {!compact && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border flex-none">
          <div className="flex items-center gap-1">
            {(['all', 'buy', 'sell', 'swap'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  filter === f ? 'bg-whale-blue/20 text-whale-blue' : 'text-whale-dim hover:text-white'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="h-3 w-px bg-terminal-border" />
          <div className="flex items-center gap-1">
            {([
              { key: 'all', label: 'ALL' },
              { key: '100k', label: '>100K' },
              { key: '500k', label: '>500K' },
              { key: '1m', label: '>$1M' },
            ] as const).map(opt => (
              <button
                key={opt.key}
                onClick={() => setMinSize(opt.key)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                  minSize === opt.key ? 'bg-whale-orange/20 text-whale-orange' : 'text-whale-dim hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto text-xs text-whale-dim font-mono">{filtered.length} txs</div>
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-whale-dim text-xs font-mono">
            No transactions match filter
          </div>
        )}
        {filtered.map(tx => (
          <div
            key={tx.id}
            className={`border-b border-terminal-border transition-all duration-500 ${
              tx.isNew ? 'animate-slide-in' : ''
            } ${tx.impact === 'extreme' ? 'bg-whale-red/5' : tx.impact === 'high' ? 'bg-whale-orange/5' : 'hover:bg-terminal-accent/30'}`}
          >
            <div className={`flex items-start gap-2 px-3 py-2 ${compact ? 'py-1.5' : 'py-2'}`}>
              {/* Impact bar */}
              <div className={`w-0.5 self-stretch rounded-full flex-none ${
                tx.impact === 'extreme' ? 'bg-whale-red' :
                tx.impact === 'high' ? 'bg-whale-orange' :
                tx.impact === 'medium' ? 'bg-whale-yellow' : 'bg-terminal-border'
              }`} />

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Type badge */}
                  <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${TYPE_COLORS[tx.type] || 'text-whale-dim bg-terminal-accent'}`}>
                    {tx.type.toUpperCase()}
                  </span>

                  {/* Token */}
                  <span className="text-white font-mono font-bold text-xs">{tx.tokenSymbol}</span>

                  {/* Amount USD */}
                  <span className={`font-mono font-bold text-xs ${
                    tx.amountUsd >= 1_000_000 ? 'text-whale-red' :
                    tx.amountUsd >= 500_000 ? 'text-whale-orange' :
                    tx.amountUsd >= 100_000 ? 'text-whale-yellow' : 'text-whale-dim'
                  }`}>
                    {formatUsd(tx.amountUsd)}
                  </span>

                  {tx.dex && (
                    <span className="text-whale-dim text-xs font-mono">via {tx.dex}</span>
                  )}

                  {tx.isNew && (
                    <span className="px-1 py-0.5 rounded bg-whale-green/20 text-whale-green text-xs font-mono font-bold animate-pulse">
                      NEW
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-0.5">
                  {/* Wallet */}
                  <span className="text-whale-blue text-xs font-mono">
                    {tx.walletLabel || tx.wallet}
                  </span>

                  {!compact && (
                    <>
                      <span className="text-whale-dim text-xs font-mono">
                        {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} {tx.tokenSymbol}
                      </span>
                      <span className="text-whale-dim text-xs font-mono">
                        @${tx.price < 0.01 ? tx.price.toExponential(2) : tx.price.toFixed(4)}
                      </span>
                    </>
                  )}

                  <span className="ml-auto text-whale-dim text-xs font-mono tabular-nums">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
