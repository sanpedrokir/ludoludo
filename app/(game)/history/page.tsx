import { redirect } from 'next/navigation'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameHistory } from '@/lib/db/schema'
import { getSessionUserId } from '@/lib/auth/getUser'

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default async function HistoryPage() {
  const userId = await getSessionUserId()
  if (!userId) redirect('/signin')

  const history = await db.query.gameHistory.findMany({
    where: eq(gameHistory.playerId, userId),
    with: { room: true },
    orderBy: [desc(gameHistory.completedAt)],
    limit: 20,
  })

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div>
        <h2 className="text-2xl font-black text-amber-900">Game History</h2>
        <p className="text-amber-700 text-sm mt-1">Your last {history.length} games</p>
      </div>

      {history.length === 0 && (
        <div className="text-center py-12 text-amber-400">
          <div className="text-5xl mb-3">🎲</div>
          <p>No games yet. Play your first game!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {history.map(entry => (
          <div key={entry.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="text-3xl">{RANK_MEDAL[entry.rank] ?? `#${entry.rank}`}</div>
            <div className="flex-1">
              <div className="font-bold text-amber-900 text-sm">
                {entry.room?.name ?? `Room ${entry.room?.roomCode}`}
              </div>
              <div className="text-xs text-amber-500 mt-0.5">
                {entry.mode === 'computer' ? 'vs Computer' : 'Online'}
                {' · '}
                {entry.tokensCompleted}/4 tokens
                {' · '}
                {entry.capturesMade} captures
              </div>
              <div className="text-xs text-amber-400 mt-0.5">
                {new Date(entry.completedAt).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </div>
            </div>
            <div className={`text-sm font-black ${entry.rank === 1 ? 'text-green-600' : 'text-amber-400'}`}>
              {entry.rank === 1 ? 'Win' : `#${entry.rank}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
