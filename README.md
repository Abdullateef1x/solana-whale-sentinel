# 🐋 Solana Whale Sentinel

Real-time Solana whale intelligence terminal built for active traders, analysts, and on-chain researchers.

Solana Whale Sentinel combines live whale transaction monitoring, smart money analytics, token safety scoring, and institutional-grade market visualization into a Bloomberg/TradingView-style interface powered by Birdeye, QuickNode, and Supabase Edge Functions.

Built for **Birdeye Data BIP Competition — Sprint 4 (May 9 – May 16, 2026).**

---

# ✨ What Makes This Different?

Most crypto dashboards only display price data.

Solana Whale Sentinel focuses on **actionable on-chain intelligence**:

- Detects large whale accumulation/distribution in real time  
- Streams live Solana transactions via QuickNode WebSockets  
- Adds Birdeye-powered token safety scoring  
- Provides institutional-grade trading intelligence panels  
- Uses secure server-side API routing (no exposed keys)

---

# 🖥 Dashboard Features

## 📈 Real-Time Market Intelligence
- Live Solana market tracking  
- Trending token analytics  
- Whale flow monitoring  
- Smart money tracking  
- Market momentum analysis  

---

## 🐋 Whale Monitoring Engine
- Real-time whale transaction parsing  
- Large transaction detection  
- Buy/sell sentiment tracking  
- High-value alerts  
- Multi-panel whale feed  

---

## 🛡 Token Safety Analysis (Birdeye)

- Mint authority detection  
- Creator concentration analysis  
- Liquidity visibility  
- Rug-risk indicators  
- Automated safety score badges  

---

## 📊 Institutional Trading UI

- Bloomberg-style terminal layout  
- TradingView-inspired charts  
- High-density analytics panels  
- Dark fintech UI aesthetic  
- Responsive dashboard system  

---

## 🔌 Solflare Wallet Integration

- Wallet-first onboarding  
- Transaction signing support  
- Persistent sessions  
- Live account state updates  

---

# ⚡ Architecture Overview


QuickNode WebSocket Stream
↓
Solana onLogs Events
↓
Whale Signal Engine
↓
Supabase Edge Functions
↓
Birdeye Market APIs
↓
React Trading Terminal UI


---

# 🧠 Core Infrastructure

## 1. Birdeye Data Layer

Securely proxied via Supabase Edge Functions.

### Endpoints Used
- `GET /v2/token/ohlcv`
  - Candlestick charts
  - Multi-timeframe visualization (1H, 4H, 1D, 7D)

- `GET /defi/token_trending`
  - Market momentum tracking  
  - Trending tokens feed  

- `GET /defi/token_security`
  - Token safety scoring  
  - Risk analysis & validation  

---

## 2. QuickNode Streaming Engine

- WebSocket-based Solana event streaming  
- `onLogs` subscription processing  
- Real-time whale detection system  
- DEX activity monitoring (Jupiter, Raydium)  

---

## 3. Secure Backend Architecture

- All API keys remain server-side  
- Frontend acts as **data consumer only**  
- Supabase Edge Functions handle all external calls  

### Supports:
- Rate limiting  
- Caching  
- API rotation  
- Secure websocket relays  

---

# 🛠 Tech Stack

## Frontend
- React  
- TypeScript  
- Vite  
- Tailwind CSS  

## Blockchain / Data
- Solana Web3.js  
- QuickNode RPC + WebSockets  
- Birdeye API  

## Backend
- Supabase  
- Edge Functions (Deno runtime)  

## Visualization
- lightweight-charts  

---

# 📂 Project Structure


src/
├── components/
├── hooks/
├── lib/
├── types/
├── config.ts
├── App.tsx
└── main.tsx

supabase/
└── functions/
├── birdeye-proxy/
└── quicknode-rpc/


---

# 🚀 Local Development Setup

## 1. Clone Repo
```bash
git clone https://github.com/your-username/solana-whale-sentinel.git
cd solana-whale-sentinel
```

## 2. Install Dependencies
```bash
npm install
```
## 3. Environment Variables
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Supabase Secrets (Server-side)
```bash
BIRDEYE_API_KEY=your_birdeye_api_key
QUICKNODE_RPC_URL=your_rpc_url
QUICKNODE_WSS_URL=your_wss_url
```

## 5. Run Dev Server
```bash
npm run dev
```

Open:

```bash
http://localhost:5173
```

---

# 📡 Live Data Flow
Market Data
Birdeye → Edge Functions → UI
Whale Events
QuickNode → Signal Engine → Whale Feed
Token Security
Birdeye Security API → Risk Engine → UI Badges
---
# 📊 Key Panels

| Panel      | Purpose                          |
|------------|----------------------------------|
| Overview   | Market snapshot + sentiment      |
| Chart      | SOL candlestick visualization    |
| Whales     | Whale transaction feed          |
| Signals    | Smart money detection           |
| Analytics  | Market metrics                  |
| Portfolio  | Wallet tracking                 |
| Alerts     | Whale notifications             |
---

# 🔒 Production Design Goals
Real-time responsiveness
Secure API architecture
Institutional-grade UI
Typed data pipelines
Scalable websocket system
Maintainable React structure
---

# 🏆 Competition Alignment
Utility (30%)

Transforms raw blockchain data into actionable trading intelligence.

Technical Depth (25%)
WebSocket streaming
Multi-source aggregation
Secure backend proxy architecture
Presentation (15%)

Bloomberg-style institutional trading interface.

# 👨‍💻 Author

Built by Kehinde Alao
For Birdeye Data BIP Competition