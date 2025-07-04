import { NextRequest } from 'next/server'
import { addClient, removeClient } from '@/lib/broadcast'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      addClient(controller)

      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'))

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        removeClient(controller)
      })
    },
    cancel() {
      // Client disconnected
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}