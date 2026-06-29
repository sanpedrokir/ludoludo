import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LobbyClient from './LobbyClient'

export default async function LobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const { data: room } = await supabase
    .from('game_rooms')
    .select('*, game_players(*, profiles(display_name, avatar_id))')
    .eq('id', roomId)
    .single()

  if (!room) redirect('/home')
  if (room.status === 'playing') redirect(`/game/${roomId}`)
  if (room.status === 'finished') redirect('/home')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  return (
    <LobbyClient
      room={room}
      currentUserId={user.id}
      isHost={room.host_id === user.id}
      myDisplayName={myProfile?.display_name ?? 'Player'}
    />
  )
}
