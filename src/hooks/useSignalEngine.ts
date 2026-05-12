import { useState, useEffect, useCallback, useRef } from 'react'
import type { WhaleTransaction, Signal, Alert } from '../types'
import { generateWhaleTransaction, generateSignal, generateAlert, generateInitialData } from '../lib/mockData'

export function useSignalEngine() {
  const initial = generateInitialData()
  const [transactions, setTransactions] = useState<WhaleTransaction[]>(initial.transactions)
  const [signals, setSignals] = useState<Signal[]>(initial.signals)
  const [alerts, setAlerts] = useState<Alert[]>(initial.alerts)
  const [wallets] = useState(initial.wallets)
  const [backtestResults] = useState(initial.backtestResults)
  const [isStreaming, setIsStreaming] = useState(true)
  const [signalCount, setSignalCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const injectTransaction = useCallback(() => {
    const tx = generateWhaleTransaction(true)
    setTransactions(prev => [tx, ...prev].slice(0, 100))

    // High-value transactions trigger alerts
    if (tx.amountUsd > 500_000) {
      const alert: Alert = {
        id: Math.random().toString(36).substring(2),
        timestamp: Date.now(),
        type: 'whale_move',
        severity: tx.amountUsd > 2_000_000 ? 'critical' : 'warning',
        title: `${tx.impact.toUpperCase()} Whale ${tx.type.toUpperCase()}: ${tx.tokenSymbol}`,
        message: `$${(tx.amountUsd / 1000).toFixed(0)}K ${tx.tokenSymbol} ${tx.type} by ${tx.walletLabel || tx.wallet}`,
        token: tx.tokenSymbol,
        read: false,
      }
      setAlerts(prev => [alert, ...prev].slice(0, 50))
    }
  }, [])

  const injectSignal = useCallback(() => {
    const signal = generateSignal(true)
    setSignals(prev => [signal, ...prev].slice(0, 50))
    setSignalCount(prev => prev + 1)
  }, [])

  const startStream = useCallback(() => {
    setIsStreaming(true)
    if (intervalRef.current) clearInterval(intervalRef.current)

    // Staggered intervals for realistic feel
    let tick = 0
    intervalRef.current = setInterval(() => {
      tick++
      // Transaction every 2-8s
      if (Math.random() > 0.3) injectTransaction()
      // Signal every ~20-40s
      if (tick % 8 === 0 || Math.random() > 0.97) injectSignal()
      // Occasional alert
      if (Math.random() > 0.98) {
        const alert = generateAlert()
        alert.read = false
        alert.timestamp = Date.now()
        setAlerts(prev => [alert, ...prev].slice(0, 50))
      }
    }, 2500)
  }, [injectTransaction, injectSignal])

  const stopStream = useCallback(() => {
    setIsStreaming(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const markAlertRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }, [])

  const markAllRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }, [])

  const clearNewFlags = useCallback(() => {
    setTransactions(prev => prev.map(t => ({ ...t, isNew: false })))
    setSignals(prev => prev.map(s => ({ ...s, isNew: false })))
  }, [])

  useEffect(() => {
    startStream()
    // Clear "new" flags after 3s
    const clearTimer = setInterval(clearNewFlags, 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      clearInterval(clearTimer)
    }
  }, [startStream, clearNewFlags])

  const unreadAlerts = alerts.filter(a => !a.read).length

  return {
    transactions,
    signals,
    alerts,
    wallets,
    backtestResults,
    isStreaming,
    signalCount,
    unreadAlerts,
    startStream,
    stopStream,
    markAlertRead,
    markAllRead,
  }
}
