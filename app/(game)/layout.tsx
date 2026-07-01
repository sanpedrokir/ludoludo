import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import LiveBalance from '@/components/LiveBalance'
import LudoIcon from '@/components/LudoIcon'
import RejoinBanner from '@/components/RejoinBanner'

export const dynamic = 'force-dynamic'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const balance: number = (profile as any)?.balance ?? 0

  // Find any in-progress game the user is still an active player in
  const { data: playerRooms } = user
    ? await supabase
        .from('game_players')
        .select('room_id')
        .eq('player_id', user.id)
        .eq('is_computer', false)
        .eq('status', 'active')
    : { data: null }

  const roomIds = (playerRooms ?? []).map((p: { room_id: string }) => p.room_id)

  const { data: activeGame } = roomIds.length > 0
    ? await supabase
        .from('game_rooms')
        .select('id')
        .eq('status', 'playing')
        .in('id', roomIds)
        .limit(1)
        .maybeSingle()
    : { data: null }

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/home" className="flex items-center gap-2 font-black text-xl tracking-tight">
          <LudoIcon size={28} />
          LudoLudo
        </Link>
        {profile && user && (
          <div className="flex items-center gap-3">
            <Link href="/shop" className="flex items-center gap-1 bg-amber-700/60 px-2.5 py-1 rounded-full hover:bg-amber-700/80 transition-colors">
              <span className="text-xs">💰</span>
              <Suspense fallback={<span className="text-xs font-black">${balance.toLocaleString()}</span>}>
                <LiveBalance userId={user.id} initial={balance} className="text-xs font-black" channel="layout" />
              </Suspense>
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-xs text-amber-200 hover:text-white">
                Sign out
              </button>
            </form>
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
        <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🏆</span>
          Rankings
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
