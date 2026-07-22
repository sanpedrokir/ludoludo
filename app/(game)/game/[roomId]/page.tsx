import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gameRooms, gameStates } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import OnlineGameClient from './OnlineGameClient'

export default async function OnlineGamePage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const session = await getSessionUser()
  if (!session) redirect('/signin')

  const room = await db.query.gameRooms.findFirst({
    where: eq(gameRooms.id, roomId),
    with: { gamePlayers: { with: { profile: true } } },
  })

  if (!room || room.status !== 'playing') redirect('/home')

  const [gameState] = await db.select().from(gameStates).where(eq(gameStates.roomId, roomId)).limit(1)

  // If game state is missing or tokens aren't a valid array, we can't render the game
  if (!gameState || !Array.isArray(gameState.tokens)) redirect('/home')

  const myPlayer = room.gamePlayers.find((p) => p.playerId === session.id)

  // If the user is forfeited (no longer an active participant), send them home
  if (myPlayer?.status === 'forfeited') redirect('/home')

  const stake = room.stake
  const numHuman = room.gamePlayers.filter((p) => !p.isComputer).length
  const pot = stake * numHuman

  return (
    <OnlineGameClient
      room={room}
      initialGameState={gameState}
      currentUserId={session.id}
      myColor={myPlayer?.color ?? null}
      initialBalance={session.profile.balance}
      pot={pot}
    />
  )
}
