import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomeClientSection from './HomeClientSection'
import { AVATARS } from '@/components/PlayerAvatar'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()


  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const balance: number = (profile as any)?.balance ?? 0
  const today = new Date().toISOString().split('T')[0]
  const canClaim = (profile as any)?.last_daily_reward !== today

  // Find any in-progress game the user is currently a player in
  const { data: playerRooms } = user
    ? await supabase.from('game_players').select('room_id').eq('player_id', user.id).eq('is_computer', false).eq('status', 'active')
    : { data: null }

  const roomIds = (playerRooms ?? []).map((p: { room_id: string }) => p.room_id)

  const { data: activeGame } = roomIds.length > 0
    ? await supabase.from('game_rooms').select('id, name').eq('status', 'playing').in('id', roomIds).limit(1).maybeSingle()
    : { data: null }

  const avatarId: number = (profile as any)?.avatar_id ?? 1
  const avatar = AVATARS.find(a => a.id === avatarId) ?? AVATARS[0]

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      <div className="flex items-center gap-3">
        {profile && (
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-3xl shadow-md flex-shrink-0`}>
            {avatar.emoji}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-black text-amber-900">
            Hey, {profile?.display_name ?? 'Player'}! 👋
          </h2>
          <p className="text-amber-700 text-sm mt-0.5">Ready to roll the dice?</p>
        </div>
      </div>

      {/* Balance + daily reward (client section for immediate updates + sound) */}
      {profile && user && (
        <HomeClientSection userId={user.id} initialBalance={balance} canClaim={canClaim} />
      )}

      {/* Rejoin in-progress game */}
      {activeGame && (
        <Link
          href={`/game/${activeGame.id}`}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white shadow-md"
          style={{ background: '#164e63', border: '1px solid #22d3ee' }}
        >
          <span className="text-base">▶️</span>
          <span className="text-sm font-bold flex-1">Game in progress — tap to rejoin</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black tracking-wide">LIVE</span>
        </Link>
      )}

      {/* Game options */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/join"
          className="flex items-center gap-4 p-5 bg-green-600 rounded-2xl text-white shadow-md hover:bg-green-700 transition-colors"
        >
          <span className="text-4xl">🔗</span>
          <div>
            <div className="font-bold text-lg">Join a Game</div>
            <div className="text-green-200 text-sm">Enter a game code</div>
          </div>
        </Link>

        <Link
          href="/play-computer"
          className="flex items-center gap-4 p-5 rounded-2xl text-white shadow-md transition-colors"
          style={{ background: '#4f46e5' }}
        >
          <span className="w-10 h-10 flex items-center justify-center flex-shrink-0">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="8" y="14" width="20" height="14" rx="4" fill="white" fillOpacity="0.9"/>
              <rect x="13" y="10" width="10" height="5" rx="2" fill="white" fillOpacity="0.7"/>
              <circle cx="18" cy="9" r="2" fill="white" fillOpacity="0.6"/>
              <circle cx="14" cy="20" r="2.5" fill="#4f46e5"/>
              <circle cx="22" cy="20" r="2.5" fill="#4f46e5"/>
              <rect x="13" y="24" width="10" height="2" rx="1" fill="#4f46e5"/>
              <rect x="4" y="17" width="4" height="6" rx="2" fill="white" fillOpacity="0.5"/>
              <rect x="28" y="17" width="4" height="6" rx="2" fill="white" fillOpacity="0.5"/>
            </svg>
          </span>
          <div>
            <div className="font-bold text-lg">Play with Computer</div>
            <div className="text-sm" style={{ color: '#c7d2fe' }}>Practice + earn cash rewards</div>
          </div>
        </Link>

        <Link
          href="/create-room"
          className="flex items-center gap-4 p-5 bg-blue-600 rounded-2xl text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <span className="text-4xl">👥</span>
          <div>
            <div className="font-bold text-lg">Play with Friends</div>
            <div className="text-blue-200 text-sm">Create a private game room</div>
          </div>
        </Link>

        <Link
          href="/create-room?stake=true"
          className="flex items-center gap-4 p-5 rounded-2xl text-white shadow-md hover:brightness-110 transition-all"
          style={{ background: 'linear-gradient(135deg, #b45309 0%, #d97706 40%, #f59e0b 100%)' }}
        >
          <span className="text-4xl">🎰</span>
          <div className="flex-1">
            <div className="font-bold text-lg">High Stakes Game</div>
            <div className="text-amber-100 text-sm">$250,000 entry — winner takes the pot</div>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-black text-white">STAKE</span>
        </Link>
      </div>

      {/* Stats + shortcuts */}
      {profile && (
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-amber-100">
          <h3 className="text-amber-900 font-bold mb-3 text-sm">Your Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-black text-amber-700">{profile.games_played ?? 0}</div>
              <div className="text-xs text-amber-500">Played</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-600">{profile.wins ?? 0}</div>
              <div className="text-xs text-amber-500">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500">
                {(profile.games_played ?? 0) > 0
                  ? Math.round(((profile.wins ?? 0) / profile.games_played) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-amber-500">Win Rate</div>
            </div>
          </div>
          <div className="flex gap-2 mt-3 pt-3 border-t border-amber-100">
            <Link href="/leaderboard" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors">
              🏆 Rankings
            </Link>
            <Link href="/leaderboard?tab=rich" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors">
              💰 Rich List
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
