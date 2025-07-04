import { LogEvent } from '@/types/log'
import chalk from 'chalk'

// Color map for different sources
const sourceColors = [
  chalk.blue,
  chalk.green,
  chalk.yellow,
  chalk.magenta,
  chalk.cyan,
  chalk.red,
  chalk.gray,
  chalk.white
]

class StdoutMultiplexer {
  private sourceColorMap = new Map<string, typeof chalk.blue>()
  private colorIndex = 0
  private buffer: LogEvent[] = []
  private flushTimer: NodeJS.Timeout | null = null
  private debounceMs = 200

  private getColorForSource(source: string): typeof chalk.blue {
    if (!this.sourceColorMap.has(source)) {
      this.sourceColorMap.set(source, sourceColors[this.colorIndex % sourceColors.length])
      this.colorIndex++
    }
    return this.sourceColorMap.get(source)!
  }

  private formatLog(log: LogEvent): string {
    const color = this.getColorForSource(log.source)
    const timestamp = new Date(log.timestamp).toLocaleTimeString()
    
    let levelColor = chalk.white
    switch (log.level) {
      case 'error':
        levelColor = chalk.red
        break
      case 'warn':
        levelColor = chalk.yellow
        break
      case 'debug':
        levelColor = chalk.gray
        break
    }

    return `${chalk.gray(timestamp)} ${color(`[${log.source}]`)} ${levelColor(`[${log.level}]`)} ${log.message}`
  }

  private flush(): void {
    if (this.buffer.length === 0) return

    // Group logs by source
    const groupedLogs = new Map<string, LogEvent[]>()
    
    for (const log of this.buffer) {
      if (!groupedLogs.has(log.source)) {
        groupedLogs.set(log.source, [])
      }
      groupedLogs.get(log.source)!.push(log)
    }

    // Output grouped logs
    for (const logs of groupedLogs.values()) {
      for (const log of logs) {
        console.log(this.formatLog(log))
      }
    }

    this.buffer = []
  }

  output(log: LogEvent): void {
    this.buffer.push(log)

    // Clear existing timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
    }

    // Set new timer
    this.flushTimer = setTimeout(() => {
      this.flush()
    }, this.debounceMs)
  }

  // Force immediate output
  forceFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.flush()
  }
}

export const stdoutMultiplexer = new StdoutMultiplexer()