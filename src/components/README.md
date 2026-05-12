# 🐋 WhaleWatch — Solana Frontier Hackathon

> Real-time on-chain whale signal detection with a Bloomberg-grade trading terminal UI.

---

## Overview

WhaleWatch monitors Solana DEX activity in real time, surfaces large-wallet ("whale") swap events, and presents them inside a dense, data-rich trading terminal. It was built during the **Solana Frontier Hackathon** by combining two complementary layers:

| Layer | Origin | Role |
|---|---|---|
| Terminal UI | Architected on **Eitherway** | Bloomberg-style React/Tailwind dashboard |
| On-chain & market data | Custom logic | Deep partner integrations (Birdeye · QuickNode · Solflare) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser / Client                      │
│                                                         │
│  ┌──────────────┐   ┌──────────────┐  ┌─────────────┐  │
│  │ PriceChart   │   │ useMarketData│  │ Signal Feed │  │
│  │ (real OHLCV) │   │ (live prices)│  │ (WebSocket) │  │
│  └──────┬───────┘   └──────┬───────┘  └──────┬──────┘  │
└─────────┼──────────────────┼─────────────────┼─────────┘
          │                  │                 │
          ▼                  ▼                 ▼
   Birdeye /defi/ohlcv  Birdeye /defi/   Backend API
                        multi_price      (Express + Socket.IO)
                                              │
                              ┌───────────────┼───────────────┐
                              ▼               ▼               ▼
                         QuickNode        QuickNode       Telegram
                         WebSocket        RPC Pool         Alerts
                         (onLogs)      (tx fetch + retry)
```

### Key services

#### Birdeye (market data partner)
- **`/defi/multi_price`** — batch token price + 24 h change + volume for SOL, JUP, BONK, WIF, PYTH, RAY
- **`/defi/price`** — single-token price used for the SOL market overview strip
- **`/defi/ohlcv`** — candlestick data powering `PriceChart`; time resolution adapts to the selected range (1 m → 1 D)

#### QuickNode (RPC partner)
- **Stable WebSocket connection** (`streamConnection`) — dedicated to `onLogs` subscriptions across all tracked DEX programs; never rotated
- **Rotating RPC pool** (`fetchConnection`) — used exclusively for `getParsedTransaction`; auto-rotates on timeout to maintain liveness

#### Solflare (wallet partner)
- Wallet adapter integration for transaction signing and portfolio context

---

## Real-data strategy

### `useMarketData.ts`
The hook was refactored from a `Math.random()` random-walk simulation to a **two-tier live data pipeline**:

1. **Primary** — Birdeye `multi_price` endpoint polled every 15 s for low-latency price ticks; full refresh every 60 s
2. **Fallback** — conservative static prices used only when Birdeye is unreachable; *never cached*, so the next poll retries the live feed immediately

### `PriceChart.tsx`
The chart was refactored from procedurally-generated candles to **real Birdeye OHLCV data**:

- Each time-range button maps to a Birdeye `type` param (`1m`, `5m`, `30m`, `4H`, `1D`) and a lookback window
- The last bar is refreshed live every 15 s via a lightweight poll, replacing the old random perturbation loop
- Graceful error state with a one-click retry; stale candles remain visible during background refreshes

### `stream.service.ts` (backend)
- Subscribes to 5 major DEX programs (Jupiter v4/v6, Raydium, Orca, Serum)
- Filters swaps above a **200 SOL whale threshold**
- Queues transactions outside the WebSocket callback to prevent blocking
- Sends classified signals (`WHALE_BUY` / `WHALE_SELL`) over Socket.IO to the frontend and via Telegram

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in:
#   QUICKNODE_API_URL=
#   QUICKNODE_WSS_URL=
#   BIRDEYE_API_KEY=
#   TELEGRAM_BOT_TOKEN=
#   TELEGRAM_CHAT_ID=

# 3. Start backend
npm run dev:server

# 4. Start frontend
npm run dev
```

---

## Partner integrations

| Partner | Integration type | Where |
|---|---|---|
| **Birdeye** | REST API (market data, OHLCV) | `useMarketData.ts`, `PriceChart.tsx` |
| **QuickNode** | WebSocket + RPC | `stream.service.ts` |
| **Solflare** | Wallet adapter | `WalletProvider`, transaction signing |

---

## Project structure

```
src/
├── components/
│   └── PriceChart.tsx        # Real OHLCV chart (Birdeye)
├── hooks/
│   └── useMarketData.ts      # Live token prices (Birdeye)
├── services/
│   ├── stream.service.ts     # QuickNode WebSocket listener
│   ├── signal.service.ts     # Whale signal classifier
│   └── alert.service.ts      # Telegram alerts
├── config/
│   └── index.ts              # API helpers (birdeye(), coingecko(), getCached()…)
└── types/
    └── index.ts              # Token, MarketOverview, ChartCandle, TimeRange
```

---

## Built with

- **Vite + React + TypeScript** — frontend toolchain
- **Tailwind CSS** — utility-first styling (terminal theme)
- **Eitherway** — initial UI scaffolding and component architecture
- **Birdeye API** — on-chain market data
- **QuickNode** — Solana RPC & WebSocket infrastructure  
- **Solflare** — wallet connectivity
- **Socket.IO** — real-time signal push to browser
- **Telegram Bot API** — whale alert notifications

---

*Submitted to Solana Frontier Hackathon · May 2026*
