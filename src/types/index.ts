export type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d'

export interface WhaleTransaction {
  id: string
  timestamp: number
  wallet: string
  walletLabel?: string
  walletCategory: 'fund' | 'market_maker' | 'insider' | 'smart_money' | 'exchange' | 'unknown'
  type: 'buy' | 'sell' | 'swap' | 'transfer'
  tokenSymbol: string
  tokenAddress: string
  amount: number
  price: number
  amountUsd: number
  dex?: string
  txHash: string
  impact: 'low' | 'medium' | 'high' | 'extreme'
  isNew?: boolean
}

export interface Signal {
  id: string
  timestamp: number
  token: string
  type: 'accumulation' | 'distribution' | 'momentum' | 'reversal' | 'breakout' | 'alert'
  strength: 'weak' | 'moderate' | 'strong' | 'extreme'
  confidence: number // 0-100
  message: string
  price: number
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  isNew?: boolean
}

export interface Alert {
  id: string
  timestamp: number
  type: 'whale_move' | 'signal' | 'price' | 'volume'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  token?: string
  read: boolean
}

export interface WhaleWallet {
  address: string
  label: string
  category: 'fund' | 'market_maker' | 'insider' | 'smart_money' | 'exchange' | 'unknown'
  totalValue: number
  pnl30d: number // as a fraction e.g. 0.35 = 35%
  winRate: number // 0-1
  txCount30d: number
  lastActive: number
  tags: string[]
}

export interface Token {
  address: string
  symbol: string
  name: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  liquidity: number
}

export interface MarketOverview {
  solPrice: number
  solChange24h: number
  totalVolume24h: number
  totalTvl: number
  fearGreedIndex: number
  activeWhales: number
  defiTransactions24h: number
}

export interface ChartCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface BacktestResult {
  signalId: string
  token: string
  entryPrice: number
  exitPrice: number
  pnlPct: number
  outcome: 'win' | 'loss'
  duration: number // hours
}
