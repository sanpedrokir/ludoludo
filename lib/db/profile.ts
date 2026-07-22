import { eq } from 'drizzle-orm'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export type Profile = typeof profiles.$inferSelect

/**
 * Fetches the profiles row for a Clerk user, creating it on first hit if the
 * `user.created` webhook (async, eventually-consistent) hasn't landed yet.
 * Mirrors the old `handle_new_user()` Postgres trigger on auth.users, which
 * can't exist anymore since auth no longer lives in this database.
 */
export async function getOrCreateProfile(userId: string): Promise<Profile> {
  const [existing] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1)
  if (existing) return existing

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress ?? ''
  const displayName =
    (clerkUser?.unsafeMetadata?.display_name as string | undefined) ||
    email.split('@')[0] ||
    'Player'
  const avatarId = Number(clerkUser?.unsafeMetadata?.avatar_id) || 1
  const phoneNumber = clerkUser?.primaryPhoneNumber?.phoneNumber ?? null

  const [created] = await db
    .insert(profiles)
    .values({ id: userId, displayName, avatarId, phoneNumber })
    .onConflictDoNothing()
    .returning()

  if (created) return created

  // Lost a race with a concurrent insert (e.g. the webhook landing at the
  // same moment) — fetch what actually got written.
  const [row] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1)
  return row
}
