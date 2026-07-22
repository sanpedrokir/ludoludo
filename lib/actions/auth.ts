'use server'

import { revalidatePath } from 'next/cache'
import { eq, and, inArray, ne } from 'drizzle-orm'
import { db } from '@/lib/db'
import { gamePlayers, gameRooms, profiles } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'

type ActionResult = { error?: string; success?: boolean; message?: string }

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const displayName = formData.get('displayName') as string
  const avatarId = parseInt(formData.get('avatarId') as string) || 1

  await db.update(profiles).set({ displayName, avatarId }).where(eq(profiles.id, session.id))

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Forfeits this user's active games and ends any room left with no other
 * active human, so signing out doesn't strand their opponents mid-game.
 * Called from the client right before Clerk's own signOut() ends the
 * session — see components/SignOutButton.tsx.
 */
export async function cleanupOnSignOut(): Promise<void> {
  const session = await getSessionUser()
  if (!session) return
  const userId = session.id

  const myRooms = await db
    .select({ roomId: gamePlayers.roomId })
    .from(gamePlayers)
    .where(eq(gamePlayers.playerId, userId))

  const roomIds = myRooms.map((r) => r.roomId)

  await db
    .update(gamePlayers)
    .set({ status: 'forfeited' })
    .where(and(eq(gamePlayers.playerId, userId), eq(gamePlayers.status, 'active')))

  if (roomIds.length === 0) return

  const otherActive = await db
    .select({ roomId: gamePlayers.roomId })
    .from(gamePlayers)
    .where(and(
      inArray(gamePlayers.roomId, roomIds),
      ne(gamePlayers.playerId, userId),
      eq(gamePlayers.isComputer, false),
      eq(gamePlayers.status, 'active'),
    ))

  const roomsWithOthers = new Set(otherActive.map((r) => r.roomId))
  const roomsToEnd = roomIds.filter((id) => !roomsWithOthers.has(id))

  if (roomsToEnd.length > 0) {
    await db
      .update(gameRooms)
      .set({ status: 'finished', finishedAt: new Date() })
      .where(and(inArray(gameRooms.id, roomsToEnd), eq(gameRooms.status, 'playing')))
  }
}
