import type { WhaleTransaction, Signal, Alert, Token, WhaleWallet, ChartCandle, BacktestResult } from '../types'

const TOKENS = [
  { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112', name: 'Solana' },
  { symbol: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', name: 'Jupiter' },
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', name: 'Bonk' },
  { symbol: 'WIF', address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', name: 'dogwifhat' },
  { symbol: 'PYTH', address: 'HZ1JovNiVvGqNoLkO4h5Q3Cr7kzAkWGAvUCc3NsGnLc9', name: 'Pyth Network' },
  { symbol: 'RAY', address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', name: 'Raydium' },
  { symbol: 'ORCA', address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', name: 'Orca' },
  { symbol: 'MNGO', address: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', name: 'Mango' },
  { symbol: 'SAMO', address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', name: 'Samoyedcoin' },
  { symbol: 'GMT', address: '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx', name: 'STEPN' },
]

const WALLETS = [
  { address: '7xKX...sgAsU', label: 'Alameda Research Remnant', category: 'fund' as const },
  { address: '5Q54...7H2A', label: 'Jump Trading', category: 'market_maker' as const },
  { address: 'DRpb...kFq3', label: 'Wintermute', category: 'market_maker' as const },
  { address: '9WzD...mNkQ', label: 'Multicoin Capital', category: 'fund' as const },
  { address: 'GHJk...3pLm', label: 'Smart Money #1', category: 'smart_money' as const },
  { address: 'KLmn...7qRs', label: 'DeFi Whale #47', category: 'smart_money' as const },
  { address: 'PQrs...2tUv', label: 'Insider Wallet', category: 'insider' as const },
  { address: 'WXyz...8vWx', label: 'FTX Recovery', category: 'exchange' as const },
]

const DEXES = ['Raydium', 'Orca', 'Jupiter', 'Meteora', 'Phoenix']
const SIGNALS = ['accumulation', 'distribution', 'momentum', 'reversal', 'breakout', 'alert'] as const
const STRENGTHS = ['weak', 'moderate', 'strong', 'extreme'] as const
const IMPACTS = ['low', 'medium', 'high', 'extreme'] as const

function rnd(min: number, max: number) { return Math.random() * (max - min) + min }
function rndInt(min: number, max: number) { return Math.floor(rnd(min, max)) }
function pick<T>(arr: T[]): T { return arr[rndInt(0, arr.length)] }
function randAddr() { return Math.random().toString(36).substring(2, 8).toUpperCase() + '...' + Math.random().toString(36).substring(2, 6).toUpperCase() }

export function generateWhaleTransaction(isNew = false): WhaleTransaction {
  const token = pick(TOKENS)
  const wallet = pick(WALLETS)
  const type = pick(['buy', 'sell', 'swap', 'transfer'] as const)
  const amount = rnd(10_000, 5_000_000)
  const price = token.symbol === 'SOL' ? rnd(120, 200) : rnd(0.001, 50)
  const amountUsd = amount * price

  return {
    id: Math.random().toString(36).substring(2),
    signature: Math.random().toString(36).substring(2, 12) + '...' + Math.random().toString(36).substring(2, 6),
    timestamp: Date.now() - rndInt(0, 300_000),
    wallet: wallet.address,
    walletLabel: wallet.label,
    type,
    tokenSymbol: token.symbol,
    tokenAddress: token.address,
    amount,
    amountUsd,
    price,
    impact: amountUsd > 1_000_000 ? 'extreme' : amountUsd > 500_000 ? 'high' : amountUsd > 100_000 ? 'medium' : 'low',
    dex: type === 'swap' ? pick(DEXES) : undefined,
    isNew,
  }
}

export function generateSignal(isNew = false): Signal {
  const token = pick(TOKENS)
  const type = pick(SIGNALS)
  const strength = pick(STRENGTHS)
  const price = token.symbol === 'SOL' ? rnd(120, 200) : rnd(0.001, 50)
  const confidence = rndInt(55, 98)

  const messages: Record<string, string[]> = {
    accumulation: [
      `Large wallets accumulating ${token.symbol} — ${confidence}% of recent buys from top-50 wallets`,
      `Stealth accumulation detected in ${token.symbol}: 3 whales quietly building positions`,
      `${token.symbol} smart money inflow surge: +${rndInt(200, 800)}% above 7d avg`,
    ],
    distribution: [
      `Early investors rotating out of ${token.symbol} — watch for continuation`,
      `${token.symbol} showing distribution pattern: large sells into strength`,
      `Fund-level exit detected in ${token.symbol}: ${rndInt(2, 8)} wallets reducing exposure`,
    ],
    momentum: [
      `${token.symbol} momentum breakout: volume ${rndInt(3, 10)}x above average`,
      `Positive momentum building in ${token.symbol} — trend acceleration signal`,
      `${token.symbol} RSI breakout with institutional backing`,
    ],
    reversal: [
      `${token.symbol} reversal signal: whale capitulation at support`,
      `Potential bottom in ${token.symbol}: smart money entering on dips`,
      `${token.symbol} showing exhaustion — shorts may be squeezed`,
    ],
    breakout: [
      `${token.symbol} breakout imminent: volume profile compressing`,
      `${token.symbol} consolidation breakout: key resistance at $${price.toFixed(4)}`,
      `${token.symbol} spring mechanism forming — expect sharp move`,
    ],
    alert: [
      `ALERT: Unusual ${token.symbol} activity — ${rndInt(5, 20)} wallets active simultaneously`,
      `${token.symbol} anomaly detected: on-chain divergence from price action`,
      `Large ${token.symbol} withdrawal from exchange — supply shock possible`,
    ],
  }

  return {
    id: Math.random().toString(36).substring(2),
    timestamp: Date.now() - rndInt(0, 1_800_000),
    type,
    strength,
    token: token.symbol,
    tokenAddress: token.address,
    message: pick(messages[type]),
    confidence,
    price,
    targetPrice: type === 'accumulation' || type === 'breakout' ? price * rnd(1.1, 1.5) : undefined,
    stopLoss: type === 'accumulation' || type === 'breakout' ? price * rnd(0.85, 0.95) : undefined,
    timeframe: pick(['1H', '4H', '1D', '3D']),
    isNew,
  }
}

export function generateAlert(): Alert {
  const types = ['whale_move', 'price_alert', 'volume_spike', 'signal', 'wallet_alert'] as const
  const severities = ['info', 'warning', 'critical'] as const
  const token = pick(TOKENS)
  const type = pick(types)
  const severity = pick(severities)

  const titles: Record<string, string> = {
    whale_move: `Whale Move: ${token.symbol}`,
    price_alert: `Price Alert: ${token.symbol}`,
    volume_spike: `Volume Spike: ${token.symbol}`,
    signal: `New Signal: ${token.symbol}`,
    wallet_alert: `Wallet Alert`,
  }

  const messages: Record<string, string> = {
    whale_move: `$${(rnd(100_000, 5_000_000)).toLocaleString()} ${token.symbol} moved by tracked whale`,
    price_alert: `${token.symbol} price moved ${rnd(2, 15).toFixed(1)}% in ${rndInt(5, 30)} minutes`,
    volume_spike: `${token.symbol} volume ${rndInt(5, 20)}x above 24h average`,
    signal: `New ${pick(STRENGTHS)} ${pick(SIGNALS)} signal generated for ${token.symbol}`,
    wallet_alert: `High-confidence wallet ${randAddr()} accumulated ${token.symbol}`,
  }

  return {
    id: Math.random().toString(36).substring(2),
    timestamp: Date.now() - rndInt(0, 3_600_000),
    type,
    severity,
    title: titles[type],
    message: messages[type],
    token: token.symbol,
    read: Math.random() > 0.4,
  }
}

export function generateWhaleWallet(): WhaleWallet {
  const wallet = pick(WALLETS)
  return {
    ...wallet,
    pnl30d: rnd(-0.3, 2.5),
    winRate: rnd(0.45, 0.85),
    totalValue: rnd(100_000, 50_000_000),
    txCount30d: rndInt(5, 200),
    lastActive: Date.now() - rndInt(0, 86_400_000),
    tags: [pick(['DeFi', 'NFT', 'MEV', 'Arbitrage', 'LP', 'Staking'])],
  }
}

export function generateCandles(count: number, basePrice: number): ChartCandle[] {
  const candles: ChartCandle[] = []
  let price = basePrice
  const now = Date.now()
  const interval = 3600_000 // 1h

  for (let i = count; i >= 0; i--) {
    const change = (Math.random() - 0.48) * price * 0.04
    const open = price
    const close = price + change
    const high = Math.max(open, close) * (1 + Math.random() * 0.02)
    const low = Math.min(open, close) * (1 - Math.random() * 0.02)
    const volume = rnd(50_000, 2_000_000)

    candles.push({ time: now - i * interval, open, high, low, close, volume })
    price = close
  }

  return candles
}

export function generateBacktestResults(): BacktestResult[] {
  const results: BacktestResult[] = []
  for (let i = 0; i < 50; i++) {
    const token = pick(TOKENS)
    const entry = rnd(0.5, 200)
    const pnl = (Math.random() - 0.35) * 0.8
    const exit = entry * (1 + pnl)
    results.push({
      signalId: Math.random().toString(36).substring(2),
      token: token.symbol,
      entryPrice: entry,
      exitPrice: exit,
      pnlPct: pnl * 100,
      duration: rndInt(1, 168),
      outcome: pnl > 0 ? 'win' : 'loss',
      timestamp: Date.now() - rndInt(0, 30 * 86_400_000),
    })
  }
  return results.sort((a, b) => b.timestamp - a.timestamp)
}

export function generateInitialData() {
  return {
    transactions: Array.from({ length: 25 }, () => generateWhaleTransaction()),
    signals: Array.from({ length: 15 }, () => generateSignal()),
    alerts: Array.from({ length: 12 }, () => generateAlert()),
    wallets: Array.from({ length: 8 }, () => generateWhaleWallet()),
    backtestResults: generateBacktestResults(),
  }
}
