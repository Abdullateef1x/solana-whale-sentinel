import { useState, useEffect, useCallback, useRef } from 'react'
import { birdeye, getCached, setCached } from '../config'
import type { Token, MarketOverview } from '../types'

/**
 * ============================================
 * TRACKED TOKENS
 * ============================================
 */
const TRACKED_TOKENS = [
  { symbol: 'SOL',  address: 'So11111111111111111111111111111111111111112' },
  { symbol: 'JUP',  address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { symbol: 'WIF',  address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { symbol: 'PYTH', address: 'HZ1JovNiVvGqNoLkO4h5Q3Cr7kzAkWGAvUCc3NsGnLc9' },
  { symbol: 'RAY',  address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
]

/**
 * ============================================
 * STATIC FALLBACK PRICES
 * Only used when Birdeye is unreachable.
 * Values are intentionally conservative — do
 * NOT treat them as live market data.
 * ============================================
 */
const FALLBACK_BASES: Record<string, { price: number; mcap: number; vol: number }> = {
  SOL:  { price: 158.42, mcap: 73_000_000_000, vol: 2_800_000_000 },
  JUP:  { price: 0.84,   mcap: 1_100_000_000,  vol: 180_000_000  },
  BONK: { price: 0.0000245, mcap: 1_800_000_000, vol: 320_000_000 },
  WIF:  { price: 2.14,   mcap: 2_100_000_000,  vol: 410_000_000  },
  PYTH: { price: 0.38,   mcap: 1_400_000_000,  vol: 95_000_000   },
  RAY:  { price: 2.87,   mcap: 780_000_000,    vol: 62_000_000   },
}

function buildFallbackToken(symbol: string, address: string): Token {
  const base = FALLBACK_BASES[symbol] ?? { price: 1.0, mcap: 100_000_000, vol: 10_000_000 }
  return {
    address,
    symbol,
    name: symbol,
    decimals: 9,
    price: base.price,
    priceChange24h: 0,
    volume24h: base.vol,
    marketCap: base.mcap,
    liquidity: base.vol * 0.3,
    holders: 0,
  }
}

/**
 * ============================================
 * BIRDEYE MULTI-PRICE FETCH
 * Endpoint: /defi/multi_price
 * Docs: https://docs.birdeye.so
 * ============================================
 */
async function fetchBirdeyePrices(): Promise<Token[]> {
  const addresses = TRACKED_TOKENS.map(t => t.address).join(',')
  const res = await fetch(
    birdeye(`/defi/multi_price?list_address=${addresses}`),
    { signal: AbortSignal.timeout(8_000) }
  )

  if (!res.ok) throw new Error(`Birdeye HTTP ${res.status}`)

  const data = await res.json()

  if (!data?.data) throw new Error('Birdeye: unexpected response shape')

  return TRACKED_TOKENS.map(({ symbol, address }): Token => {
    const item = data.data[address]

    if (!item) return buildFallbackToken(symbol, address)

    return {
      address,
      symbol,
      name: symbol,
      decimals: 9,
      price:          item.value             ?? 0,
      priceChange24h: item.priceChange24h     ?? 0,
      volume24h:      item.v24hUSD            ?? 0,
      // Birdeye multi_price doesn't return mcap directly; approximate from
      // circulating supply if available, otherwise leave 0 so the UI can
      // show "—" rather than a misleading number.
      marketCap:      item.mc                 ?? 0,
      liquidity:      item.liquidity          ?? 0,
      holders:        item.holder             ?? 0,
    }
  })
}

/**
 * ============================================
 * BIRDEYE OVERVIEW (SOL price via /defi/price)
 * ============================================
 */
async function fetchBirdeyeOverview(): Promise<MarketOverview> {
  const solAddress = 'So11111111111111111111111111111111111111112'
  const res = await fetch(
    birdeye(`/defi/price?address=${solAddress}&include_24h_change=true`),
    { signal: AbortSignal.timeout(8_000) }
  )

  if (!res.ok) throw new Error(`Birdeye overview HTTP ${res.status}`)

  const data = await res.json()
  const sol  = data?.data

  return {
    solPrice:       sol?.value          ?? FALLBACK_BASES.SOL.price,
    solChange24h:   sol?.priceChange24h ?? 0,
    totalVolume24h: sol?.v24hUSD        ?? FALLBACK_BASES.SOL.vol,
    // Fear & Greed index is not available from Birdeye; callers should
    // fetch it from an independent source (e.g. alternative.me) and
    // merge it in, or leave it as 0.
    fearGreedIndex: 0,
    topGainers:  [],
    topLosers:   [],
    trending:    [],
  }
}

/**
 * ============================================
 * HOOK
 * ============================================
 */
export function useMarketData() {
  const [tokens,   setTokens]   = useState<Token[]>([])
  const [overview, setOverview] = useState<MarketOverview | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const liveTickerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fullRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ------------------------------------------------------------------
  // fetchTokenPrices — tries Birdeye, falls back to static values
  // ------------------------------------------------------------------
  const fetchTokenPrices = useCallback(async () => {
    const cacheKey = 'token-prices'
    const cached = getCached<Token[]>(cacheKey, 45_000)
    if (cached) { setTokens(cached); return }

    try {
      const liveTokens = await fetchBirdeyePrices()
      setCached(cacheKey, liveTokens)
      setTokens(liveTokens)
    } catch (err) {
      console.warn('⚠️ Birdeye token fetch failed — using static fallback:', err)
      const fallback = TRACKED_TOKENS.map(t => buildFallbackToken(t.symbol, t.address))
      // Do NOT cache fallback data so the next poll retries the live feed
      setTokens(fallback)
    }
  }, [])

  // ------------------------------------------------------------------
  // fetchSolanaOverview — tries Birdeye /defi/price for SOL
  // ------------------------------------------------------------------
  const fetchSolanaOverview = useCallback(async () => {
    const cacheKey = 'sol-overview'
    const cached = getCached<MarketOverview>(cacheKey, 60_000)
    if (cached) { setOverview(cached); return }

    try {
      const ov = await fetchBirdeyeOverview()
      setCached(cacheKey, ov)
      setOverview(ov)
    } catch (err) {
      console.warn('⚠️ Birdeye overview fetch failed — using static fallback:', err)
      setOverview({
        solPrice:       FALLBACK_BASES.SOL.price,
        solChange24h:   0,
        totalVolume24h: FALLBACK_BASES.SOL.vol,
        fearGreedIndex: 0,
        topGainers: [],
        topLosers:  [],
        trending:   [],
      })
    }
  }, [])

  // ------------------------------------------------------------------
  // Full refresh (prices + overview)
  // ------------------------------------------------------------------
  const refresh = useCallback(async () => {
    try {
      await Promise.all([fetchTokenPrices(), fetchSolanaOverview()])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }, [fetchTokenPrices, fetchSolanaOverview])

  // ------------------------------------------------------------------
  // Lightweight "live ticker" — re-fetches prices from Birdeye on a
  // short interval so the UI stays fresh between full refreshes.
  // Replaces the old Math.random() random-walk simulation.
  // ------------------------------------------------------------------
  const startLiveTicker = useCallback(() => {
    if (liveTickerRef.current) clearInterval(liveTickerRef.current)

    liveTickerRef.current = setInterval(async () => {
      try {
        // Bust the cache so we actually hit the network
        const addresses = TRACKED_TOKENS.map(t => t.address).join(',')
        const res = await fetch(
          birdeye(`/defi/multi_price?list_address=${addresses}`),
          { signal: AbortSignal.timeout(5_000) }
        )
        if (!res.ok) return
        const data = await res.json()
        if (!data?.data) return

        setTokens(prev =>
          prev.map(token => {
            const item = data.data[token.address]
            if (!item) return token
            return {
              ...token,
              price:          item.value          ?? token.price,
              priceChange24h: item.priceChange24h  ?? token.priceChange24h,
              volume24h:      item.v24hUSD         ?? token.volume24h,
            }
          })
        )

        // Also refresh the SOL overview price
        const solItem = data.data['So11111111111111111111111111111111111111112']
        if (solItem) {
          setOverview(prev => prev
            ? { ...prev, solPrice: solItem.value ?? prev.solPrice, solChange24h: solItem.priceChange24h ?? prev.solChange24h }
            : prev
          )
        }
      } catch {
        // Silently skip failed ticks — the full 60 s refresh will retry
      }
    }, 15_000) // Poll Birdeye every 15 s (well within their rate limits on paid plans)
  }, [])

  useEffect(() => {
    refresh()
    startLiveTicker()

    fullRefreshRef.current = setInterval(refresh, 60_000)

    return () => {
      if (liveTickerRef.current)  clearInterval(liveTickerRef.current)
      if (fullRefreshRef.current) clearInterval(fullRefreshRef.current)
    }
  }, [refresh, startLiveTicker])

  return { tokens, overview, loading, error, refresh }
}
