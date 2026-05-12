export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  price: number
  priceChange24h: number
  volume24h: number
  marketCap: number
  liquidity: number
  holders?: number
}

export interface WhaleTransaction {
  id: string
  signature: string
  timestamp: number
  wallet: string
  walletLabel?: string
  type: 'buy' | 'sell' | 'transfer' | 'swap'
  tokenSymbol: string
  tokenAddress: string
  amount: number
  amountUsd: number
  price: number
  impact: 'low' | 'medium' | 'high' | 'extreme'
  dex?: string
  isNew?: boolean
}

export interface WhaleWallet {
  address: string
  label: string
  category: 'fund' | 'market_maker' | 'insider' | 'smart_money' | 'exchange' | 'unknown'
  pnl30d: number
  winRate: number
  totalValue: number
  txCount30d: number
  lastActive: number
  tags: string[]
}

export interface Signal {
  id: string
  timestamp: number
  type: 'accumulation' | 'distribution' | 'momentum' | 'reversal' | 'breakout' | 'alert'
  strength: 'weak' | 'moderate' | 'strong' | 'extreme'
  token: string
  tokenAddress: string
  message: string
  confidence: number
  price: number
  targetPrice?: number
  stopLoss?: number
  timeframe: string
  isNew?: boolean
}

export interface Alert {
  id: string
  timestamp: number
  type: 'whale_move' | 'price_alert' | 'volume_spike' | 'signal' | 'wallet_alert'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  token?: string
  read: boolean
}

export interface MarketOverview {
  solPrice: number
  solChange24h: number
  totalVolume24h: number
  fearGreedIndex: number
  topGainers: Token[]
  topLosers: Token[]
  trending: Token[]
}

export interface PortfolioPosition {
  token: Token
  amount: number
  valueUsd: number
  costBasis: number
  pnl: number
  pnlPct: number
  allocation: number
}

export interface BacktestResult {
  signalId: string
  token: string
  entryPrice: number
  exitPrice: number
  pnlPct: number
  duration: number
  outcome: 'win' | 'loss'
  timestamp: number
}

export interface ChartCandle {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type TimeRange = '1h' | '4h' | '1d' | '7d' | '30d'
export type PanelLayout = 'default' | 'focus-chart' | 'focus-whales' | 'focus-signals'
