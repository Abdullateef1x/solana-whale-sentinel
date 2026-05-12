const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai'

export const PROXY_API = (url: string) =>
  `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`

export const PROXY_CDN = (url: string) =>
  `${API_BASE_URL}/api/proxy-cdn?url=${encodeURIComponent(url)}`

// Birdeye public API via proxy
export const BIRDEYE_BASE = 'https://public-api.birdeye.so'
export const birdeye = (path: string) => PROXY_API(`${BIRDEYE_BASE}${path}`)

// Solscan for on-chain data
export const SOLSCAN_BASE = 'https://api.solscan.io'
export const solscan = (path: string) => PROXY_API(`${SOLSCAN_BASE}${path}`)

// CoinGecko for broader market data
export const coingecko = (path: string) =>
  PROXY_API(`https://api.coingecko.com/api/v3${path}`)

// Cache helpers
export const cache = new Map<string, { data: unknown; ts: number }>()

export function getCached<T>(key: string, ttlMs = 30_000): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) { cache.delete(key); return null }
  return entry.data as T
}

export function setCached(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() })
}
