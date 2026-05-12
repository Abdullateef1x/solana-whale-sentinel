import React, { useState } from 'react'
import type { WhaleTransaction, WhaleWallet, Token } from '../types'
import WhaleFeed from './WhaleFeed'
import WalletScoreboard from './WalletScoreboard'
import PriceChart from './PriceChart'

interface Props {
  transactions: WhaleTransaction[]
  wallets: WhaleWallet[]
  tokens: Token[]
}

export default function WhalesPanel({ transactions, wallets, tokens }: Props) {
  const [tab, setTab] = useState<'flow' | 'wallets' | 'chart'>('flow')
  const solToken = tokens.find(t => t.symbol === 'SOL')

  // Volume stats by token
  const tokenVol = transactions.reduce((acc, tx) => {
    if (!acc[tx.tokenSymbol]) acc[tx.tokenSymbol] = { buy: 0, sell: 0, total: 0 }
    acc[tx.tokenSymbol].total += tx.amountUsd
    if (tx.type === 'buy') acc[tx.tokenSymbol].buy += tx.amountUsd
    else if (tx.type === 'sell') acc[tx.tokenSymbol].sell += tx.amountUsd
    return acc
  }, {} as Record<string, { buy: number; sell: number; total: number }>)

  const sortedVol = Object.entries(tokenVol).sort((a, b) => b[1].total - a[1].total).slice(0, 6)
  const maxVol = sortedVol[0]?.[1]?.total || 1

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs */}
      <div className="flex items-center gap-0 px-4 border-b border-terminal-border flex-none">
        {[
          { id: 'flow', label: 'WHALE FLOW' },
          { id: 'wallets', label: 'WALLET SCOREBOARD' },
          { id: 'chart', label: 'FLOW CHART' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 ${
              tab === t.id
                ? 'border-whale-blue text-whale-blue bg-whale-blue/5'
                : 'border-transparent text-whale-dim hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Whale flow overview stats */}
      {tab === 'flow' && (
        <div className="flex-none grid grid-cols-6 gap-0 border-b border-terminal-border divide-x divide-terminal-border">
          {sortedVol.map(([token, vol]) => {
            const ratio = vol.buy / Math.max(1, vol.buy + vol.sell)
            return (
              <div key={token} className="px-3 py-2">
                <div className="text-white font-mono font-bold text-xs">{token}</div>
                <div className="text-xs font-mono mt-1 text-whale-dim">
                  Vol: ${(vol.total / 1e6).toFixed(1)}M
                </div>
                <div className="flex h-1 mt-1.5 rounded overflow-hidden bg-terminal-border">
                  <div className="bg-whale-green h-full" style={{ width: `${ratio * 100}%` }} />
                  <div className="bg-whale-red h-full flex-1" />
                </div>
                <div className={`text-xs font-mono mt-0.5 ${ratio > 0.5 ? 'text-whale-green' : 'text-whale-red'}`}>
                  {ratio > 0.5 ? `${(ratio * 100).toFixed(0)}% BUY` : `${((1 - ratio) * 100).toFixed(0)}% SELL`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'flow' && <WhaleFeed transactions={transactions} />}
        {tab === 'wallets' && <WalletScoreboard wallets={wallets} />}
        {tab === 'chart' && (
          <div className="h-full p-2">
            <PriceChart symbol="SOL" basePrice={solToken?.price || 158} height={400} />
          </div>
        )}
      </div>
    </div>
  )
}
