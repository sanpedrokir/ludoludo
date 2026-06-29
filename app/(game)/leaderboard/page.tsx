import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const [{ data: { user } }, { data: players }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('id, display_name, wins, games_played')
      .gt('games_played', 0)
      .order('wins', { ascending: false })
      .order('games_played', { ascending: true })
      .limit(50),
  ])

  const MEDAL = ['🥇', '🥈', '🥉']

  return (
    <div className="px-4 py-6 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">🏆</div>
        <h2 className="text-2xl font-black text-amber-900">Leaderboard</h2>
        <p className="text-amber-600 text-sm mt-1">Online multiplayer rankings</p>
      </div>

      {!players?.length && (
        <div className="text-center py-12 text-amber-400">
          <div className="text-4xl mb-3">🎲</div>
          <p className="font-semibold">No games played yet.</p>
          <p className="text-sm mt-1">Finish an online game to appear here!</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {players?.map((p, i) => {
          const isMe = p.id === user?.id
          const winRate = p.games_played > 0
            ? Math.round((p.wins / p.games_played) * 100)
            : 0

          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm transition-colors ${
                isMe
                  ? 'bg-amber-100 border-2 border-amber-500'
                  : 'bg-white border border-amber-100'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                {i < 3
                  ? <span className="text-xl">{MEDAL[i]}</span>
                  : <span className="text-sm font-black text-amber-400">{i + 1}</span>
                }
              </div>

              {/* Avatar circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white flex-shrink-0 ${
                i === 0 ? 'bg-amber-500' :
                i === 1 ? 'bg-slate-400' :
                i === 2 ? 'bg-amber-700' :
                'bg-amber-300'
              }`}>
                {p.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>

              {/* Name + badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-900 truncate text-sm">{p.display_name}</span>
                  {isMe && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">You</span>}
                </div>
                <div className="text-xs text-amber-400">{p.games_played} game{p.games_played !== 1 ? 's' : ''}</div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-black text-amber-700">{p.wins} win{p.wins !== 1 ? 's' : ''}</div>
                <div className="text-xs text-amber-400">{winRate}% rate</div>
              </div>
            </div>
          )
        })}
      </div>

      {players && players.length >= 50 && (
        <p className="text-center text-xs text-amber-400 mt-4">Showing top 50 players</p>
      )}
    </div>
  )
}
