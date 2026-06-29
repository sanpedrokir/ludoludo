import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DailyRewardButton from './DailyRewardButton'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const balance: number = (profile as any)?.balance ?? 0
  const today = new Date().toISOString().split('T')[0]
  const canClaim = (profile as any)?.last_daily_reward !== today

  return (
    <div className="flex flex-col flex-1 px-5 py-6 gap-5">
      <div>
        <h2 className="text-2xl font-black text-amber-900">
          Hey, {profile?.display_name ?? 'Player'}! 👋
        </h2>
        <p className="text-amber-700 text-sm mt-0.5">Ready to roll the dice?</p>
      </div>

      {/* Balance hero */}
      {profile && (
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-4 text-white shadow-md">
          <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Your Balance</div>
          <div className="text-4xl font-black mt-1">${balance.toLocaleString()}</div>
          <div className="text-amber-200 text-xs mt-1">Spend it in the Shop 🛍️</div>
        </div>
      )}

      {/* Daily reward */}
      {profile && <DailyRewardButton canClaim={canClaim} />}

      {/* Game options */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          href="/play-computer"
          className="flex items-center gap-4 p-5 bg-amber-600 rounded-2xl text-white shadow-md hover:bg-amber-700 transition-colors"
        >
          <span className="text-4xl">🤖</span>
          <div>
            <div className="font-bold text-lg">Play with Computer</div>
            <div className="text-amber-200 text-sm">Practice + earn cash rewards</div>
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
          href="/join"
          className="flex items-center gap-4 p-5 bg-green-600 rounded-2xl text-white shadow-md hover:bg-green-700 transition-colors"
        >
          <span className="text-4xl">🔗</span>
          <div>
            <div className="font-bold text-lg">Join a Game</div>
            <div className="text-green-200 text-sm">Enter a game code</div>
          </div>
        </Link>
      </div>

      {/* Stats */}
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
        </div>
      )}
    </div>
  )
}
