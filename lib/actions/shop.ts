'use server'

import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles, purchases } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import { pusherServer } from '@/lib/pusher/server'

export async function buyItem(itemId: string, price: number): Promise<{ error?: string; success?: boolean }> {
  const session = await getSessionUser()
  if (!session) return { error: 'Not authenticated' }

  if (session.profile.balance < price) {
    return { error: `Insufficient balance — you need $${price.toLocaleString()}, you have $${session.profile.balance.toLocaleString()}` }
  }

  const [existing] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(sql`${purchases.userId} = ${session.id} and ${purchases.itemId} = ${itemId}`)
    .limit(1)
  if (existing) return { error: 'Already owned' }

  const [updated] = await db
    .update(profiles)
    .set({ balance: sql`${profiles.balance} - ${price}` })
    .where(eq(profiles.id, session.id))
    .returning({ balance: profiles.balance })

  await db.insert(purchases).values({ userId: session.id, itemId })

  if (updated) await pusherServer.trigger(`profile:${session.id}`, 'balance-updated', { balance: updated.balance })

  revalidatePath('/shop')
  return { success: true }
}
