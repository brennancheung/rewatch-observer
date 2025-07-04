// Test client to send logs to the observability platform

const sources = ['mcp-rewatch', 'web-server', 'database', 'auth-service']
const levels = ['info', 'warn', 'error', 'debug']
const messages = [
  'Process started successfully',
  'Connection established',
  'Request completed in 125ms',
  'Cache miss - fetching from database',
  'Failed to connect to service',
  'Configuration loaded',
  'Starting health check',
  'Memory usage: 85MB',
  'Cleaning up temporary files',
  'User authenticated successfully'
]

async function sendLog() {
  const log = {
    source: sources[Math.floor(Math.random() * sources.length)],
    level: levels[Math.floor(Math.random() * levels.length)],
    message: messages[Math.floor(Math.random() * messages.length)],
    metadata: {
      pid: Math.floor(Math.random() * 10000),
      version: '1.0.0'
    }
  }

  try {
    const response = await fetch('http://localhost:4000/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    })

    if (!response.ok) {
      console.error('Failed to send log:', response.statusText)
    } else {
      console.log('Log sent:', log.source, log.level, log.message)
    }
  } catch (error) {
    console.error('Error sending log:', error.message)
  }
}

// Send logs at random intervals
function startSending() {
  sendLog()
  setTimeout(startSending, Math.random() * 400 + 100) // Between 0.1 and 0.5 seconds (5x faster)
}

console.log('Starting test client...')
console.log('Sending logs to http://localhost:4000/api/logs')
console.log('Press Ctrl+C to stop')

startSending()