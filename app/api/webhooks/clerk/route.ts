import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  let evt: Awaited<ReturnType<typeof verifyWebhook>>
  try {
    evt = await verifyWebhook(req)
  } catch (err) {
    console.error('Clerk webhook verification failed:', err)
    return new Response('Verification failed', { status: 400 })
  }

  // Primary path for auto-creating a profiles row on signup. Eventually
  // consistent (webhooks aren't instant) — lib/db/profile.ts's
  // getOrCreateProfile() is the synchronous fallback for the gap right after
  // signup, before this has necessarily landed.
  if (evt.type === 'user.created') {
    const { id, email_addresses, unsafe_metadata, phone_numbers } = evt.data
    const email = email_addresses?.[0]?.email_address ?? ''
    const displayName =
      (unsafe_metadata?.display_name as string | undefined) || email.split('@')[0] || 'Player'
    const avatarId = Number(unsafe_metadata?.avatar_id) || 1
    const phoneNumber = phone_numbers?.[0]?.phone_number ?? null

    await db
      .insert(profiles)
      .values({ id, displayName, avatarId, phoneNumber })
      .onConflictDoNothing()
  }

  if (evt.type === 'user.deleted') {
    const { id } = evt.data
    if (id) await db.delete(profiles).where(eq(profiles.id, id))
  }

  return new Response('OK', { status: 200 })
}
