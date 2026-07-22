import { Suspense } from 'react'
import Link from 'next/link'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gamePlayers, gameRooms } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import SignOutButton from '@/components/SignOutButton'
import LiveBalance from '@/components/LiveBalance'
import LudoIcon from '@/components/LudoIcon'
import RejoinBanner from '@/components/RejoinBanner'

export const dynamic = 'force-dynamic'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser()
  const balance = session?.profile.balance ?? 0

  // Find any in-progress game the user is still an active player in
  const playerRooms = session
    ? await db
        .select({ roomId: gamePlayers.roomId })
        .from(gamePlayers)
        .where(and(
          eq(gamePlayers.playerId, session.id),
          eq(gamePlayers.isComputer, false),
          eq(gamePlayers.status, 'active'),
        ))
    : []

  const roomIds = playerRooms.map((p) => p.roomId)

  const [activeGame] = roomIds.length > 0
    ? await db
        .select({ id: gameRooms.id })
        .from(gameRooms)
        .where(and(eq(gameRooms.status, 'playing'), inArray(gameRooms.id, roomIds)))
        .limit(1)
    : []

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/home" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <LudoIcon size={28} />
          LudoLudo
        </Link>
        {session && (
          <div className="flex items-center gap-3">
            <Link href="/shop" className="flex items-center gap-1 bg-amber-700/60 px-2.5 py-1 rounded-full hover:bg-amber-700/80 transition-colors">
              <span className="text-xs">💰</span>
              <Suspense fallback={<span className="text-xs font-black">${balance.toLocaleString()}</span>}>
                <LiveBalance userId={session.id} initial={balance} className="text-xs font-black" channel="layout" />
              </Suspense>
            </Link>
            <SignOutButton />
          </div>
        )}
      </header>

      {activeGame && <RejoinBanner gameId={activeGame.id} />}

      <main className="flex-1 flex flex-col">{children}</main>

      <nav className="bg-white border-t border-amber-200 flex justify-around py-2 px-2">
        <Link href="/home" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🏠</span>
          Home
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🛍️</span>
          Shop
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">👤</span>
          Profile
        </Link>
      </nav>
    </div>
  )
}
