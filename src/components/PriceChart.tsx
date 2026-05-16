import React, { useMemo, useState, useEffect } from 'react'
import type { ChartCandle, TimeRange } from '../types'
import { generateCandles } from '../lib/mockData'

interface Props {
  symbol?: string
  basePrice?: number
  height?: number
}

export default function PriceChart({ symbol = 'SOL', basePrice = 158, height = 240 }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1d')
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle')
  const [candles, setCandles] = useState<ChartCandle[]>([])
  const [hovered, setHovered] = useState<ChartCandle | null>(null)
  const [hoveredX, setHoveredX] = useState(0)

  const counts: Record<TimeRange, number> = { '1h': 60, '4h': 96, '1d': 48, '7d': 168, '30d': 180 }

  useEffect(() => {
    setCandles(generateCandles(counts[timeRange], basePrice))
  }, [timeRange, basePrice])

  // Update last candle to simulate live
  useEffect(() => {
    const t = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const noise = (Math.random() - 0.5) * basePrice * 0.003
        return [...prev.slice(0, -1), {
          ...last,
          close: last.close + noise,
          high: Math.max(last.high, last.close + noise),
          low: Math.min(last.low, last.close + noise),
        }]
      })
    }, 3000)
    return () => clearInterval(t)
  }, [basePrice])

  const { minP, maxP, minV, maxV } = useMemo(() => {
    if (!candles.length) return { minP: 0, maxP: 1, minV: 0, maxV: 1 }
    const highs = candles.map(c => c.high)
    const lows = candles.map(c => c.low)
    const vols = candles.map(c => c.volume)
    const pad = (Math.max(...highs) - Math.min(...lows)) * 0.08
    return {
      minP: Math.min(...lows) - pad,
      maxP: Math.max(...highs) + pad,
      minV: 0,
      maxV: Math.max(...vols) * 1.2,
    }
  }, [candles])

  const W = 820
  const chartH = height - 60
  const volH = 40
  const candleW = Math.max(2, Math.floor((W - 40) / candles.length) - 1)

  function priceToY(p: number) {
    return chartH - ((p - minP) / (maxP - minP)) * chartH
  }
  function volToH(v: number) {
    return (v / maxV) * volH
  }

  const lastCandle = candles[candles.length - 1]
  const firstCandle = candles[0]
  const totalChange = firstCandle && lastCandle
    ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100
    : 0

  // Grid lines
  const gridLines = useMemo(() => {
    if (maxP === minP) return []
    const range = maxP - minP
    const step = range / 5
    return Array.from({ length: 6 }, (_, i) => minP + step * i)
  }, [minP, maxP])

  const lineData = useMemo(() => {
    if (!candles.length) return ''
    return candles.map((c, i) => {
      const x = 20 + i * ((W - 40) / candles.length)
      const y = priceToY(c.close)
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`
    }).join(' ')
  }, [candles, minP, maxP])

  const areaData = useMemo(() => {
    if (!candles.length || !lineData) return ''
    const last = candles[candles.length - 1]
    const lastX = 20 + (candles.length - 1) * ((W - 40) / candles.length)
    return `${lineData} L ${lastX},${chartH} L 20,${chartH} Z`
  }, [lineData, candles, chartH])

  function handleMouseMove(e: React.MouseEvent<SVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const idx = Math.max(0, Math.min(candles.length - 1, Math.floor((x - 20) / ((W - 40) / candles.length))))
    if (candles[idx]) { setHovered(candles[idx]); setHoveredX(20 + idx * ((W - 40) / candles.length)) }
  }

  const fmtPrice = (p: number) => p < 0.01 ? p.toExponential(3) : p < 10 ? p.toFixed(4) : p.toFixed(2)
  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col h-full select-none">
      {/* Chart header */}
      <div className="flex items-center gap-4 px-3 py-2 border-b border-terminal-border flex-none">
        <div className="flex items-center gap-2">
          <span className="text-white font-mono font-bold text-sm">{symbol}/USD</span>
          {lastCandle && (
            <>
              <span className="text-white font-mono text-sm tabular-nums">${fmtPrice(lastCandle.close)}</span>
              <span className={`text-xs font-mono font-bold ${totalChange >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
                {totalChange >= 0 ? '+' : ''}{totalChange.toFixed(2)}%
              </span>
            </>
          )}
        </div>

        {hovered && (
          <div className="flex items-center gap-4 text-xs font-mono text-whale-dim">
            <span>O: <span className="text-white">${fmtPrice(hovered.open)}</span></span>
            <span>H: <span className="text-whale-green">${fmtPrice(hovered.high)}</span></span>
            <span>L: <span className="text-whale-red">${fmtPrice(hovered.low)}</span></span>
            <span>C: <span className="text-white">${fmtPrice(hovered.close)}</span></span>
            <span>V: <span className="text-whale-blue">${(hovered.volume / 1e6).toFixed(2)}M</span></span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Chart type */}
          <div className="flex items-center gap-0.5 border border-terminal-border rounded overflow-hidden">
            {(['candle', 'line'] as const).map(ct => (
              <button
                key={ct}
                onClick={() => setChartType(ct)}
                className={`px-2 py-0.5 text-xs font-mono transition-colors ${
                  chartType === ct ? 'bg-terminal-accent text-white' : 'text-whale-dim hover:text-white'
                }`}
              >
                {ct === 'candle' ? '⚪' : '〰'} {ct.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Time range */}
          <div className="flex items-center gap-0.5 border border-terminal-border rounded overflow-hidden">
            {(['1h', '4h', '1d', '7d', '30d'] as TimeRange[]).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2 py-0.5 text-xs font-mono transition-colors ${
                  timeRange === tr ? 'bg-terminal-accent text-white' : 'text-whale-dim hover:text-white'
                }`}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="flex-1 relative overflow-hidden">
        {candles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-whale-dim text-xs font-mono">
            Loading chart data...
          </div>
        ) : (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${W} ${chartH + volH + 20}`}
            preserveAspectRatio="none"
            className="cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Grid lines */}
            {gridLines.map((price, i) => (
              <g key={i}>
                <line
                  x1={0} y1={priceToY(price)}
                  x2={W} y2={priceToY(price)}
                  stroke="#1a1d27" strokeWidth="0.5"
                />
                <text
                  x={4} y={priceToY(price) - 2}
                  fill="#4b5563" fontSize="8" fontFamily="monospace"
                >
                  ${fmtPrice(price)}
                </text>
              </g>
            ))}

            {chartType === 'line' ? (
              <>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={totalChange >= 0 ? '#00d68f' : '#ff4757'} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={totalChange >= 0 ? '#00d68f' : '#ff4757'} stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={areaData} fill="url(#areaGrad)" />
                <path d={lineData} fill="none" stroke={totalChange >= 0 ? '#00d68f' : '#ff4757'} strokeWidth="1.5" strokeLinejoin="round" />
              </>
            ) : (
              // Candles
              candles.map((c, i) => {
                const x = 20 + i * ((W - 40) / candles.length)
                const isUp = c.close >= c.open
                const color = isUp ? '#00d68f' : '#ff4757'
                const bodyTop = priceToY(Math.max(c.open, c.close))
                const bodyBot = priceToY(Math.min(c.open, c.close))
                const bodyH = Math.max(1, bodyBot - bodyTop)

                return (
                  <g key={i}>
                    <line x1={x} y1={priceToY(c.high)} x2={x} y2={priceToY(c.low)} stroke={color} strokeWidth="0.8" />
                    <rect
                      x={x - candleW / 2}
                      y={bodyTop}
                      width={candleW}
                      height={bodyH}
                      fill={isUp ? color : color}
                      fillOpacity={isUp ? 0.9 : 0.85}
                    />
                  </g>
                )
              })
            )}

            {/* Volume bars */}
            {candles.map((c, i) => {
              const x = 20 + i * ((W - 40) / candles.length)
              const isUp = c.close >= c.open
              return (
                <rect
                  key={i}
                  x={x - candleW / 2}
                  y={chartH + 5 + (volH - volToH(c.volume))}
                  width={candleW}
                  height={volToH(c.volume)}
                  fill={isUp ? '#00d68f' : '#ff4757'}
                  fillOpacity={0.4}
                />
              )
            })}

            {/* Crosshair */}
            {hovered && (
              <line
                x1={hoveredX} y1={0}
                x2={hoveredX} y2={chartH + volH}
                stroke="#4b5563" strokeWidth="0.5" strokeDasharray="3,3"
              />
            )}

            {/* Last price line */}
            {lastCandle && (
              <>
                <line
                  x1={0} y1={priceToY(lastCandle.close)}
                  x2={W} y2={priceToY(lastCandle.close)}
                  stroke={lastCandle.close >= (firstCandle?.open || 0) ? '#00d68f' : '#ff4757'}
                  strokeWidth="0.5" strokeDasharray="4,4"
                />
                <rect
                  x={W - 70} y={priceToY(lastCandle.close) - 8}
                  width={68} height={16}
                  fill={lastCandle.close >= (firstCandle?.open || 0) ? '#00d68f' : '#ff4757'}
                  rx="2"
                />
                <text
                  x={W - 36} y={priceToY(lastCandle.close) + 4}
                  fill="#0a0a0b" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle"
                >
                  ${fmtPrice(lastCandle.close)}
                </text>
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  )
}
