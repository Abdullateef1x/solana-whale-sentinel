import React, { useState, useCallback } from 'react'
import type { WhaleWallet } from '../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  wallets: WhaleWallet[]
}

const CATEGORY_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  fund:         { label: 'FUND',    color: 'text-whale-purple', bg: 'bg-whale-purple/20' },
  market_maker: { label: 'MM',      color: 'text-whale-blue',   bg: 'bg-whale-blue/20'   },
  insider:      { label: 'INSIDER', color: 'text-whale-orange', bg: 'bg-whale-orange/20' },
  smart_money:  { label: 'SMART',   color: 'text-whale-green',  bg: 'bg-whale-green/20'  },
  exchange:     { label: 'CEX',     color: 'text-whale-cyan',   bg: 'bg-whale-cyan/20'   },
  unknown:      { label: '???',     color: 'text-whale-dim',    bg: 'bg-terminal-border'  },
}

function formatValue(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

/** Shorten a base58 address to "ABCD…WXYZ" format */
function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API unavailable (insecure context); silently skip
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      title="Copy address"
      className="ml-1 text-whale-dim hover:text-white transition-colors font-mono text-xs"
    >
      {copied ? '✓' : '⎘'}
    </button>
  )
}

export default function WalletScoreboard({ wallets }: Props) {
  const [sort,           setSort]           = useState<'pnl' | 'winRate' | 'value' | 'txCount'>('pnl')
  const [selectedWallet, setSelectedWallet] = useState<WhaleWallet | null>(null)

  const sorted = [...wallets].sort((a, b) => {
    switch (sort) {
      case 'pnl':     return b.pnl30d      - a.pnl30d
      case 'winRate': return b.winRate     - a.winRate
      case 'value':   return b.totalValue  - a.totalValue
      case 'txCount': return b.txCount30d  - a.txCount30d
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Sort tabs */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-terminal-border flex-none">
        <span className="text-whale-dim text-xs font-mono mr-2">SORT BY</span>
        {([
          { key: 'pnl',     label: '30D PNL'  },
          { key: 'winRate', label: 'WIN RATE' },
          { key: 'value',   label: 'AUM'      },
          { key: 'txCount', label: 'ACTIVITY' },
        ] as const).map(opt => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
              sort === opt.key
                ? 'bg-whale-green/20 text-whale-green'
                : 'text-whale-dim hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-whale-dim text-xs font-mono">
          No whale wallets tracked yet — stream signals to populate.
        </div>
      )}

      {/* Wallet list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((wallet, idx) => {
          const cat        = CATEGORY_STYLES[wallet.category] ?? CATEGORY_STYLES.unknown
          const isSelected = selectedWallet?.address === wallet.address

          return (
            <div key={wallet.address}>
              <div
                className={`flex items-center gap-3 px-3 py-2 border-b border-terminal-border cursor-pointer transition-colors ${
                  isSelected ? 'bg-terminal-accent' : 'hover:bg-terminal-accent/40'
                }`}
                onClick={() => setSelectedWallet(isSelected ? null : wallet)}
              >
                {/* Rank */}
                <span className="text-whale-dim font-mono text-xs w-4 text-right">{idx + 1}</span>

                {/* Category badge */}
                <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${cat.color} ${cat.bg} w-16 text-center`}>
                  {cat.label}
                </span>

                {/* Label + shortened address */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-mono text-xs font-bold truncate">{wallet.label}</div>
                  <div className="text-whale-dim font-mono text-xs">{shortenAddress(wallet.address)}</div>
                </div>

                {/* 30D PNL */}
                <div className="text-right">
                  <div className={`font-mono text-xs font-bold ${wallet.pnl30d >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                    {wallet.pnl30d >= 0 ? '+' : ''}{(wallet.pnl30d * 100).toFixed(1)}%
                  </div>
                  <div className="text-whale-dim font-mono text-xs">30D PNL</div>
                </div>

                {/* Win rate */}
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-whale-blue">
                    {(wallet.winRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-whale-dim font-mono text-xs">WIN RATE</div>
                </div>

                {/* AUM */}
                <div className="text-right">
                  <div className="font-mono text-xs text-whale-purple">{formatValue(wallet.totalValue)}</div>
                  <div className="text-whale-dim font-mono text-xs">AUM</div>
                </div>
              </div>

              {/* Expanded detail row */}
              {isSelected && (
                <div className="px-3 py-3 bg-terminal-accent border-b border-terminal-border animate-fade-in">
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-whale-dim text-xs font-mono">TX COUNT (30D)</div>
                      <div className="text-white font-mono text-sm font-bold mt-0.5">{wallet.txCount30d}</div>
                    </div>
                    <div>
                      <div className="text-whale-dim text-xs font-mono">LAST ACTIVE</div>
                      <div className="text-white font-mono text-xs mt-0.5">
                        {formatDistanceToNow(wallet.lastActive, { addSuffix: true })}
                      </div>
                    </div>
                    <div>
                      <div className="text-whale-dim text-xs font-mono">SPECIALIZATION</div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {wallet.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-1 py-0.5 rounded bg-terminal-hover text-whale-cyan text-xs font-mono"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-whale-dim text-xs font-mono mb-0.5">FULL ADDRESS</div>
                      <div className="flex items-center gap-1">
                        <span className="text-whale-blue font-mono text-xs">{shortenAddress(wallet.address, 8)}</span>
                        <CopyButton text={wallet.address} />
                        <a
                          href={`https://solscan.io/account/${wallet.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          title="View on Solscan"
                          className="text-whale-dim hover:text-whale-blue transition-colors text-xs font-mono ml-0.5"
                        >
                          ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Win rate bar */}
                  <div className="flex items-center gap-2">
                    <span className="text-whale-dim text-xs font-mono w-20">WIN RATE</span>
                    <div className="flex-1 h-2 bg-terminal-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-whale-red via-whale-yellow to-whale-green rounded-full transition-all duration-500"
                        style={{ width: `${wallet.winRate * 100}%` }}
                      />
                    </div>
                    <span className="text-whale-green font-mono text-xs">
                      {(wallet.winRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
