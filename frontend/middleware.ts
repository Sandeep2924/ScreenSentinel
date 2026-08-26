import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const basicAuth = req.headers.get('authorization')
  const url = req.nextUrl

  // The universal password for all tenant accounts
  const pwd = process.env.DASHBOARD_PASSWORD || 'secret123'

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwdAttempt] = atob(authValue).split(':')

    if (pwdAttempt === pwd) {
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-agent-id', user)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }
  }

  url.pathname = '/api/auth'

  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure SaaS Dashboard"',
    },
  })
}

export const config = {
  matcher: ['/((?!api/auth|api/ingest|_next/static|_next/image|favicon.ico).*)'],
}
