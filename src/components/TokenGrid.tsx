import React, { useState } from 'react'
import type { Token } from '../types'

interface Props {
  tokens: Token[]
  compact?: boolean
}

function formatLarge(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(2)}`
}

function Sparkline({ change }: { change: number }) {
  const up = change >= 0
  const points = Array.from({ length: 8 }, (_, i) => {
    const jitter = (Math.random() - 0.5) * 20
    const trend = (i / 7) * change * 3
    return 50 - trend + jitter
  })
  points[7] = up ? 15 : 75

  const path = points.map((y, i) => `${i === 0 ? 'M' : 'L'} ${(i / 7) * 60},${Math.max(5, Math.min(95, y))}`).join(' ')

  return (
    <svg width="60" height="24" viewBox="0 0 60 100" preserveAspectRatio="none" className="opacity-70">
      <path d={path} fill="none" stroke={up ? '#00d68f' : '#ff4757'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function TokenGrid({ tokens, compact }: Props) {
  const [sort, setSort] = useState<'price' | 'change' | 'volume' | 'mcap'>('volume')
  const [dir, setDir] = useState<'asc' | 'desc'>('desc')

  const sorted = [...tokens].sort((a, b) => {
    const va = sort === 'price' ? a.price : sort === 'change' ? a.priceChange24h : sort === 'volume' ? a.volume24h : a.marketCap
    const vb = sort === 'price' ? b.price : sort === 'change' ? b.priceChange24h : sort === 'volume' ? b.volume24h : b.marketCap
    return dir === 'desc' ? vb - va : va - vb
  })

  const toggleSort = (col: typeof sort) => {
    if (sort === col) setDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSort(col); setDir('desc') }
  }

  const SortBtn = ({ col, label }: { col: typeof sort; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`text-xs font-mono font-bold transition-colors ${sort === col ? 'text-whale-blue' : 'text-whale-dim hover:text-white'}`}
    >
      {label} {sort === col ? (dir === 'desc' ? '↓' : '↑') : ''}
    </button>
  )

  if (compact) {
    return (
      <div className="flex flex-col gap-0">
        {sorted.map(token => (
          <div key={token.address} className="flex items-center gap-2 px-3 py-1.5 border-b border-terminal-border hover:bg-terminal-accent/30 transition-colors">
            <span className="text-white font-mono font-bold text-xs w-12">{token.symbol}</span>
            <span className="text-white font-mono text-xs tabular-nums">
              ${token.price < 0.001 ? token.price.toExponential(2) : token.price < 1 ? token.price.toFixed(4) : token.price.toFixed(2)}
            </span>
            <span className={`text-xs font-mono ml-auto ${token.priceChange24h >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="grid grid-cols-6 gap-2 px-3 py-2 border-b border-terminal-border text-xs text-whale-dim bg-terminal-panel/50 flex-none">
        <div className="col-span-1 font-mono font-bold">TOKEN</div>
        <div className="col-span-1 text-right"><SortBtn col="price" label="PRICE" /></div>
        <div className="col-span-1 text-right"><SortBtn col="change" label="24H%" /></div>
        <div className="col-span-1 text-right"><SortBtn col="volume" label="VOLUME" /></div>
        <div className="col-span-1 text-right"><SortBtn col="mcap" label="MCAP" /></div>
        <div className="col-span-1 text-right font-mono">TREND</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map(token => (
          <div
            key={token.address}
            className="grid grid-cols-6 gap-2 px-3 py-2 border-b border-terminal-border hover:bg-terminal-accent/40 transition-colors cursor-pointer group"
          >
            <div className="col-span-1 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-terminal-border flex items-center justify-center text-xs font-bold text-whale-dim">
                {token.symbol.charAt(0)}
              </div>
              <div>
                <div className="text-white font-mono font-bold text-xs">{token.symbol}</div>
                <div className="text-whale-dim font-mono text-xs">{token.name}</div>
              </div>
            </div>

            <div className="col-span-1 text-right self-center">
              <div className="text-white font-mono text-xs tabular-nums">
                ${token.price < 0.001 ? token.price.toExponential(2) : token.price < 1 ? token.price.toFixed(5) : token.price.toFixed(2)}
              </div>
            </div>

            <div className="col-span-1 text-right self-center">
              <div className={`font-mono text-xs font-bold tabular-nums ${token.priceChange24h >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
              </div>
            </div>

            <div className="col-span-1 text-right self-center">
              <div className="text-whale-blue font-mono text-xs tabular-nums">{formatLarge(token.volume24h)}</div>
            </div>

            <div className="col-span-1 text-right self-center">
              <div className="text-whale-purple font-mono text-xs tabular-nums">{formatLarge(token.marketCap)}</div>
            </div>

            <div className="col-span-1 flex items-center justify-end">
              <Sparkline change={token.priceChange24h} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
