import React from 'react'

interface Props {
  label: string
  value: string
  subValue?: string
  change?: number
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'orange' | 'white'
  size?: 'sm' | 'md' | 'lg'
}

const COLOR_MAP = {
  green: 'text-whale-green',
  red: 'text-whale-red',
  blue: 'text-whale-blue',
  yellow: 'text-whale-yellow',
  purple: 'text-whale-purple',
  orange: 'text-whale-orange',
  white: 'text-white',
}

export default function StatCard({ label, value, subValue, change, color = 'white', size = 'md' }: Props) {
  const textColor = COLOR_MAP[color]
  const valueSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'

  return (
    <div className="bg-terminal-panel border border-terminal-border rounded p-3 hover:border-terminal-hover transition-colors">
      <div className="text-whale-dim text-xs font-mono font-bold tracking-wider mb-1">{label}</div>
      <div className={`${textColor} ${valueSize} font-mono font-bold tabular-nums`}>{value}</div>
      {subValue && (
        <div className="text-whale-dim text-xs font-mono mt-0.5">{subValue}</div>
      )}
      {change !== undefined && (
        <div className={`text-xs font-mono mt-0.5 ${change >= 0 ? 'text-whale-green' : 'text-whale-red'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  )
}
