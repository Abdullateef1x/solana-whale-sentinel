import React, { useMemo, useState, useEffect, useCallback } from 'react'
import type { Token } from '../types'
import { fetchWalletTokenList, fetchWalletTxList } from '../lib/edgeFunctions'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  tokens: Token[]
  walletConnected: boolean
  walletAddress: string
  onConnect: () => void
}

interface BirdeyeTokenBalance {
  address: string; symbol: string; name: string; logoURI?: string
  uiAmount: number; valueUsd: number; priceUsd: number; priceChange24h?: number
}
interface BirdeyeTransaction {
  txHash: string; blockTime: number; status: 'Success' | 'Fail'
  from: { symbol: string; uiAmount: number; address: string }
  to:   { symbol: string; uiAmount: number; address: string }
}
interface Holding {
  symbol: string; name: string; amount: number; price: number
  value: number; change24h: number; allocation: number
}
interface RecentTx {
  txHash: string; blockTime: number; type: 'buy' | 'sell' | 'swap'
  fromSymbol: string; toSymbol: string; fromAmount: number; toAmount: number
  status: 'Success' | 'Fail'
}

function shortenAddress(addr: string, chars = 4): string {
  if (addr.length <= chars * 2 + 1) return addr
  return `${addr.slice(0, chars)}…${addr.slice(-chars)}`
}
function formatValue(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}
function friendlyError(raw: string, context: 'holdings' | 'transactions'): string {
  if (raw.includes('401'))
    return context === 'holdings'
      ? 'Portfolio data requires a Birdeye paid plan. Wallet connected ✓'
      : 'Transaction history requires a Birdeye paid plan.'
  if (raw.includes('429')) return 'Rate limit reached — please wait a moment and refresh.'
  return raw
}

const SLICE_COLORS = ['#00d68f', '#0095ff', '#ff6b35', '#a855f7', '#06b6d4', '#f59e0b']

