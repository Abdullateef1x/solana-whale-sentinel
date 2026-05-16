/**
 * ================================================================
 * QUICKNODE RPC PROXY — Supabase Edge Function
 * ================================================================
 *
 * Purpose:
 *   Secure server-side proxy for QuickNode Solana RPC.
 *   Injects QUICKNODE_RPC_URL from Deno.env so the authenticated
 *   endpoint URL is NEVER exposed to the browser.
 *
 * Usage:
 *   POST /functions/v1/quicknode-rpc
 *   Body: { method: string, params: unknown[] }
 *
 * Supported JSON-RPC methods (subset):
 *   getBalance, getTransaction, getSignaturesForAddress,
 *   getAccountInfo, getProgramAccounts, getSlot, getBlockTime,
 *   getRecentBlockhash, simulateTransaction
 *
 * Required Supabase Secret:
 *   QUICKNODE_RPC_URL — authenticated QuickNode HTTP endpoint
 *   Set via: supabase secrets set QUICKNODE_RPC_URL=https://...
 *
 * Architecture notes:
 *   • This is a JSON-RPC pass-through with method allowlisting.
 *   • The allowlist prevents arbitrary contract calls.
 *   • Future: add per-IP rate limiting and caching for read methods.
 *   • WebSocket streaming (onLogs, onAccountChange) is handled by
 *     a separate quicknode-ws Edge Function in Phase 4.
 * ================================================================
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/**
 * Allowlisted read-only JSON-RPC methods.
 * Only these are forwarded to prevent abuse.
 */
const ALLOWED_METHODS = new Set([
  'getBalance',
  'getTransaction',
  'getSignaturesForAddress',
  'getSignatureStatuses',
  'getAccountInfo',
  'getMultipleAccounts',
  'getProgramAccounts',
  'getSlot',
  'getBlockTime',
  'getEpochInfo',
  'getVersion',
  'getRecentBlockhash',
  'getLatestBlockhash',
  'simulateTransaction',
  'getTokenAccountsByOwner',
  'getTokenLargestAccounts',
  'getTokenSupply',
  'getLargestAccounts',
])

Deno.serve(async (req: Request) => {
  // ── CORS preflight ──────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed — use POST' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Validate RPC URL ────────────────────────────────────────
  const rpcUrl = Deno.env.get('QUICKNODE_RPC_URL')
  if (!rpcUrl) {
    return new Response(
      JSON.stringify({
        error: 'QUICKNODE_RPC_URL is not configured. Add it via Supabase secrets.',
      }),
      { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Parse request body ──────────────────────────────────────
  let method: string
  let params: unknown[]

  try {
    const body = await req.json()
    method = body.method
    params = body.params ?? []
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Method allowlist check ──────────────────────────────────
  if (!ALLOWED_METHODS.has(method)) {
    return new Response(
      JSON.stringify({
        error: `RPC method "${method}" is not allowlisted.`,
        allowed: [...ALLOWED_METHODS],
      }),
      { status: 403, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }

  // ── Forward to QuickNode ────────────────────────────────────
  try {
    const rpcPayload = {
      jsonrpc: '2.0',
      id:      1,
      method,
      params,
    }

    const rpcRes = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(rpcPayload),
      signal: AbortSignal.timeout(10_000),
    })

    const responseText = await rpcRes.text()

    if (!rpcRes.ok) {
      return new Response(
        JSON.stringify({ error: `QuickNode returned HTTP ${rpcRes.status}` }),
        { status: rpcRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(responseText, {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: `QuickNode proxy error: ${message}` }),
      { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})
