import { gt, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { getSessionUserId } from '@/lib/auth/getUser'
import LeaderboardClient from './LeaderboardClient'

export const revalidate = 60

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams

  const cols = {
    id: profiles.id,
    displayName: profiles.displayName,
    avatarId: profiles.avatarId,
    wins: profiles.wins,
    gamesPlayed: profiles.gamesPlayed,
    balance: profiles.balance,
  }

  const [userId, byWins, byBalance] = await Promise.all([
    getSessionUserId(),
    db.select(cols).from(profiles).where(gt(profiles.gamesPlayed, 0))
      .orderBy(desc(profiles.wins), asc(profiles.gamesPlayed)).limit(50),
    db.select(cols).from(profiles).orderBy(desc(profiles.balance)).limit(50),
  ])

  return (
    <LeaderboardClient
      currentUserId={userId}
      byWins={byWins}
      byBalance={byBalance}
      initialTab={tab === 'rich' ? 'rich' : 'wins'}
    />
  )
}
