console.log('[config] SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
/**
 * ================================================================
 * SOLANA WHALE INTELLIGENCE TERMINAL — CLIENT CONFIG
 * ================================================================
 *
 * SECURITY ARCHITECTURE
 * ─────────────────────
 * This file contains ONLY public, client-safe configuration.
 *
 * Secrets handled server-side (Supabase Edge Functions):
 *   • BIRDEYE_API_KEY   → birdeye-proxy Edge Function
 *   • QUICKNODE_RPC_URL → quicknode-rpc  Edge Function
 *   • QUICKNODE_WSS_URL → quicknode-ws   Edge Function
 *
 * The frontend NEVER receives these values. All authenticated
 * API calls flow through the Edge Function layer, which:
 *   1. Injects secrets from Deno.env at request time
 *   2. Validates + normalises the response
 *   3. Returns a sanitised JSON payload to the client
 *
 * ================================================================
 */

// ── Supabase (public keys — safe in browser bundle) ─────────────
export const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '[config] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Add both to your .env file and restart the dev server.'
  )
}

// ── Edge Function base URL ───────────────────────────────────────
// Derives from VITE_SUPABASE_URL — no extra env var needed.
// All authenticated external API calls (Birdeye, QuickNode) target
// Edge Functions at this base path.
export const EDGE_FN_BASE = `${SUPABASE_URL}/functions/v1`

/**
 * Build a full URL for a named Supabase Edge Function.
 *
 * Usage:
 *   edgeFn('birdeye-proxy', '/price?address=So11...')
 *   → https://<project>.supabase.co/functions/v1/birdeye-proxy/price?address=So11...
 */
export function edgeFn(name: string, path = ''): string {
  return `${EDGE_FN_BASE}/${name}${path}`
}

/**
 * Standard headers for every Edge Function request.
 * Supabase requires the anon key on all function calls.
 * Pass an accessToken for authenticated (logged-in user) requests.
 */
export function edgeHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey':       SUPABASE_ANON_KEY,
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  return headers
}

// ── Tracked Solana tokens ────────────────────────────────────────
// Shared constant used across hooks and components.
// Edge Functions maintain their own copy (Deno import rules).
export const TRACKED_TOKENS = [
  { symbol: 'SOL',  address: 'So11111111111111111111111111111111111111112'   },
  { symbol: 'JUP',  address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
  { symbol: 'WIF',  address: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' },
  { symbol: 'RAY',  address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' },
] as const

// ── Conservative static fallbacks ───────────────────────────────
// Used ONLY when the Edge Function and Birdeye are both unreachable.
// The UI should display a visible "FALLBACK DATA" indicator whenever
// these values are active so the user is never misled.
export const FALLBACK_PRICES: Record<string, { price: number; mcap: number; vol: number }> = {
  SOL:  { price: 158.00,    mcap: 73_000_000_000, vol: 2_800_000_000 },
  JUP:  { price: 0.84,      mcap: 1_100_000_000,  vol: 180_000_000  },
  BONK: { price: 0.0000245, mcap: 1_800_000_000,  vol: 320_000_000  },
  WIF:  { price: 2.14,      mcap: 2_100_000_000,  vol: 410_000_000  },
  PYTH: { price: 0.38,      mcap: 1_400_000_000,  vol: 95_000_000   },
  RAY:  { price: 2.87,      mcap: 780_000_000,    vol: 62_000_000   },
}

// ── In-memory client cache ───────────────────────────────────────
// Reduces redundant Edge Function calls within the same session.
// Keys are arbitrary strings; TTL is in milliseconds.
const _cache = new Map<string, { data: unknown; ts: number }>()

export function getCached<T>(key: string, ttlMs = 30_000): T | null {
  const entry = _cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttlMs) { _cache.delete(key); return null }
  return entry.data as T
}

export function setCached(key: string, data: unknown): void {
  _cache.set(key, { data, ts: Date.now() })
}

export function bustCache(key: string): void {
  _cache.delete(key)
}