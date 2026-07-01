import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OnlineGameClient from './OnlineGameClient'

export default async function OnlineGamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const { data: room } = await supabase
    .from('game_rooms')
    .select('*, game_players(*, profiles(display_name, avatar_id))')
    .eq('id', roomId)
    .single()

  if (!room || room.status !== 'playing') redirect('/home')

  const { data: gameState } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', roomId)
    .single()

  // If game state is missing or tokens aren't a valid array, we can't render the game
  if (!gameState || !Array.isArray(gameState.tokens)) redirect('/home')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const myPlayer = room.game_players.find((p: { player_id: string }) => p.player_id === user.id)

  // If the user is forfeited (no longer an active participant), send them home
  if (myPlayer?.status === 'forfeited') redirect('/home')
  const stake = (room as any).stake ?? 0
  const numHuman = room.game_players.filter((p: { is_computer: boolean }) => !p.is_computer).length
  const pot = stake * numHuman

  return (
    <OnlineGameClient
      room={room}
      initialGameState={gameState}
      currentUserId={user.id}
      myColor={myPlayer?.color ?? null}
      myDisplayName={myProfile?.display_name ?? 'Player'}
      pot={pot}
    />
  )
}
