import React, { useMemo } from 'react'
import type { Token } from '../types'

interface Props {
  tokens: Token[]
  walletConnected: boolean
  walletAddress: string
  onConnect: () => void
}

function generatePortfolio(tokens: Token[]) {
  const holdings = tokens.slice(0, 4).map(token => {
    const amount = Math.random() * 1000 + 10
    const value = amount * token.price
    const costBasis = value * (1 + (Math.random() - 0.55) * 0.5)
    const pnl = value - costBasis
    const pnlPct = (pnl / costBasis) * 100
    return { token, amount, value, costBasis, pnl, pnlPct }
  })
  const totalValue = holdings.reduce((a, h) => a + h.value, 0)
  return holdings.map(h => ({ ...h, allocation: (h.value / totalValue) * 100 }))
}

const DEMO_TXS = [
  { type: 'buy', token: 'SOL', amount: 10, price: 142.5, date: '2025-04-15', status: 'confirmed' },
  { type: 'sell', token: 'JUP', amount: 500, price: 0.92, date: '2025-04-18', status: 'confirmed' },
  { type: 'swap', token: 'BONK→WIF', amount: 1_000_000, price: 0.0000245, date: '2025-05-01', status: 'confirmed' },
  { type: 'buy', token: 'RAY', amount: 200, price: 2.71, date: '2025-05-08', status: 'confirmed' },
]

function AllocationDonut({ holdings }: { holdings: ReturnType<typeof generatePortfolio> }) {
  const COLORS = ['#00d68f', '#0095ff', '#ff6b35', '#a855f7']
  let cumulative = 0

  const segments = holdings.map((h, i) => {
    const start = cumulative
    cumulative += h.allocation
    const startAngle = (start / 100) * 2 * Math.PI - Math.PI / 2
    const endAngle = (cumulative / 100) * 2 * Math.PI - Math.PI / 2
    const r = 40
    const cx = 50, cy = 50
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle)
    const y2 = cy + r * Math.sin(endAngle)
    const largeArc = h.allocation > 50 ? 1 : 0
    return (
      <path
        key={h.token.symbol}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={COLORS[i] || '#4b5563'}
        opacity={0.85}
      />
    )
  })

  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28">
      {segments}
      <circle cx="50" cy="50" r="25" fill="#0f1117" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">
        PORTFOLIO
      </text>
    </svg>
  )
}

export default function PortfolioPanel({ tokens, walletConnected, walletAddress, onConnect }: Props) {
  const portfolio = useMemo(() => generatePortfolio(tokens), [tokens.map(t => t.symbol).join()])

  if (!walletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-4xl opacity-20">🐋</div>
        <div className="text-whale-dim font-mono text-sm">Connect your Solflare wallet to view portfolio</div>
        <button
          onClick={onConnect}
          className="px-6 py-2 rounded border border-bloomberg-orange/50 text-bloomberg-orange bg-bloomberg-orange/10 hover:bg-bloomberg-orange/20 transition-colors font-mono text-sm"
        >
          CONNECT SOLFLARE WALLET
        </button>
        <p className="text-whale-dim/50 text-xs font-mono max-w-xs text-center">
          Solflare integration enables real-time portfolio tracking and one-click trade execution from signals.
        </p>
      </div>
    )
  }

  const totalValue = portfolio.reduce((a, h) => a + h.value, 0)
  const totalCost = portfolio.reduce((a, h) => a + h.costBasis, 0)
  const totalPnl = totalValue - totalCost
  const totalPnlPct = (totalPnl / totalCost) * 100

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Portfolio summary */}
        <div className="flex items-start gap-6">
          <AllocationDonut holdings={portfolio} />
          <div className="flex-1">
            <div className="text-whale-dim text-xs font-mono mb-1">TOTAL VALUE</div>
            <div className="text-white font-mono font-bold text-2xl">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-mono font-bold mt-1 ${totalPnl >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
              {totalPnl >= 0 ? '+' : ''}${Math.abs(totalPnl).toFixed(2)} ({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)
            </div>
            <div className="text-xs text-whale-dim font-mono mt-1">
              Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
            </div>
            <div className="text-xs text-whale-cyan font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-whale-green animate-pulse" />
              Solflare Connected
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">HOLDINGS</h3>
          <div className="border border-terminal-border rounded overflow-hidden">
            <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-terminal-panel border-b border-terminal-border text-xs text-whale-dim font-mono">
              <span className="col-span-2">TOKEN</span>
              <span className="text-right">PRICE</span>
              <span className="text-right">VALUE</span>
              <span className="text-right">PNL</span>
              <span className="text-right">ALLOC</span>
            </div>
            {portfolio.map((h, i) => {
              const COLORS = ['text-whale-green', 'text-whale-blue', 'text-whale-orange', 'text-whale-purple']
              return (
                <div key={h.token.symbol} className="grid grid-cols-6 gap-2 px-3 py-2 border-b border-terminal-border hover:bg-terminal-accent/40 transition-colors">
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${COLORS[i].replace('text-', 'bg-')}`} />
                    <div>
                      <div className="text-white font-mono text-xs font-bold">{h.token.symbol}</div>
                      <div className="text-whale-dim font-mono text-xs">{h.amount.toFixed(2)} tokens</div>
                    </div>
                  </div>
                  <div className="text-right self-center">
                    <div className="text-white font-mono text-xs tabular-nums">
                      ${h.token.price < 0.01 ? h.token.price.toExponential(2) : h.token.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right self-center">
                    <div className="text-white font-mono text-xs tabular-nums">${h.value.toFixed(2)}</div>
                  </div>
                  <div className="text-right self-center">
                    <div className={`font-mono text-xs tabular-nums font-bold ${h.pnl >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                      {h.pnl >= 0 ? '+' : ''}{h.pnlPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right self-center">
                    <div className="text-whale-dim font-mono text-xs">{h.allocation.toFixed(1)}%</div>
                    <div className="mt-1 h-1 bg-terminal-border rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${COLORS[i].replace('text-', 'bg-')}`} style={{ width: `${h.allocation}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent transactions */}
        <div>
          <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest mb-3">RECENT TRANSACTIONS</h3>
          <div className="space-y-1">
            {DEMO_TXS.map((tx, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded border border-terminal-border hover:bg-terminal-accent/40 transition-colors">
                <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                  tx.type === 'buy' ? 'bg-whale-green/20 text-whale-green' :
                  tx.type === 'sell' ? 'bg-whale-red/20 text-whale-red' :
                  'bg-whale-blue/20 text-whale-blue'
                }`}>{tx.type.toUpperCase()}</span>
                <span className="text-white font-mono text-xs font-bold">{tx.token}</span>
                <span className="text-whale-dim font-mono text-xs">{tx.amount.toLocaleString()}</span>
                <span className="text-whale-dim font-mono text-xs">@${tx.price}</span>
                <span className="ml-auto text-whale-dim font-mono text-xs">{tx.date}</span>
                <span className="px-1.5 py-0.5 rounded bg-whale-green/10 text-whale-green text-xs font-mono">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
