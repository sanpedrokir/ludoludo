import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameRooms } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import LobbyClient from './LobbyClient'

export default async function LobbyPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const session = await getSessionUser()
  if (!session) redirect('/signin')

  const room = await db.query.gameRooms.findFirst({
    where: eq(gameRooms.id, roomId),
    with: { gamePlayers: { with: { profile: true } } },
  })

  if (!room) redirect('/home')
  if (room.status === 'playing') redirect(`/game/${roomId}`)
  if (room.status === 'finished') redirect('/home')

  return (
    <LobbyClient
      room={room}
      currentUserId={session.id}
      isHost={room.hostId === session.id}
    />
  )
}
