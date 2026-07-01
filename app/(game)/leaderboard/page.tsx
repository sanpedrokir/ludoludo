import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from './LeaderboardClient'

export const revalidate = 60

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = await createClient()
  const { tab } = await searchParams

  const [{ data: { user } }, { data: byWins }, { data: byBalance }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('profiles')
      .select('id, display_name, avatar_id, wins, games_played, balance')
      .gt('games_played', 0)
      .order('wins', { ascending: false })
      .order('games_played', { ascending: true })
      .limit(50),
    supabase
      .from('profiles')
      .select('id, display_name, avatar_id, wins, games_played, balance')
      .order('balance', { ascending: false })
      .limit(50),
  ])

  return (
    <LeaderboardClient
      currentUserId={user?.id ?? null}
      byWins={byWins ?? []}
      byBalance={byBalance ?? []}
      initialTab={tab === 'rich' ? 'rich' : 'wins'}
    />
  )
}
