'use client'

import { useEffect, useState, useRef } from 'react'
import { LogEvent } from '@/types/log'
import { cn } from '@/lib/utils'

export function LogViewer() {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial logs
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(console.error)

    // Connect to SSE stream
    const eventSource = new EventSource('/api/stream')

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'connected') {
        setIsConnected(true)
      } else if (data.type === 'log') {
        setLogs(prev => [...prev, data.data])
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
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500'
      case 'warn':
        return 'text-yellow-500'
      case 'debug':
        return 'text-gray-500'
      default:
        return 'text-blue-500'
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
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
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm"
      >
        {logs.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No logs yet. Waiting for incoming events...
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 hover:bg-secondary/50 px-2 py-1 rounded"
              >
                <span className="text-muted-foreground text-xs w-24 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-primary font-medium w-32 flex-shrink-0 truncate">
                  [{log.source}]
                </span>
                <span className={cn("w-16 flex-shrink-0", getLevelColor(log.level))}>
                  [{log.level}]
                </span>
                <span className="flex-1 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}