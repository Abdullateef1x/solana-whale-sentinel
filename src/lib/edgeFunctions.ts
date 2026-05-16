/**
 * ============================================
 * EDGE FUNCTION CLIENT
 *
 * All Birdeye calls route through the birdeye-proxy
 * Supabase Edge Function. The base URL and anon key
 * are read from config.ts (VITE_SUPABASE_URL +
 * VITE_SUPABASE_ANON_KEY) — no extra env vars needed.
 * ============================================
 */

import { EDGE_FN_BASE, SUPABASE_ANON_KEY, edgeHeaders } from '../config'

// birdeye-proxy is the Edge Function name defined in
// supabase/functions/birdeye-proxy/index.ts
const EDGE_URL = `${EDGE_FN_BASE}/birdeye-proxy`

/**
 * ── Birdeye response shapes ─────────────────────────────────────
 */
export interface BirdeyePriceItem {
  value:          number
  priceChange24h: number
  v24hUSD:        number
  mc:             number
  liquidity:      number
  holder:         number
}

export interface BirdeyeMultiPriceResponse {
  data:  Record<string, BirdeyePriceItem> | null
  error: string | null
}

export interface BirdeyeSinglePriceResponse {
  data:  BirdeyePriceItem | null
  error: string | null
}

/**
 * ── Request options ─────────────────────────────────────────────
 */
interface FetchOptions {
  /**
   * When true the request is sent with Cache-Control: no-store so the
   * Edge Function (and any CDN in front of it) returns a fresh response.
   * Use for live ticker ticks where stale data defeats the purpose.
   */
  bypassCache?: boolean
  timeoutMs?: number
}

/**
 * ── Core fetch helper ───────────────────────────────────────────
 */
async function callEdge<T>(
  path:    string,
  options: FetchOptions = {}
): Promise<T> {
  const { bypassCache = false, timeoutMs = 10_000 } = options

  // edgeHeaders() injects 'apikey' + 'Content-Type' from config.ts.
  // Supabase Edge Functions require the anon key on every request.
  const headers: HeadersInit = {
    ...edgeHeaders(),
    ...(bypassCache ? { 'Cache-Control': 'no-store' } : {}),
  }

  const res = await fetch(`${EDGE_URL}${path}`, {
    headers,
    signal: AbortSignal.timeout(timeoutMs),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Edge Function ${path} → HTTP ${res.status}: ${body.slice(0, 200)}`)
  }

  return res.json() as Promise<T>
}

/**
 * ============================================
 * PUBLIC API
 * ============================================
 */

/**
 * Fetch prices for multiple SPL token mint addresses.
 *
 * @param addresses  Array of base58 mint addresses
 * @param bypassCache  Set true in live-ticker calls to always hit the network
 */
// export async function fetchMultiPrice(
//   addresses:    string[],
//   bypassCache = false
// ): Promise<BirdeyeMultiPriceResponse> {
//   if (!addresses.length) return { data: null, error: 'No addresses provided' }

//   const query = addresses.join(',')
//   return callEdge<BirdeyeMultiPriceResponse>(
//     `/multi_price?addresses=${encodeURIComponent(query)}`,
//     { bypassCache }
//   )
// }

/**
 * Fetch price data for a single SPL token mint address.
 */
export async function fetchSinglePrice(
  address:      string,
  bypassCache = false
): Promise<BirdeyeSinglePriceResponse> {
  return callEdge<BirdeyeSinglePriceResponse>(
    `/price?address=${encodeURIComponent(address)}`,
    { bypassCache }
  )
}

/**
 * Fetch OHLCV candlestick data.
 *
 * @param address    SPL token mint address
 * @param type       Birdeye interval string: '1m' | '5m' | '30m' | '4H' | '1D'
 * @param timeFrom   Unix timestamp (seconds)
 * @param timeTo     Unix timestamp (seconds)
 */
export interface BirdeyeOHLCVItem {
  unixTime: number
  open:     number
  high:     number
  low:      number
  close:    number
  volume:   number
}

export interface BirdeyeOHLCVResponse {
  data:  { items: BirdeyeOHLCVItem[] } | null
  error: string | null
}

export async function fetchOHLCV(
  address:  string,
  type:     string,
  timeFrom: number,
  timeTo:   number,
  bypassCache = false
): Promise<BirdeyeOHLCVResponse> {
  const params = new URLSearchParams({
    address,
    type,
    time_from: String(timeFrom),
    time_to:   String(timeTo),
  })
  return callEdge<BirdeyeOHLCVResponse>(
    `/ohlcv?${params.toString()}`,
    { bypassCache }
  )
}

/**
 * Fetch wallet token balances.
 */
export interface BirdeyeTokenBalance {
  address:         string
  symbol:          string
  name:            string
  logoURI?:        string
  uiAmount:        number
  valueUsd:        number
  priceUsd:        number
  priceChange24h?: number
}

export interface BirdeyeWalletTokenListResponse {
  data:  { items: BirdeyeTokenBalance[] } | null
  error: string | null
}

export async function fetchWalletTokenList(
  walletAddress: string
): Promise<BirdeyeWalletTokenListResponse> {
  return callEdge<BirdeyeWalletTokenListResponse>(
    `/wallet/token_list?wallet=${encodeURIComponent(walletAddress)}`,
    { bypassCache: true } // always fresh for portfolio views
  )
}

/**
 * Fetch wallet transaction history.
 */
export interface BirdeyeWalletTx {
  txHash:    string
  blockTime: number
  status:    'Success' | 'Fail'
  from:      { symbol: string; uiAmount: number; address: string }
  to:        { symbol: string; uiAmount: number; address: string }
}

export interface BirdeyeWalletTxListResponse {
  data:  { transactions: BirdeyeWalletTx[] } | null
  error: string | null
}

export async function fetchWalletTxList(
  walletAddress: string,
  limit = 10
): Promise<BirdeyeWalletTxListResponse> {
  return callEdge<BirdeyeWalletTxListResponse>(
    `/wallet/transaction_list?wallet=${encodeURIComponent(walletAddress)}&limit=${limit}`,
    { bypassCache: true }
  )
}