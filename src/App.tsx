import React, { useState, useCallback } from 'react'
import TerminalHeader from './components/TerminalHeader'
import OverviewPanel from './components/OverviewPanel'
import WhalesPanel from './components/WhalesPanel'
import SignalsPanel from './components/SignalsPanel'
import AnalyticsPanel from './components/AnalyticsPanel'
import PortfolioPanel from './components/PortfolioPanel'
import ExecutionPanel from './components/ExecutionPanel'
import AlertsPanel from './components/AlertsPanel'
import { useMarketData } from './hooks/useMarketData'
import { useSignalEngine } from './hooks/useSignalEngine'

type ActivePanel = 'overview' | 'whales' | 'signals' | 'analytics' | 'portfolio' | 'execution'

// Generate a mock Solana wallet address
function generateMockAddress(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let addr = ''
  for (let i = 0; i < 44; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)]
  }
  return addr
}

export default function App() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('overview')
  const [showAlerts, setShowAlerts] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const { tokens, overview } = useMarketData()
  const {
    transactions,
    signals,
    alerts,
    wallets,
    backtestResults,
    isStreaming,
    unreadAlerts,
    startStream,
    stopStream,
    markAlertRead,
    markAllRead,
  } = useSignalEngine()

  const handleToggleStream = useCallback(() => {
    if (isStreaming) stopStream()
    else startStream()
  }, [isStreaming, startStream, stopStream])

  const handleConnectWallet = useCallback(() => {
    setWalletAddress(generateMockAddress())
    setWalletConnected(true)
  }, [])

  const handleDisconnectWallet = useCallback(() => {
    setWalletConnected(false)
    setWalletAddress('')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-terminal-bg text-terminal-text overflow-hidden">
      <TerminalHeader
        overview={overview}
        unreadAlerts={unreadAlerts}
        isStreaming={isStreaming}
        onToggleStream={handleToggleStream}
        onShowAlerts={() => setShowAlerts(true)}
        activePanel={activePanel}
        onPanelChange={(p) => setActivePanel(p as ActivePanel)}
        walletConnected={walletConnected}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      <main className="flex-1 overflow-hidden">
        {activePanel === 'overview' && (
          <OverviewPanel
            overview={overview}
            tokens={tokens}
            transactions={transactions}
            signals={signals}
          />
        )}
        {activePanel === 'whales' && (
          <WhalesPanel
            transactions={transactions}
            wallets={wallets}
            tokens={tokens}
          />
        )}
        {activePanel === 'signals' && (
          <SignalsPanel
            signals={signals}
            tokens={tokens}
          />
        )}
        {activePanel === 'analytics' && (
          <AnalyticsPanel
            backtestResults={backtestResults}
            signals={signals}
          />
        )}
        {activePanel === 'portfolio' && (
          <PortfolioPanel
            tokens={tokens}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            onConnect={handleConnectWallet}
          />
        )}
        {activePanel === 'execution' && (
          <ExecutionPanel
            signals={signals}
            tokens={tokens}
            walletConnected={walletConnected}
            onConnect={handleConnectWallet}
          />
        )}
      </main>

      {showAlerts && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-12 pr-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAlerts(false)}
          />
          <div className="relative z-10 w-full max-w-md h-[calc(100vh-4rem)] overflow-hidden">
            <AlertsPanel
              alerts={alerts}
              onMarkRead={markAlertRead}
              onMarkAllRead={markAllRead}
              onClose={() => setShowAlerts(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
