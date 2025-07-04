import { NextRequest, NextResponse } from 'next/server'
import { logStore } from '@/lib/log-store'
import { stdoutMultiplexer } from '@/lib/stdout-multiplexer'
import { LogEventInput } from '@/types/log'
import { broadcast } from '@/lib/broadcast'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.source || !body.level || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: source, level, message' },
        { status: 400 }
      )
    }

    const logInput: LogEventInput = {
      source: body.source,
      level: body.level,
      message: body.message,
      metadata: body.metadata
    }

    // Add to store
    const logEvent = logStore.add(logInput)

    // Output to stdout
    stdoutMultiplexer.output(logEvent)

    // Broadcast to connected clients
    broadcast({ type: 'log', data: logEvent })

    return NextResponse.json(logEvent, { status: 201 })
  } catch (error) {
    console.error('Error processing log:', error)
    return NextResponse.json(
      { error: 'Failed to process log event' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const count = searchParams.get('count')

  if (count) {
    const countNum = parseInt(count, 10)
    if (isNaN(countNum) || countNum < 1) {
      return NextResponse.json(
        { error: 'Invalid count parameter' },
        { status: 400 }
      )
    }
    return NextResponse.json(logStore.getLast(countNum))
  }

  return NextResponse.json(logStore.getAll())
}