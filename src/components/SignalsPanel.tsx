import React, { useState } from 'react'
import type { Signal, Token } from '../types'
import SignalFeed from './SignalFeed'
import PriceChart from './PriceChart'

interface Props {
  signals: Signal[]
  tokens: Token[]
}

export default function SignalsPanel({ signals, tokens }: Props) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const selectedTokenData = tokens.find(t => t.symbol === selectedToken)

  // Signal performance stats
  const byStrength = signals.reduce((acc, s) => {
    if (!acc[s.strength]) acc[s.strength] = 0
    acc[s.strength]++
    return acc
  }, {} as Record<string, number>)

  const avgConfidence = signals.length
    ? (signals.reduce((a, s) => a + s.confidence, 0) / signals.length).toFixed(1)
    : '--'

  const highConfidence = signals.filter(s => s.confidence >= 75).length

  return (
    <div className="flex flex-col h-full">
      {/* Stats bar */}
      <div className="flex-none grid grid-cols-4 border-b border-terminal-border divide-x divide-terminal-border">
        <div className="px-4 py-2">
          <div className="text-whale-dim text-xs font-mono">TOTAL SIGNALS</div>
          <div className="text-white font-mono font-bold text-lg">{signals.length}</div>
        </div>
        <div className="px-4 py-2">
          <div className="text-whale-dim text-xs font-mono">AVG CONFIDENCE</div>
          <div className="text-whale-blue font-mono font-bold text-lg">{avgConfidence}%</div>
        </div>
        <div className="px-4 py-2">
          <div className="text-whale-dim text-xs font-mono">HIGH CONFIDENCE (≥75%)</div>
          <div className="text-whale-green font-mono font-bold text-lg">{highConfidence}</div>
        </div>
        <div className="px-4 py-2">
          <div className="text-whale-dim text-xs font-mono">EXTREME SIGNALS</div>
          <div className="text-whale-red font-mono font-bold text-lg">{byStrength.extreme || 0}</div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Signal feed */}
        <div className={`flex flex-col ${selectedToken ? 'w-1/2' : 'w-full'} border-r border-terminal-border transition-all`}>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SignalFeed signals={signals} />
          </div>
        </div>

        {/* Chart for selected token */}
        {selectedToken && selectedTokenData && (
          <div className="flex-1 min-h-0 flex flex-col animate-fade-in">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-terminal-border">
              <span className="text-white font-mono font-bold text-xs">{selectedToken}/USD</span>
              <button
                onClick={() => setSelectedToken(null)}
                className="text-whale-dim hover:text-white text-sm transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <PriceChart symbol={selectedToken} basePrice={selectedTokenData.price} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
