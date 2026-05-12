import React, { useState, useEffect } from 'react'
import type { MarketOverview } from '../types'

interface Props {
  overview: MarketOverview | null
  unreadAlerts: number
  isStreaming: boolean
  onToggleStream: () => void
  onShowAlerts: () => void
  activePanel: string
  onPanelChange: (p: string) => void
  walletConnected: boolean
  walletAddress: string
  onConnectWallet: () => void
  onDisconnectWallet: () => void
}

export default function TerminalHeader({
  overview, unreadAlerts, isStreaming, onToggleStream, onShowAlerts,
  activePanel, onPanelChange, walletConnected, walletAddress, onConnectWallet, onDisconnectWallet
}: Props) {
  const [time, setTime] = useState(new Date())
  const [showWalletMenu, setShowWalletMenu] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const fmt = (n: number, d = 2) => n?.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) ?? '--'

  const TABS = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'whales', label: 'WHALES' },
    { id: 'signals', label: 'SIGNALS' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'execution', label: 'EXECUTE' },
  ]

  return (
    <header className="flex-none border-b border-terminal-border bg-terminal-panel">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-whale-green animate-pulse" />
            <span className="text-whale-green font-mono font-bold text-sm tracking-widest">ORCA</span>
            <span className="text-whale-dim font-mono text-xs tracking-widest">TERMINAL</span>
          </div>
          <div className="h-4 w-px bg-terminal-border" />
          <span className="text-xs text-whale-dim font-mono">v2.4.1</span>
        </div>

        {/* SOL Price Ticker */}
        {overview && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-whale-dim text-xs font-mono">SOL</span>
              <span className="text-white font-mono font-bold text-sm">${fmt(overview.solPrice)}</span>
              <span className={`text-xs font-mono font-bold ${overview.solChange24h >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                {overview.solChange24h >= 0 ? '+' : ''}{fmt(overview.solChange24h, 2)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-whale-dim text-xs font-mono">VOL 24H</span>
              <span className="text-whale-blue text-xs font-mono">${(overview.totalVolume24h / 1e9).toFixed(2)}B</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-whale-dim text-xs font-mono">FEAR/GREED</span>
              <span className={`text-xs font-mono font-bold ${overview.fearGreedIndex > 60 ? 'text-whale-green' : overview.fearGreedIndex < 40 ? 'text-whale-red' : 'text-whale-yellow'}`}>
                {overview.fearGreedIndex}
              </span>
            </div>
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Stream toggle */}
          <button
            onClick={onToggleStream}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border transition-colors ${
              isStreaming
                ? 'border-whale-green text-whale-green bg-whale-green/10 hover:bg-whale-green/20'
                : 'border-terminal-border text-whale-dim hover:border-whale-dim'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-whale-green animate-pulse' : 'bg-whale-dim'}`} />
            {isStreaming ? 'LIVE' : 'PAUSED'}
          </button>

          {/* Alerts */}
          <button
            onClick={onShowAlerts}
            className="relative flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border border-terminal-border text-whale-dim hover:border-whale-yellow hover:text-whale-yellow transition-colors"
          >
            ⚡ ALERTS
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-whale-red text-white text-xs flex items-center justify-center font-bold">
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* Wallet */}
          <div className="relative">
            {walletConnected ? (
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border border-whale-purple/50 text-whale-purple bg-whale-purple/10 hover:bg-whale-purple/20 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-whale-purple" />
                {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
              </button>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border border-bloomberg-orange/50 text-bloomberg-orange bg-bloomberg-orange/10 hover:bg-bloomberg-orange/20 transition-colors"
              >
                CONNECT WALLET
              </button>
            )}
            {showWalletMenu && walletConnected && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-terminal-panel border border-terminal-border rounded shadow-xl z-50 animate-fade-in">
                <div className="p-3 border-b border-terminal-border">
                  <div className="text-xs text-whale-dim font-mono">Connected via Solflare</div>
                  <div className="text-xs text-whale-purple font-mono mt-1">{walletAddress}</div>
                </div>
                <button
                  onClick={() => { onDisconnectWallet(); setShowWalletMenu(false) }}
                  className="w-full text-left px-3 py-2 text-xs font-mono text-whale-red hover:bg-terminal-accent transition-colors"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Clock */}
          <div className="text-xs font-mono text-whale-dim tabular-nums">
            {time.toUTCString().slice(17, 25)} UTC
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="flex items-center gap-0 px-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onPanelChange(tab.id)}
            className={`px-4 py-2 text-xs font-mono font-bold tracking-wider transition-colors border-b-2 ${
              activePanel === tab.id
                ? 'border-whale-green text-whale-green bg-whale-green/5'
                : 'border-transparent text-whale-dim hover:text-white hover:border-terminal-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  )
}
