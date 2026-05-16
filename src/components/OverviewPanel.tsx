import React from 'react'

import type {
  MarketOverview,
  Token,
  WhaleTransaction,
  Signal
} from '../types'

import TokenGrid from './TokenGrid'
import WhaleFeed from './WhaleFeed'
import SignalFeed from './SignalFeed'
import PriceChart from './PriceChart'
import StatCard from './StatCard'

interface Props {
  overview: MarketOverview | null
  tokens: Token[]
  transactions: WhaleTransaction[]
  signals: Signal[]
}

export default function OverviewPanel({
  overview,
  tokens,
  transactions,
  signals,
}: Props) {
  const solToken = tokens.find(t => t.symbol === 'SOL')

  const topSignal = signals.filter(
    s => s.strength === 'extreme' || s.strength === 'strong'
  )[0]

  const extremeTxs = transactions.filter(
    t => t.impact === 'extreme' || t.impact === 'high'
  ).length

  const buyVsSell = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'buy') acc.buys++
      else if (tx.type === 'sell') acc.sells++
      return acc
    },
    { buys: 0, sells: 0 }
  )

  const sentiment =
    (buyVsSell.buys /
      Math.max(1, buyVsSell.buys + buyVsSell.sells)) *
    100

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-terminal-bg">
      {/* KPI Row */}
      <div className="flex-none grid grid-cols-5 gap-2 p-3 border-b border-terminal-border">
        <StatCard
          label="SOL PRICE"
          value={`$${solToken?.price?.toFixed(2) || overview?.solPrice?.toFixed(2) || '--'}`}
          change={solToken?.priceChange24h || overview?.solChange24h}
          color="white"
        />

        <StatCard
          label="24H VOLUME"
          value={
            overview
              ? `$${(overview.totalVolume24h / 1e9).toFixed(2)}B`
              : '--'
          }
          subValue="Solana DEX total"
          color="blue"
        />

        <StatCard
          label="WHALE ALERTS"
          value={`${extremeTxs}`}
          subValue="High-impact tx (1h)"
          color={extremeTxs > 5 ? 'red' : 'orange'}
        />

        <StatCard
          label="WHALE SENTIMENT"
          value={`${sentiment.toFixed(0)}% BULL`}
          subValue={`${buyVsSell.buys}B / ${buyVsSell.sells}S`}
          color={
            sentiment > 55
              ? 'green'
              : sentiment < 45
                ? 'red'
                : 'yellow'
          }
        />

        <StatCard
          label="FEAR/GREED"
          value={`${overview?.fearGreedIndex ?? '--'}`}
          subValue={
            overview
              ? overview.fearGreedIndex > 60
                ? 'GREED'
                : overview.fearGreedIndex < 40
                  ? 'FEAR'
                  : 'NEUTRAL'
              : ''
          }
          color={
            overview?.fearGreedIndex
              ? overview.fearGreedIndex > 60
                ? 'green'
                : overview.fearGreedIndex < 40
                  ? 'red'
                  : 'yellow'
              : 'white'
          }
        />
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-12 divide-x divide-terminal-border">
        {/* Chart Section */}
        <div className="col-span-6 flex flex-col min-w-0 border-r border-terminal-border">
          <div className="flex items-center justify-between px-3 py-2 border-b border-terminal-border bg-terminal-panel">
            <span className="text-whale-dim text-xs font-mono font-bold tracking-widest">
              SOL/USD CHART
            </span>

            {topSignal && (
              <span className="text-xs font-mono text-whale-accent">
                TOP SIGNAL: {topSignal.type.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-h-0 p-2">
            <PriceChart
              symbol="SOL"
              basePrice={overview?.solPrice || 158}
              height={420}
            />
          </div>
        </div>

        {/* Token Watch */}
        <div className="col-span-2 flex flex-col min-w-0 border-r border-terminal-border">
          <div className="px-3 py-2 border-b border-terminal-border bg-terminal-panel">
            <span className="text-whale-dim text-xs font-mono font-bold tracking-widest">
              TOKEN WATCH
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <TokenGrid tokens={tokens} compact />
          </div>
        </div>

        {/* Whale Feed */}
        <div className="col-span-2 flex flex-col min-w-0 border-r border-terminal-border">
          <div className="px-3 py-2 border-b border-terminal-border bg-terminal-panel">
            <span className="text-whale-dim text-xs font-mono font-bold tracking-widest">
              WHALE FLOW
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <WhaleFeed
              transactions={transactions.slice(0, 20)}
              compact
            />
          </div>
        </div>

        {/* Signals Feed */}
        <div className="col-span-2 flex flex-col min-w-0">
          <div className="px-3 py-2 border-b border-terminal-border bg-terminal-panel">
            <span className="text-whale-dim text-xs font-mono font-bold tracking-widest">
              SIGNALS
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <SignalFeed
              signals={signals.slice(0, 10)}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  )
}