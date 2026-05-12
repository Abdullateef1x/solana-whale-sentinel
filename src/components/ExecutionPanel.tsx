import React, { useState } from 'react'
import type { Signal, Token } from '../types'

interface Props {
  signals: Signal[]
  tokens: Token[]
  walletConnected: boolean
  onConnect: () => void
}

type OrderType = 'market' | 'limit' | 'stop'
type TradeSide = 'buy' | 'sell'

const DEXES = ['Jupiter', 'Raydium', 'Orca', 'Meteora']

function ExecutionForm({ tokens, walletConnected, onConnect, prefill }: {
  tokens: Token[]
  walletConnected: boolean
  onConnect: () => void
  prefill?: Signal
}) {
  const [side, setSide] = useState<TradeSide>('buy')
  const [orderType, setOrderType] = useState<OrderType>('market')
  const [token, setToken] = useState(prefill?.token || tokens[0]?.symbol || 'SOL')
  const [amount, setAmount] = useState('')
  const [price, setPrice] = useState(prefill?.price?.toFixed(4) || '')
  const [slippage, setSlippage] = useState('0.5')
  const [dex, setDex] = useState('Jupiter')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [txSig, setTxSig] = useState('')

  const selectedToken = tokens.find(t => t.symbol === token)
  const estimatedCost = selectedToken && amount ? (parseFloat(amount) * selectedToken.price).toFixed(2) : '--'
  const priceImpact = amount && parseFloat(amount) > 1000 ? ((Math.random() * 0.3) + 0.05).toFixed(2) : '0.01'

  const handleSubmit = async () => {
    if (!walletConnected) { onConnect(); return }
    if (!amount) return
    setStatus('submitting')
    // Simulate transaction
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000))
    if (Math.random() > 0.05) {
      setStatus('done')
      setTxSig(Array.from({ length: 44 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[Math.floor(Math.random() * 58)]).join(''))
    } else {
      setStatus('error')
    }
  }

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded p-4 space-y-4">
      {/* Buy/Sell */}
      <div className="flex rounded overflow-hidden border border-terminal-border">
        {(['buy', 'sell'] as TradeSide[]).map(s => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`flex-1 py-2 text-sm font-mono font-bold transition-colors ${
              side === s
                ? s === 'buy' ? 'bg-whale-green/20 text-whale-green' : 'bg-whale-red/20 text-whale-red'
                : 'text-whale-dim hover:text-white'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Token select */}
      <div>
        <label className="text-whale-dim text-xs font-mono mb-1.5 block">TOKEN</label>
        <select
          value={token}
          onChange={e => setToken(e.target.value)}
          className="w-full bg-terminal-accent border border-terminal-border rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-whale-blue"
        >
          {tokens.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol} — ${t.price < 0.01 ? t.price.toExponential(2) : t.price.toFixed(4)}</option>)}
        </select>
      </div>

      {/* Order type */}
      <div>
        <label className="text-whale-dim text-xs font-mono mb-1.5 block">ORDER TYPE</label>
        <div className="flex gap-1 rounded overflow-hidden border border-terminal-border">
          {(['market', 'limit', 'stop'] as OrderType[]).map(ot => (
            <button
              key={ot}
              onClick={() => setOrderType(ot)}
              className={`flex-1 py-1.5 text-xs font-mono transition-colors ${
                orderType === ot ? 'bg-terminal-accent text-white' : 'text-whale-dim hover:text-white'
              }`}
            >
              {ot.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-whale-dim text-xs font-mono mb-1.5 block">AMOUNT ({token})</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full bg-terminal-accent border border-terminal-border rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-whale-blue placeholder-whale-dim/30"
        />
        {selectedToken && (
          <div className="text-whale-dim text-xs font-mono mt-1">≈ ${estimatedCost} USD</div>
        )}
      </div>

      {/* Limit price */}
      {orderType !== 'market' && (
        <div>
          <label className="text-whale-dim text-xs font-mono mb-1.5 block">
            {orderType === 'limit' ? 'LIMIT PRICE' : 'STOP PRICE'}
          </label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full bg-terminal-accent border border-terminal-border rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-whale-blue placeholder-whale-dim/30"
          />
        </div>
      )}

      {/* DEX + slippage */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-whale-dim text-xs font-mono mb-1.5 block">DEX ROUTER</label>
          <select
            value={dex}
            onChange={e => setDex(e.target.value)}
            className="w-full bg-terminal-accent border border-terminal-border rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-whale-blue"
          >
            {DEXES.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="text-whale-dim text-xs font-mono mb-1.5 block">SLIPPAGE (%)</label>
          <div className="flex gap-1">
            {['0.1', '0.5', '1.0'].map(s => (
              <button
                key={s}
                onClick={() => setSlippage(s)}
                className={`flex-1 py-2 text-xs font-mono rounded border transition-colors ${
                  slippage === s ? 'border-whale-blue text-whale-blue' : 'border-terminal-border text-whale-dim hover:text-white'
                }`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Order summary */}
      {amount && selectedToken && (
        <div className="bg-terminal-accent/50 rounded border border-terminal-border p-3 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-whale-dim">Price Impact</span>
            <span className={parseFloat(priceImpact) > 0.1 ? 'text-whale-yellow' : 'text-whale-green'}>{priceImpact}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-whale-dim">Min Received</span>
            <span className="text-white">{(parseFloat(amount) * (1 - parseFloat(slippage) / 100)).toFixed(4)} {token}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-whale-dim">Network Fee</span>
            <span className="text-white">~0.000005 SOL</span>
          </div>
          <div className="flex justify-between border-t border-terminal-border pt-1.5 mt-1.5">
            <span className="text-whale-dim font-bold">Total Cost</span>
            <span className="text-white font-bold">${estimatedCost}</span>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === 'submitting'}
        className={`w-full py-3 rounded font-mono font-bold text-sm transition-all ${
          status === 'submitting'
            ? 'bg-terminal-border text-whale-dim cursor-not-allowed'
            : !walletConnected
              ? 'bg-bloomberg-orange/20 border border-bloomberg-orange/50 text-bloomberg-orange hover:bg-bloomberg-orange/30'
              : side === 'buy'
                ? 'bg-whale-green/20 border border-whale-green/50 text-whale-green hover:bg-whale-green/30'
                : 'bg-whale-red/20 border border-whale-red/50 text-whale-red hover:bg-whale-red/30'
        }`}
      >
        {status === 'submitting' ? 'PROCESSING...' :
          !walletConnected ? 'CONNECT WALLET TO TRADE' :
          `${side.toUpperCase()} ${token} VIA ${dex.toUpperCase()}`
        }
      </button>

      {/* Transaction result */}
      {status === 'done' && (
        <div className="bg-whale-green/10 border border-whale-green/30 rounded p-3 animate-fade-in">
          <div className="text-whale-green font-mono text-xs font-bold">✓ TRANSACTION CONFIRMED</div>
          <div className="text-whale-dim font-mono text-xs mt-1 break-all">Sig: {txSig.slice(0, 20)}...</div>
        </div>
      )}
      {status === 'error' && (
        <div className="bg-whale-red/10 border border-whale-red/30 rounded p-3 animate-fade-in">
          <div className="text-whale-red font-mono text-xs font-bold">✗ TRANSACTION FAILED</div>
          <div className="text-whale-dim font-mono text-xs mt-1">Slippage exceeded or insufficient funds. Please retry.</div>
        </div>
      )}
    </div>
  )
}

export default function ExecutionPanel({ signals, tokens, walletConnected, onConnect }: Props) {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null)
  const strongSignals = signals.filter(s => s.strength === 'strong' || s.strength === 'extreme').slice(0, 5)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: execution form */}
        <div className="space-y-4">
          <h2 className="text-whale-dim text-xs font-mono font-bold tracking-widest">TRADE EXECUTION</h2>
          <ExecutionForm tokens={tokens} walletConnected={walletConnected} onConnect={onConnect} prefill={selectedSignal || undefined} />
        </div>

        {/* Right: signal-based trade suggestions */}
        <div className="space-y-4">
          <h2 className="text-whale-dim text-xs font-mono font-bold tracking-widest">SIGNAL-BASED TRADES</h2>
          <div className="space-y-2">
            {strongSignals.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedSignal(selectedSignal?.id === s.id ? null : s)}
                className={`border rounded p-3 cursor-pointer transition-all ${
                  selectedSignal?.id === s.id
                    ? 'border-whale-yellow bg-whale-yellow/10'
                    : 'border-terminal-border hover:border-terminal-hover bg-terminal-panel'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                      s.type === 'accumulation' || s.type === 'breakout' ? 'bg-whale-green/20 text-whale-green' : 'bg-whale-red/20 text-whale-red'
                    }`}>{s.type.toUpperCase()}</span>
                    <span className="text-white font-mono font-bold text-xs">{s.token}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-mono text-whale-dim">{s.confidence}% conf</div>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedSignal(s) }}
                      className="px-2 py-0.5 rounded bg-whale-blue/20 text-whale-blue text-xs font-mono hover:bg-whale-blue/30 transition-colors"
                    >
                      TRADE
                    </button>
                  </div>
                </div>
                <p className="text-whale-dim text-xs font-mono mt-1.5 leading-relaxed">{s.message}</p>
                {s.targetPrice && (
                  <div className="flex gap-4 mt-2 text-xs font-mono">
                    <span className="text-whale-green">Target: ${s.targetPrice.toFixed(4)}</span>
                    {s.stopLoss && <span className="text-whale-red">Stop: ${s.stopLoss.toFixed(4)}</span>}
                    <span className="text-whale-dim ml-auto">{s.timeframe}</span>
                  </div>
                )}
              </div>
            ))}
            {strongSignals.length === 0 && (
              <div className="text-whale-dim text-xs font-mono text-center py-8">
                No strong signals available — waiting for whale activity...
              </div>
            )}
          </div>

          {/* Risk warning */}
          <div className="bg-whale-orange/5 border border-whale-orange/20 rounded p-3">
            <div className="text-whale-orange font-mono text-xs font-bold mb-1">⚠ RISK DISCLOSURE</div>
            <p className="text-whale-dim font-mono text-xs leading-relaxed">
              Whale signals are probabilistic, not guaranteed. Always verify on-chain data independently.
              Use stop losses. Never risk more than you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
