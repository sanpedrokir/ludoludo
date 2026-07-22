import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { purchases } from '@/lib/db/schema'
import { getSessionUser } from '@/lib/auth/getUser'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const session = await getSessionUser()
  if (!session) redirect('/signin')

  const owned = await db.select({ itemId: purchases.itemId }).from(purchases).where(eq(purchases.userId, session.id))
  const ownedIds = owned.map((p) => p.itemId)

  return <ShopClient balance={session.profile.balance} ownedIds={ownedIds} />
}
