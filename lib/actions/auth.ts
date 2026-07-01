'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error?: string; success?: boolean; message?: string }

function safeNext(next: FormDataEntryValue | null): string {
  const s = typeof next === 'string' ? next : ''
  return s.startsWith('/') ? s : '/home'
}

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const avatarId = parseInt(formData.get('avatarId') as string) || 1
  const next = safeNext(formData.get('next'))

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, avatar_id: avatarId } },
  })

  if (error) return { error: error.message }

  if (data.user) {
    await supabase
      .from('profiles')
      .update({ avatar_id: avatarId })
      .eq('id', data.user.id)
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signInWithPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = safeNext(formData.get('next'))

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function signOut() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Forfeit any active game_players rows for this user
    await supabase
      .from('game_players')
      .update({ status: 'forfeited' })
      .eq('player_id', user.id)
      .eq('status', 'active')

    // End any playing game rooms where this user is now the only/last active human
    const { data: myRooms } = await supabase
      .from('game_players')
      .select('room_id')
      .eq('player_id', user.id)

    const roomIds = (myRooms ?? []).map((r: { room_id: string }) => r.room_id)
    if (roomIds.length > 0) {
      // For each playing room, check if any other human is still active
      const { data: otherActive } = await supabase
        .from('game_players')
        .select('room_id')
        .in('room_id', roomIds)
        .neq('player_id', user.id)
        .eq('is_computer', false)
        .eq('status', 'active')

      const roomsWithOthers = new Set((otherActive ?? []).map((r: { room_id: string }) => r.room_id))
      const roomsToEnd = roomIds.filter((id: string) => !roomsWithOthers.has(id))

      if (roomsToEnd.length > 0) {
        await supabase
          .from('game_rooms')
          .update({ status: 'finished', finished_at: new Date().toISOString() })
          .in('id', roomsToEnd)
          .eq('status', 'playing')
      }
    }
  }

  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const displayName = formData.get('displayName') as string
  const avatarId = parseInt(formData.get('avatarId') as string) || 1

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_id: avatarId })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/profile')
  return { success: true }
}
