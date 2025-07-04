'use client'

import { useEffect, useState, useRef } from 'react'
import { LogEvent } from '@/types/log'
import { cn } from '@/lib/utils'

interface ServiceState {
  enabled: boolean
  logs: LogEvent[]
  color: string
}

const SERVICE_COLORS = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(34, 197, 94)',  // green-500
  'rgb(234, 179, 8)',  // yellow-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(14, 165, 233)', // sky-500
  'rgb(251, 146, 60)', // orange-500
  'rgb(6, 182, 212)',  // cyan-500
]

export function SwimlaneViewer() {
  const [services, setServices] = useState<Map<string, ServiceState>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const swimlanesRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const colorIndexRef = useRef(0)

  useEffect(() => {
    // Fetch initial logs and sources
    fetch('/api/logs')
      .then(res => res.json())
      .then((logs: LogEvent[]) => {
        const newServices = new Map<string, ServiceState>()
        
        // Group logs by source
        logs.forEach(log => {
          if (!newServices.has(log.source)) {
            newServices.set(log.source, {
              enabled: true,
              logs: [],
              color: SERVICE_COLORS[colorIndexRef.current % SERVICE_COLORS.length]
            })
            colorIndexRef.current++
          }
          newServices.get(log.source)!.logs.push(log)
        })
        
        setServices(newServices)
      })
      .catch(console.error)

    // Connect to SSE stream
    const eventSource = new EventSource('/api/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'connected') {
        setIsConnected(true)
      } else if (data.type === 'log') {
        const log = data.data as LogEvent
        
        setServices(prev => {
          const newServices = new Map(prev)
          
          if (!newServices.has(log.source)) {
            newServices.set(log.source, {
              enabled: true,
              logs: [log],
              color: SERVICE_COLORS[colorIndexRef.current % SERVICE_COLORS.length]
            })
            colorIndexRef.current++
          } else {
            const service = newServices.get(log.source)!
            newServices.set(log.source, {
              ...service,
              logs: [...service.logs, log]
            })
          }
          
          return newServices
        })
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  useEffect(() => {
    if (autoScroll) {
      swimlanesRef.current.forEach(div => {
        if (div) {
          div.scrollTop = div.scrollHeight
        }
      })
    }
  }, [services, autoScroll])

  const toggleService = (source: string) => {
    setServices(prev => {
      const newServices = new Map(prev)
      const service = newServices.get(source)!
      newServices.set(source, {
        ...service,
        enabled: !service.enabled
      })
      return newServices
    })
  }

  const clearAll = () => {
    setServices(prev => {
      const newServices = new Map()
      prev.forEach((state, source) => {
        newServices.set(source, {
          ...state,
          logs: []
        })
      })
      return newServices
    })
  }

  const clearService = (source: string) => {
    setServices(prev => {
      const newServices = new Map(prev)
      const service = newServices.get(source)!
      newServices.set(source, {
        ...service,
        logs: []
      })
      return newServices
    })
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      case 'debug':
        return 'text-gray-500'
      default:
        return 'text-inherit'
    }
  }

  const enabledServices = Array.from(services.entries()).filter(([, state]) => state.enabled)

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Rewatch Observer</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
              )} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto-scroll</span>
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Services:</span>
            {Array.from(services.entries()).map(([source, state]) => (
              <button
                key={source}
                onClick={() => toggleService(source)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-all",
                  state.enabled 
                    ? "text-white" 
                    : "text-muted-foreground bg-secondary"
                )}
                style={{
                  backgroundColor: state.enabled ? state.color : undefined
                }}
              >
                {source} ({state.logs.length})
              </button>
            ))}
          </div>
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors cursor-pointer"
          >
            clear all
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {enabledServices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No services selected. Click on service buttons above to enable them.
          </div>
        ) : (
          <div 
            className="h-full grid gap-px bg-border"
            style={{
              gridTemplateRows: `repeat(${enabledServices.length}, 1fr)`
            }}
          >
            {enabledServices.map(([source, state]) => (
              <div
                key={source}
                className="bg-background overflow-hidden flex flex-col"
              >
                <div 
                  className="px-4 py-2 font-medium text-sm border-b flex items-center gap-2"
                  style={{ borderColor: state.color }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: state.color }}
                  />
                  {source}
                  <button
                    onClick={() => clearService(source)}
                    className="text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors ml-6 cursor-pointer"
                  >
                    clear
                  </button>
                </div>
                <div
                  ref={el => {
                    if (el) swimlanesRef.current.set(source, el)
                  }}
                  className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-0.5"
                >
                  {state.logs.length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">
                      No logs yet for {source}
                    </div>
                  ) : (
                    state.logs.map(log => (
                      <div
                        key={log.id}
                        className="flex items-start gap-2 hover:bg-secondary/50 px-2 py-0.5 rounded"
                      >
                        <span className="text-muted-foreground text-xs w-20 flex-shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={cn("w-12 flex-shrink-0", getLevelColor(log.level))}>
                          [{log.level}]
                        </span>
                        <span className="flex-1 break-all">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}