export type LogLevel = 'info' | 'error' | 'warn' | 'debug'

export interface LogEvent {
  id: string
  source: string
  timestamp: string
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
}

export interface LogEventInput {
  source: string
  level: LogLevel
  message: string
  metadata?: Record<string, unknown>
}