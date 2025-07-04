import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Disable logging for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    response.headers.set('x-middleware-disable-logging', '1')
    return response
  }
}

export const config = {
  matcher: '/api/:path*'
}