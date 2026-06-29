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
    .select('*, game_players(*, profiles(display_name))')
    .eq('id', roomId)
    .single()

  if (!room || room.status !== 'playing') redirect('/home')

  const { data: gameState } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', roomId)
    .single()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const myPlayer = room.game_players.find((p: { player_id: string }) => p.player_id === user.id)

  return (
    <OnlineGameClient
      room={room}
      initialGameState={gameState}
      currentUserId={user.id}
      myColor={myPlayer?.color ?? null}
      myDisplayName={myProfile?.display_name ?? 'Player'}
    />
  )
}
