'use server'

import { eq, gt, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles, userCollection } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import { pusherServer } from '@/lib/pusher/server'

type EconomyResult = { success: boolean; amount?: number; error?: string }

export async function claimDailyReward(): Promise<EconomyResult> {
  const session = await getSessionUser()
  if (!session) return { success: false, error: 'Not authenticated' }

  const today = new Date().toISOString().split('T')[0]
  if (session.profile.lastDailyReward === today) {
    return { success: false, error: 'Already claimed today' }
  }

  const topPlayers = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(gt(profiles.wins, 0))
    .orderBy(desc(profiles.wins))
    .limit(3)

  let leaderBonus = 0
  const rank = topPlayers.findIndex((p) => p.id === session.id)
  if (rank === 0) leaderBonus = 800
  else if (rank === 1) leaderBonus = 500
  else if (rank === 2) leaderBonus = 300

  const total = 800 + leaderBonus

  const [updated] = await db
    .update(profiles)
    .set({ balance: sql`${profiles.balance} + ${total}`, lastDailyReward: today })
    .where(eq(profiles.id, session.id))
    .returning({ balance: profiles.balance })

  if (updated) await pusherServer.trigger(`profile:${session.id}`, 'balance-updated', { balance: updated.balance })

  return { success: true, amount: total }
}

export async function getMyBalance(): Promise<number> {
  const session = await getSessionUser()
  return session?.profile.balance ?? 0
}

export async function getMyBalanceAndAvatar(): Promise<{ balance: number; avatarId: number }> {
  const session = await getSessionUser()
  return { balance: session?.profile.balance ?? 0, avatarId: session?.profile.avatarId ?? 1 }
}

export async function addBalance(amount: number): Promise<void> {
  if (amount === 0) return
  const userId = await getSessionUser().then((s) => s?.id)
  if (!userId) return

  const [updated] = await db
    .update(profiles)
    .set({ balance: sql`${profiles.balance} + ${amount}` })
    .where(eq(profiles.id, userId))
    .returning({ balance: profiles.balance })

  if (updated) await pusherServer.trigger(`profile:${userId}`, 'balance-updated', { balance: updated.balance })
}

export async function purchaseItem(
  itemId: string,
  price: number
): Promise<{ success: boolean; error?: string }> {
  const session = await getSessionUser()
  if (!session) return { success: false, error: 'Not authenticated' }

  if (session.profile.balance < price) return { success: false, error: 'Insufficient balance' }

  const [existing] = await db
    .select({ id: userCollection.id })
    .from(userCollection)
    .where(sql`${userCollection.userId} = ${session.id} and ${userCollection.itemId} = ${itemId}`)
    .limit(1)

  if (existing) return { success: false, error: 'Already owned' }

  const [updated] = await db
    .update(profiles)
    .set({ balance: sql`${profiles.balance} - ${price}` })
    .where(eq(profiles.id, session.id))
    .returning({ balance: profiles.balance })

  await db.insert(userCollection).values({ userId: session.id, itemId })

  if (updated) await pusherServer.trigger(`profile:${session.id}`, 'balance-updated', { balance: updated.balance })

  return { success: true }
}
