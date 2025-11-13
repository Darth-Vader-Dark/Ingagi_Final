import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = new URL(request.url)
  // Rewrite legacy /public/* QR links to /guest/*
  if (url.pathname.startsWith('/public/')) {
    url.pathname = url.pathname.replace(/^\/public\//, '/guest/')
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/public/:path*']
}

