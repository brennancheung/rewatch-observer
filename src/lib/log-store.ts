import { LogEvent, LogEventInput } from '@/types/log'

class LogStore {
  private logs: LogEvent[] = []
  private logsBySource: Map<string, LogEvent[]> = new Map()
  private sources: Set<string> = new Set()
  private maxLogs: number
  private idCounter: number = 0

  constructor(maxLogs: number = 10000) {
    this.maxLogs = maxLogs
  }

  add(input: LogEventInput): LogEvent {
    const log: LogEvent = {
      id: `log-${++this.idCounter}`,
      timestamp: new Date().toISOString(),
      ...input
    }

    // Add to main logs array
    this.logs.push(log)

    // Add to source-specific array
    if (!this.logsBySource.has(input.source)) {
      this.logsBySource.set(input.source, [])
      this.sources.add(input.source)
    }
    this.logsBySource.get(input.source)!.push(log)

    // Remove oldest logs if we exceed the limit
    if (this.logs.length > this.maxLogs) {
      const removedLog = this.logs.shift()
      if (removedLog) {
        // Also remove from source-specific array
        const sourceLogs = this.logsBySource.get(removedLog.source)
        if (sourceLogs) {
          const index = sourceLogs.findIndex(l => l.id === removedLog.id)
          if (index > -1) {
            sourceLogs.splice(index, 1)
          }
        }
      }
    }

    return log
  }

  getAll(): LogEvent[] {
    return [...this.logs]
  }

  getBySource(source: string): LogEvent[] {
    return [...(this.logsBySource.get(source) || [])]
  }

  getSources(): string[] {
    return Array.from(this.sources)
  }

  getLast(count: number): LogEvent[] {
    return this.logs.slice(-count)
  }

  clear(): void {
    this.logs = []
    this.logsBySource.clear()
    this.sources.clear()
  }

  size(): number {
    return this.logs.length
  }
}

// Singleton instance
export const logStore = new LogStore()