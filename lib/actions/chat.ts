'use server'

import { eq, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { messages } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import { pusherServer } from '@/lib/pusher/server'

export async function getMessages(roomId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.roomId, roomId))
    .orderBy(asc(messages.createdAt))
    .limit(100)
}

export async function sendMessage(roomId: string, content: string): Promise<{ error?: string }> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Empty message' }
  if (trimmed.length > 200) return { error: 'Message too long' }

  const [row] = await db
    .insert(messages)
    .values({
      roomId,
      userId: session.id,
      displayName: session.profile.displayName,
      avatarId: session.profile.avatarId,
      content: trimmed,
    })
    .returning()

  await pusherServer.trigger(`chat:${roomId}`, 'new-message', row)

  return {}
}
