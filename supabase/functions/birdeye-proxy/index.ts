/**
 * ================================================================
 * BIRDEYE PROXY — Supabase Edge Function
 * ================================================================
 *
 * Purpose:
 *   Secure server-side proxy for the Birdeye API.
 *   Injects BIRDEYE_API_KEY from Deno.env so the key is NEVER
 *   exposed to the browser or bundled into client code.
 *
 * Supported endpoints (via ?endpoint= query param):
 *
 *   multi_price  → GET /defi/multi_price?list_address=A,B,C
 *   price        → GET /defi/price?address=A&include_24h_change=true
 *   ohlcv        → GET /v3/token/ohlcv?address=A&type=1H&limit=100
 *   trending     → GET /defi/token_trending?sort_by=volume&limit=20
 *   security     → GET /defi/token_security?address=A
 *   wallet_tokens→ GET /v1/wallet/token_list?wallet=A
 *   wallet_txs   → GET /v1/wallet/transaction_list?wallet=A&limit=10
 *
 * Required Supabase Secret:
 *   BIRDEYE_API_KEY — set via: supabase secrets set BIRDEYE_API_KEY=<key>
 *
 * Architecture notes:
 *   • This function validates inputs and normalises errors.
 *   • It does NOT store or log API keys.
 *   • Responses are passed through without modification so the
 *     frontend lib (edgeFunctions.ts) owns the normalisation layer.
 *   • Future: add server-side Redis caching here to reduce Birdeye
 *     quota usage and improve latency.
 * ================================================================
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

const BIRDEYE_BASE = 'https://public-api.birdeye.so'

/** Map endpoint names to their Birdeye API paths */
const ENDPOINT_MAP: Record<string, string> = {
  multi_price:   '/defi/multi_price',
  price:         '/defi/price',
  ohlcv:         '/v3/token/ohlcv',
  trending:      '/defi/token_trending',
  security:      '/defi/token_security',
  wallet_tokens: '/v1/wallet/token_list',
  wallet_txs:    '/v1/wallet/transaction_list',
}

Deno.serve(async (req: Request) => {
  // ── CORS preflight ──────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Validate API key ────────────────────────────────────────
  const apiKey = Deno.env.get('BIRDEYE_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'BIRDEYE_API_KEY is not configured. Add it via Supabase secrets.',
      }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Parse query params ──────────────────────────────────────
  const url      = new URL(req.url)
  const endpoint = url.searchParams.get('endpoint') ?? ''

  const birdeyePath = ENDPOINT_MAP[endpoint]
  if (!birdeyePath) {
    return new Response(
      JSON.stringify({
        error: `Unknown endpoint "${endpoint}". Valid options: ${Object.keys(ENDPOINT_MAP).join(', ')}`,
      }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Build upstream URL ──────────────────────────────────────
  // Forward all query params except "endpoint" to Birdeye.
  const upstream = new URL(`${BIRDEYE_BASE}${birdeyePath}`)
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'endpoint') continue
    upstream.searchParams.set(key, value)
  }

  // Special param mappings for specific endpoints
  if (endpoint === 'multi_price') {
    const addresses = url.searchParams.get('addresses') ?? ''
    upstream.searchParams.set('list_address', addresses)
    upstream.searchParams.delete('addresses')
  }

  if (endpoint === 'ohlcv') {
    // Birdeye v3 OHLCV uses "type" not "timeframe"
    const timeframe = url.searchParams.get('timeframe')
    if (timeframe) {
      upstream.searchParams.set('type', timeframe)
      upstream.searchParams.delete('timeframe')
    }
  }

  if (endpoint === 'trending') {
    if (!upstream.searchParams.has('sort_by'))   upstream.searchParams.set('sort_by', 'volume24hUSD')
    if (!upstream.searchParams.has('sort_type')) upstream.searchParams.set('sort_type', 'desc')
  }

  // ── Call Birdeye ────────────────────────────────────────────
  try {
    const birdeyeRes = await fetch(upstream.toString(), {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Accept':    'application/json',
        'x-chain':   'solana',
      },
      signal: AbortSignal.timeout(10_000),
    })

    const responseText = await birdeyeRes.text()

    if (!birdeyeRes.ok) {
      return new Response(
        JSON.stringify({
          error:    `Birdeye API returned HTTP ${birdeyeRes.status}`,
          endpoint,
          upstream: upstream.pathname,
        }),
        {
          status: birdeyeRes.status,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        }
      )
    }

    // Pass through the raw Birdeye response
    return new Response(responseText, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        // Allow the client-side cache to use this for 15 seconds
        'Cache-Control': 'public, max-age=15',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `Birdeye proxy error: ${message}` }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
