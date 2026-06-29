import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="flex flex-col flex-1 px-6 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-amber-900">
          Hey, {profile?.display_name ?? 'Player'}! 👋
        </h2>
        <p className="text-amber-700 text-sm mt-1">Ready to roll the dice?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Link
          href="/play-computer"
          className="flex items-center gap-4 p-5 bg-amber-600 rounded-2xl text-white shadow-md hover:bg-amber-700 transition-colors"
        >
          <span className="text-4xl">🤖</span>
          <div>
            <div className="font-bold text-lg">Play with Computer</div>
            <div className="text-amber-200 text-sm">Practice against AI opponents</div>
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
            <div className="text-green-200 text-sm">Enter a 6-digit game code</div>
          </div>
        </Link>
      </div>

      {profile && (
        <div className="mt-8 p-4 bg-white rounded-2xl shadow-sm border border-amber-100">
          <h3 className="text-amber-900 font-bold mb-3">Your Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-2xl font-black text-amber-700">{profile.games_played}</div>
              <div className="text-xs text-amber-500">Played</div>
            </div>
            <div>
              <div className="text-2xl font-black text-green-600">{profile.wins}</div>
              <div className="text-xs text-amber-500">Wins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500">
                {profile.games_played > 0
                  ? Math.round((profile.wins / profile.games_played) * 100)
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
