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
  const next = safeNext(formData.get('next'))

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })

  if (error) return { error: error.message }

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