function AllocationDonut({ holdings }: { holdings: Holding[] }) {
  let cumulative = 0
  const segments = holdings.slice(0, 6).map((h, i) => {
    const start = cumulative; cumulative += h.allocation
    const startAngle = (start / 100) * 2 * Math.PI - Math.PI / 2
    const endAngle   = (cumulative / 100) * 2 * Math.PI - Math.PI / 2
    const r = 40, cx = 50, cy = 50
    const x1 = cx + r * Math.cos(startAngle); const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(endAngle);   const y2 = cy + r * Math.sin(endAngle)
    return (
      <path key={h.symbol}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${h.allocation > 50 ? 1 : 0} 1 ${x2} ${y2} Z`}
        fill={SLICE_COLORS[i] ?? '#4b5563'} opacity={0.85} />
    )
  })
  return (
    <svg viewBox="0 0 100 100" className="w-28 h-28 flex-none">
      {segments}
      <circle cx="50" cy="50" r="25" fill="#0f1117" />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="middle"
        fill="#e2e8f0" fontSize="8" fontFamily="monospace" fontWeight="bold">PORTFOLIO</text>
    </svg>
  )
}

async function fetchWalletHoldings(address: string): Promise<Holding[]> {
  const data = await fetchWalletTokenList(address)
  const items: BirdeyeTokenBalance[] = data?.data?.items ?? []
  const meaningful = items.filter(i => i.valueUsd >= 0.01).sort((a, b) => b.valueUsd - a.valueUsd)
  const totalValue = meaningful.reduce((s, i) => s + i.valueUsd, 0) || 1
  return meaningful.map(item => ({
    symbol: item.symbol, name: item.name, amount: item.uiAmount,
    price: item.priceUsd, value: item.valueUsd, change24h: item.priceChange24h ?? 0,
    allocation: (item.valueUsd / totalValue) * 100,
  }))
}

async function fetchWalletTransactions(address: string): Promise<RecentTx[]> {
  const data = await fetchWalletTxList(address, 10)
  const items: BirdeyeTransaction[] = data?.data?.transactions ?? []
  return items.map(tx => {
    const stable = new Set(['SOL', 'USDC', 'USDT'])
    const fromStable = stable.has(tx.from.symbol); const toStable = stable.has(tx.to.symbol)
    const type: RecentTx['type'] = fromStable && !toStable ? 'buy' : !fromStable && toStable ? 'sell' : 'swap'
    return { txHash: tx.txHash, blockTime: tx.blockTime * 1000, type,
      fromSymbol: tx.from.symbol, toSymbol: tx.to.symbol,
      fromAmount: tx.from.uiAmount, toAmount: tx.to.uiAmount, status: tx.status }
  })
}

export default function PortfolioPanel({ tokens, walletConnected, walletAddress, onConnect }: Props) {
  const [holdings,  setHoldings]  = useState<Holding[]>([])
  const [txHistory, setTxHistory] = useState<RecentTx[]>([])
  const [loadingH,  setLoadingH]  = useState(false)
  const [loadingT,  setLoadingT]  = useState(false)
  const [errorH,    setErrorH]    = useState<string | null>(null)
  const [errorT,    setErrorT]    = useState<string | null>(null)

  const loadPortfolio = useCallback(async () => {
    if (!walletAddress) return
    setLoadingH(true); setErrorH(null)
    try { setHoldings(await fetchWalletHoldings(walletAddress)) }
    catch (err: any) {
      const raw = err?.message ?? 'Failed to load holdings'
      console.warn('⚠️ Holdings fetch failed:', raw)
      setErrorH(friendlyError(raw, 'holdings'))
    } finally { setLoadingH(false) }
  }, [walletAddress])

  const loadTransactions = useCallback(async () => {
    if (!walletAddress) return
    setLoadingT(true); setErrorT(null)
    try { setTxHistory(await fetchWalletTransactions(walletAddress)) }
    catch (err: any) {
      const raw = err?.message ?? 'Failed to load transactions'
      console.warn('⚠️ Tx fetch failed:', raw)
      setErrorT(friendlyError(raw, 'transactions'))
    } finally { setLoadingT(false) }
  }, [walletAddress])

  useEffect(() => {
    if (!walletConnected || !walletAddress) return
    loadPortfolio(); loadTransactions()
  }, [walletConnected, walletAddress, loadPortfolio, loadTransactions])

  const enrichedHoldings = useMemo(() => holdings.map(h => {
    const live = tokens.find(t => t.symbol === h.symbol)
    if (!live) return h
    return { ...h, price: live.price, value: h.amount * live.price, change24h: live.priceChange24h }
  }), [holdings, tokens])

  const totalValue     = enrichedHoldings.reduce((a, h) => a + h.value, 0)
  const totalChange24h = enrichedHoldings.reduce((a, h) => a + h.value * (h.change24h / 100), 0)
  const totalChangePct = totalValue > 0 ? (totalChange24h / (totalValue - totalChange24h)) * 100 : 0
  const is401H = errorH?.includes('paid plan')
  const is401T = errorT?.includes('paid plan')

  if (!walletConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-4xl opacity-20">🐋</div>
        <div className="text-whale-dim font-mono text-sm">Connect your Solflare wallet to view portfolio</div>
        <button onClick={onConnect}
          className="px-6 py-2 rounded border border-bloomberg-orange/50 text-bloomberg-orange bg-bloomberg-orange/10 hover:bg-bloomberg-orange/20 transition-colors font-mono text-sm">
          CONNECT SOLFLARE WALLET
        </button>
        <p className="text-whale-dim/50 text-xs font-mono max-w-xs text-center">
          Solflare integration enables real-time portfolio tracking and one-click trade execution from signals.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-5">

        {/* Summary */}
        <div className="flex items-start gap-6">
          {enrichedHoldings.length > 0
            ? <AllocationDonut holdings={enrichedHoldings} />
            : <div className="w-28 h-28 flex-none rounded-full border border-terminal-border flex items-center justify-center text-whale-dim text-xs font-mono">—</div>
          }
          <div className="flex-1">
            <div className="text-whale-dim text-xs font-mono mb-1">TOTAL VALUE</div>
            {loadingH
              ? <div className="text-whale-dim font-mono text-sm animate-pulse">Loading…</div>
              : is401H
                ? <div className="text-whale-dim font-mono text-sm">—</div>
                : errorH
                  ? <div className="text-whale-red font-mono text-xs">{errorH}</div>
                  : <>
                      <div className="text-white font-mono font-bold text-2xl">{formatValue(totalValue)}</div>
                      <div className={`text-sm font-mono font-bold mt-1 ${totalChange24h >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                        {totalChange24h >= 0 ? '+' : ''}{formatValue(Math.abs(totalChange24h))}
                        {' '}({totalChangePct >= 0 ? '+' : ''}{totalChangePct.toFixed(2)}%) 24h
                      </div>
                    </>
            }
            <div className="text-xs text-whale-dim font-mono mt-1 flex items-center gap-1">
              {shortenAddress(walletAddress)}
              <a href={`https://solscan.io/account/${walletAddress}`} target="_blank" rel="noopener noreferrer"
                className="text-whale-blue hover:underline text-xs">↗</a>
            </div>
            <div className="text-xs text-whale-cyan font-mono mt-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-whale-green animate-pulse" />
              Solflare Connected
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest">HOLDINGS</h3>
            {!is401H && (
              <button onClick={loadPortfolio} disabled={loadingH}
                className="text-whale-dim hover:text-white text-xs font-mono transition-colors disabled:opacity-40">
                {loadingH ? 'Refreshing…' : '↻ Refresh'}
              </button>
            )}
          </div>
          {loadingH && !enrichedHoldings.length
            ? <div className="text-whale-dim text-xs font-mono text-center py-6 animate-pulse">Fetching holdings from Birdeye…</div>
            : is401H
              ? <div className="bg-terminal-panel border border-terminal-border rounded p-4 text-center space-y-2">
                  <div className="text-whale-dim font-mono text-xs">Portfolio data requires a Birdeye paid plan.</div>
                  <div className="text-whale-green font-mono text-xs">✓ Wallet connected — on-chain execution available via the Execution panel.</div>
                </div>
              : errorH
                ? <div className="text-whale-red text-xs font-mono text-center py-4">{errorH}</div>
                : !enrichedHoldings.length
                  ? <div className="text-whale-dim text-xs font-mono text-center py-6">No token balances found.</div>
                  : <div className="border border-terminal-border rounded overflow-hidden">
                      <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-terminal-panel border-b border-terminal-border text-xs text-whale-dim font-mono">
                        <span className="col-span-2">TOKEN</span>
                        <span className="text-right">PRICE</span>
                        <span className="text-right">VALUE</span>
                        <span className="text-right">24H</span>
                        <span className="text-right">ALLOC</span>
                      </div>
                      {enrichedHoldings.slice(0, 10).map((h, i) => (
                        <div key={h.symbol} className="grid grid-cols-6 gap-2 px-3 py-2 border-b border-terminal-border hover:bg-terminal-accent/40 transition-colors">
                          <div className="col-span-2 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: SLICE_COLORS[i] ?? '#4b5563' }} />
                            <div className="min-w-0">
                              <div className="text-white font-mono text-xs font-bold">{h.symbol}</div>
                              <div className="text-whale-dim font-mono text-xs truncate">
                                {h.amount < 0.001 ? h.amount.toExponential(2) : h.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right self-center text-white font-mono text-xs tabular-nums">
                            {h.price < 0.0001 ? `$${h.price.toExponential(2)}` : h.price < 1 ? `$${h.price.toFixed(5)}` : `$${h.price.toFixed(2)}`}
                          </div>
                          <div className="text-right self-center text-white font-mono text-xs tabular-nums">{formatValue(h.value)}</div>
                          <div className={`text-right self-center font-mono text-xs font-bold ${h.change24h >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                            {h.change24h >= 0 ? '+' : ''}{h.change24h.toFixed(2)}%
                          </div>
                          <div className="text-right self-center">
                            <div className="text-whale-dim font-mono text-xs">{h.allocation.toFixed(1)}%</div>
                            <div className="mt-1 h-1 bg-terminal-border rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${h.allocation}%`, backgroundColor: SLICE_COLORS[i] ?? '#4b5563' }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
          }
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-whale-dim text-xs font-mono font-bold tracking-widest">RECENT TRANSACTIONS</h3>
            {!is401T && (
              <button onClick={loadTransactions} disabled={loadingT}
                className="text-whale-dim hover:text-white text-xs font-mono transition-colors disabled:opacity-40">
                {loadingT ? 'Refreshing…' : '↻ Refresh'}
              </button>
            )}
          </div>
          {loadingT && !txHistory.length
            ? <div className="text-whale-dim text-xs font-mono text-center py-6 animate-pulse">Fetching transactions from Birdeye…</div>
            : is401T
              ? <div className="bg-terminal-panel border border-terminal-border rounded p-4 text-center">
                  <div className="text-whale-dim font-mono text-xs">Transaction history requires a Birdeye paid plan.</div>
                </div>
              : errorT
                ? <div className="text-whale-red text-xs font-mono text-center py-4">{errorT}</div>
                : !txHistory.length
                  ? <div className="text-whale-dim text-xs font-mono text-center py-6">No recent transactions found.</div>
                  : <div className="space-y-1">
                      {txHistory.map(tx => (
                        <div key={tx.txHash} className="flex items-center gap-3 px-3 py-2 rounded border border-terminal-border hover:bg-terminal-accent/40 transition-colors">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold flex-none ${
                            tx.type === 'buy' ? 'bg-whale-green/20 text-whale-green' :
                            tx.type === 'sell' ? 'bg-whale-red/20 text-whale-red' : 'bg-whale-blue/20 text-whale-blue'
                          }`}>{tx.type.toUpperCase()}</span>
                          <span className="text-white font-mono text-xs font-bold">
                            {tx.type === 'swap' ? `${tx.fromSymbol}→${tx.toSymbol}` : tx.toSymbol}
                          </span>
                          <span className="text-whale-dim font-mono text-xs">
                            {tx.fromAmount.toLocaleString('en-US', { maximumFractionDigits: 4 })} {tx.fromSymbol}
                          </span>
                          <span className="ml-auto text-whale-dim font-mono text-xs">
                            {formatDistanceToNow(tx.blockTime, { addSuffix: true })}
                          </span>
                          <a href={`https://solscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer"
                            className="text-whale-blue hover:underline font-mono text-xs flex-none"
                            onClick={e => e.stopPropagation()}>↗</a>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-mono flex-none ${
                            tx.status === 'Success' ? 'bg-whale-green/10 text-whale-green' : 'bg-whale-red/10 text-whale-red'
                          }`}>{tx.status === 'Success' ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
          }
        </div>

      </div>
    </div>
  )
}
