import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  // We only want to protect the frontend pages, not the API routes that the Python agent posts to.
  // Wait, the Python agent currently only writes to DB directly via psycopg2.
  // But let's just protect everything for now to be safe, except maybe future API routes.
  
  const basicAuth = req.headers.get('authorization')
  const url = req.nextUrl

  // The password will be set in Vercel environment variables as DASHBOARD_PASSWORD
  const pwd = process.env.DASHBOARD_PASSWORD || 'secret123'

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1]
    const [user, pwdAttempt] = atob(authValue).split(':')

    if (pwdAttempt === pwd) {
      return NextResponse.next()
    }
  }

  url.pathname = '/api/auth'

  return new NextResponse('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Dashboard"',
    },
  })
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
