import { NextRequest, NextResponse } from 'next/server'
import { jwtDecode } from 'jwt-decode' 
import type { User } from './payload-types' // Ensure User type includes 'role' (as an array of strings)

// Paths that require authentication and subscription
const PROTECTED_PATHS = ['/admin', '/join']

// Paths that are always allowed
const PUBLIC_PATHS = ['/login', '/subscribe', '/register']

// Define an array of professional entitlement IDs
const PROFESSIONAL_ENTITLEMENT_IDS = ['pro', 'simpleplek_admin'] // CONFIRM THESE IDs

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log('Middleware processing path:', pathname)

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    console.log('Public path accessed:', pathname)
    return NextResponse.next()
  }

  // Check if path requires protection
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path))
  if (!isProtectedPath) {
    console.log('Non-protected path:', pathname)
    return NextResponse.next()
  }

  // Get auth cookie
  const authCookie = request.cookies.get('payload-token')
  console.log('Auth cookie present:', !!authCookie?.value)

  if (!authCookie?.value) {
    console.log('No auth cookie found, redirecting to login')
    if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next() // Allow non-protected paths if no auth cookie (e.g. homepage)
  }

  let userRoles: string[] = []
  try {
    // Assuming your JWT structure has roles like: { user: { role: ['admin', 'customer'] } }
    // Or directly: { role: ['admin', 'customer'] }
    // Adjust the decoding and path to roles as per your actual JWT structure.
    const decodedToken = jwtDecode<Partial<User & { role?: string[] }>>(authCookie.value)
    userRoles = decodedToken.role || (decodedToken as any).user?.role || []
  } catch (error) {
    console.error('Error decoding auth token:', error)
    if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/admin')) {
    if (userRoles.includes('admin')) {
      console.log('Admin role found, allowing access to /admin')
      return NextResponse.next()
    }

    // If not an admin by role, check subscription for /admin access
    try {
      const checkUrl = new URL('/api/check-subscription', request.url)
      const checkResponse = await fetch(checkUrl, {
        headers: { cookie: request.headers.get('cookie') || '' },
      })

      if (!checkResponse.ok) {
        console.error(`API call to /api/check-subscription failed with status ${checkResponse.status}`)
        // Decide if redirect to /bookings or /subscribe on API failure
        return NextResponse.redirect(new URL('/bookings', request.url)) 
      }

      const { activeEntitlements, customerId } = await checkResponse.json()

      // Check if any of the user's active entitlements match any of the defined professional IDs
      const hasProfessionalEntitlement = PROFESSIONAL_ENTITLEMENT_IDS.some(id => 
        activeEntitlements && activeEntitlements.includes(id)
      );

      if (hasProfessionalEntitlement) {
        console.log('Professional entitlement found, allowing access to /admin')
        const response = NextResponse.next()
        if (customerId && !request.cookies.get('rc-customer-id')) {
          response.cookies.set('rc-customer-id', customerId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
        }
        return response
      } else {
        console.log('Professional entitlement NOT found, redirecting to /bookings')
        return NextResponse.redirect(new URL('/bookings', request.url))
      }
    } catch (error) {
      console.error('Error during subscription check for /admin:', error)
      return NextResponse.redirect(new URL('/bookings', request.url))
    }
  }

  // For other protected paths like /join, a general subscription check might be enough
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path) && !pathname.startsWith('/admin'))) {
    try {
      const checkUrl = new URL('/api/check-subscription', request.url)
      const checkResponse = await fetch(checkUrl, {
        headers: { cookie: request.headers.get('cookie') || '' },
      })
      if (!checkResponse.ok) {
        return NextResponse.redirect(new URL('/subscribe', request.url)) 
      }
      const { hasActiveSubscription, customerId } = await checkResponse.json()

      if (!hasActiveSubscription) {
        return NextResponse.redirect(new URL('/subscribe', request.url))
      }
      const response = NextResponse.next()
      if (customerId && !request.cookies.get('rc-customer-id')) {
         response.cookies.set('rc-customer-id', customerId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' })
      }
      return response
    } catch (error) {
      console.error('Error checking subscription for general protected path:', error)
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  }

  // If authenticated and path is protected, allow access
  console.log('User authenticated and subscribed, allowing access to protected path:', pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}