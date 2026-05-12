import React from 'react'
import type { Alert } from '../types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  alerts: Alert[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  onClose: () => void
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  info: { color: 'text-whale-blue', bg: 'bg-whale-blue/10', border: 'border-whale-blue/30', icon: 'ℹ' },
  warning: { color: 'text-whale-yellow', bg: 'bg-whale-yellow/10', border: 'border-whale-yellow/30', icon: '⚠' },
  critical: { color: 'text-whale-red', bg: 'bg-whale-red/10', border: 'border-whale-red/30', icon: '🔴' },
}

export default function AlertsPanel({ alerts, onMarkRead, onMarkAllRead, onClose }: Props) {
  const unread = alerts.filter(a => !a.read).length

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-terminal-panel border-l border-terminal-border shadow-2xl flex flex-col animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-border">
          <div className="flex items-center gap-2">
            <span className="text-white font-mono font-bold text-sm">ALERTS</span>
            {unread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-whale-red text-white text-xs font-mono font-bold">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs font-mono text-whale-dim hover:text-white transition-colors"
              >
                MARK ALL READ
              </button>
            )}
            <button
              onClick={onClose}
              className="text-whale-dim hover:text-white transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Alerts list */}
        <div className="flex-1 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-whale-dim text-xs font-mono">
              No alerts
            </div>
          ) : (
            alerts.map(alert => {
              const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info
              return (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-terminal-border cursor-pointer transition-colors hover:bg-terminal-accent/40 ${
                    !alert.read ? `${sev.bg}` : ''
                  }`}
                  onClick={() => onMarkRead(alert.id)}
                >
                  {/* Unread dot */}
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${!alert.read ? sev.color.replace('text-', 'bg-') : 'bg-transparent'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${sev.color}`}>{sev.icon}</span>
                      <span className={`font-mono text-xs font-bold ${!alert.read ? 'text-white' : 'text-whale-dim'}`}>
                        {alert.title}
                      </span>
                    </div>
                    <p className={`text-xs font-mono mt-0.5 leading-relaxed ${!alert.read ? 'text-whale-dim' : 'text-whale-dim/60'}`}>
                      {alert.message}
                    </p>
                    <div className="text-xs text-whale-dim/50 font-mono mt-1">
                      {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                    </div>
                  </div>

                  {/* Severity badge */}
                  <span className={`px-1.5 py-0.5 rounded text-xs font-mono border ${sev.color} ${sev.border} flex-none`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
