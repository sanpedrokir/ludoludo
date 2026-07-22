import { auth } from '@clerk/nextjs/server'
import { getOrCreateProfile, type Profile } from '@/lib/db/profile'

/** Fast, local session check (Clerk validates the JWT in proxy.ts already) — no DB hit. */
export async function getSessionUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId ?? null
}

/**
 * Session user id + their profiles row. Timeboxed against a slow/unreachable
 * Neon so a DB outage degrades to "signed out" instead of hanging a request
 * indefinitely — this is the direct fix for the 504 that started this
 * migration (the old middleware had no timeout around its auth DB call).
 */
export async function getSessionUser(): Promise<{ id: string; profile: Profile } | null> {
  const userId = await getSessionUserId()
  if (!userId) return null

  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))
  const profile = await Promise.race([getOrCreateProfile(userId), timeout])
  if (!profile) return null

  return { id: userId, profile }
}
