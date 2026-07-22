import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isGameRoute = createRouteMatcher([
  '/home(.*)',
  '/play-computer(.*)',
  '/create-room(.*)',
  '/join(.*)',
  '/lobby(.*)',
  '/game(.*)',
  '/results(.*)',
  '/history(.*)',
  '/profile(.*)',
  '/shop(.*)',
  '/collection(.*)',
  '/leaderboard(.*)',
])

const isAuthRoute = createRouteMatcher(['/signin(.*)', '/signup(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (!userId && isGameRoute(req)) {
    const signInUrl = new URL('/signin', req.url)
    signInUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(signInUrl)
  }

  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/home', req.url))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
