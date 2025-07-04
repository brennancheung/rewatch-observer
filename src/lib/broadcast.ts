// Store active connections
const clients = new Set<ReadableStreamDefaultController>()

export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller)
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller)
}

// Helper function to broadcast to all connected clients
export function broadcast(data: unknown) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(data)}\n\n`
  
  clients.forEach(controller => {
    try {
      controller.enqueue(encoder.encode(message))
    } catch {
      // Client disconnected, remove from set
      clients.delete(controller)
    }
  })
}