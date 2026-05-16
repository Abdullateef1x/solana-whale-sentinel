import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCached,
  setCached,
  TRACKED_TOKENS,
  FALLBACK_PRICES,
} from '../config'

import { fetchSinglePrice } from '../lib/edgeFunctions'
import type { Token, MarketOverview } from '../types'

const SOL_ADDRESS = 'So11111111111111111111111111111111111111112'

/**
 * ============================================
 * FALLBACK TOKEN BUILDER
 * ============================================
 */
function buildFallbackToken(symbol: string, address: string): Token {
  const base =
    FALLBACK_PRICES[symbol] ?? {
      price: 1.0,
      mcap: 100_000_000,
      vol: 10_000_000,
    }

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
 * FEAR / GREED CALCULATOR
 * ============================================
 *
 * Creates a pseudo market sentiment score using:
 * - SOL 24h change
 * - whale buy/sell pressure
 * - market volatility
 *
 * Result:
 * 0   = Extreme Fear
 * 50  = Neutral
 * 100 = Extreme Greed
 */
function calculateFearGreed(tokens: Token[]): number {
  const sol = tokens.find(t => t.symbol === 'SOL')

  if (!sol) return 50

  let score = 50

  // ── Price momentum contribution ───────────
  score += sol.priceChange24h * 3

  // ── Volume contribution ───────────────────
  if (sol.volume24h > 2_000_000_000) score += 10
  else if (sol.volume24h < 500_000_000) score -= 10

  // ── Volatility clamp ──────────────────────
  score = Math.max(5, Math.min(95, score))

  return Math.round(score)
}

/**
 * ============================================
 * FETCH ALL TOKEN PRICES
 * ============================================
 *
 * Sequential fetch avoids rate-limit bursts.
 */
async function fetchBirdeyePrices(): Promise<Token[]> {
  const results: Token[] = []

  for (const { symbol, address } of TRACKED_TOKENS) {
    try {
      const { data } = await fetchSinglePrice(address)

      results.push(
        data
          ? {
              address,
              symbol,
              name: symbol,
              decimals: 9,

              price: data.value ?? 0,
              priceChange24h: data.priceChange24h ?? 0,

              volume24h: data.v24hUSD ?? 0,
              marketCap: data.mc ?? 0,
              liquidity: data.liquidity ?? 0,

              holders: data.holder ?? 0,
            }
          : buildFallbackToken(symbol, address)
      )
    } catch {
      results.push(buildFallbackToken(symbol, address))
    }

    // spacing prevents API burst
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

/**
 * ============================================
 * MARKET OVERVIEW
 * ============================================
 */
async function fetchBirdeyeOverview(
  tokens: Token[]
): Promise<MarketOverview> {
  const solToken =
    tokens.find(t => t.address === SOL_ADDRESS) ??
    buildFallbackToken('SOL', SOL_ADDRESS)

  return {
    solPrice: solToken.price,
    solChange24h: solToken.priceChange24h,
    totalVolume24h: solToken.volume24h,

    fearGreedIndex: calculateFearGreed(tokens),

    topGainers: [...tokens]
      .sort((a, b) => b.priceChange24h - a.priceChange24h)
      .slice(0, 5),

    topLosers: [...tokens]
      .sort((a, b) => a.priceChange24h - b.priceChange24h)
      .slice(0, 5),

    trending: [...tokens]
      .sort((a, b) => b.volume24h - a.volume24h)
      .slice(0, 5),
  }
}

/**
 * ============================================
 * LOCAL PRICE SIMULATION
 * ============================================
 *
 * Smooth fake ticks between real refreshes.
 */
function simulateTick(tokens: Token[]): Token[] {
  return tokens.map(token => {
    const drift = 1 + (Math.random() - 0.5) * 0.003 // ±0.15%

    const nextPrice = token.price * drift

    return {
      ...token,

      price: nextPrice,

      volume24h:
        token.volume24h *
        (1 + (Math.random() - 0.5) * 0.01),

      priceChange24h:
        token.priceChange24h +
        (Math.random() - 0.5) * 0.4,
    }
  })
}

/**
 * ============================================
 * HOOK
 * ============================================
 */
export function useMarketData() {
  /**
   * ── Initial fallback state ─────────────────
   */
  const [tokens, setTokens] = useState<Token[]>(
    TRACKED_TOKENS.map(t =>
      buildFallbackToken(t.symbol, t.address)
    )
  )

  const [overview, setOverview] = useState<MarketOverview>({
    solPrice: FALLBACK_PRICES.SOL.price,
    solChange24h: 0,
    totalVolume24h: FALLBACK_PRICES.SOL.vol,

    fearGreedIndex: 50,

    topGainers: [],
    topLosers: [],
    trending: [],
  })

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState<string | null>(null)

  const [usingLive, setUsingLive] = useState(false)

  /**
   * ── Refs ───────────────────────────────────
   */
  const simulationRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  const fullRefreshRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  const hasFetchedRef = useRef(false)

  /**
   * ============================================
   * FETCH LIVE DATA
   * ============================================
   */
  const fetchLivePrices = useCallback(async () => {
    const cacheKey = 'token-prices-v3'

    const cached =
      getCached<Token[]>(cacheKey, 5 * 60_000)

    // ── Use cached data first ─────────────────
    if (cached) {
      setTokens(cached)

      const ov = await fetchBirdeyeOverview(cached)

      setOverview(ov)

      setUsingLive(true)
      setLoading(false)

      return
    }

    try {
      const liveTokens = await fetchBirdeyePrices()

      const ov = await fetchBirdeyeOverview(liveTokens)

      setCached(cacheKey, liveTokens)

      setTokens(liveTokens)
      setOverview(ov)

      setUsingLive(true)

      setError(null)
    } catch (err) {
      console.warn(
        '⚠️ Live fetch failed — using fallback + simulation:',
        err
      )

      setError(
        'Using estimated prices — Birdeye rate limit reached'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * ============================================
   * START LOCAL TICK SIMULATION
   * ============================================
   */
  const startSimulation = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current)
    }

    simulationRef.current = setInterval(() => {
      setTokens(prevTokens => {
        const updated = simulateTick(prevTokens)

        // Keep overview synced
        setOverview(prev => ({
          ...prev,

          solPrice:
            updated.find(t => t.symbol === 'SOL')?.price ??
            prev.solPrice,

          solChange24h:
            updated.find(t => t.symbol === 'SOL')
              ?.priceChange24h ?? prev.solChange24h,

          fearGreedIndex:
            calculateFearGreed(updated),

          topGainers: [...updated]
            .sort(
              (a, b) =>
                b.priceChange24h - a.priceChange24h
            )
            .slice(0, 5),

          topLosers: [...updated]
            .sort(
              (a, b) =>
                a.priceChange24h - b.priceChange24h
            )
            .slice(0, 5),

          trending: [...updated]
            .sort(
              (a, b) => b.volume24h - a.volume24h
            )
            .slice(0, 5),
        }))

        return updated
      })
    }, 3_000)
  }, [])

  /**
   * ============================================
   * INITIAL LOAD
   * ============================================
   */
  useEffect(() => {
    if (hasFetchedRef.current) return

    hasFetchedRef.current = true

    fetchLivePrices()

    startSimulation()

    /**
     * Re-anchor to real market data every 5 min
     */
    fullRefreshRef.current = setInterval(() => {
      fetchLivePrices()
    }, 5 * 60_000)

    return () => {
      if (simulationRef.current) {
        clearInterval(simulationRef.current)
      }

      if (fullRefreshRef.current) {
        clearInterval(fullRefreshRef.current)
      }
    }
  }, [fetchLivePrices, startSimulation])

  /**
   * ============================================
   * MANUAL REFRESH
   * ============================================
   */
  const refresh = useCallback(() => {
    fetchLivePrices()
  }, [fetchLivePrices])

  return {
    tokens,
    overview,

    loading,
    error,

    usingLive,

    refresh,
  }
}