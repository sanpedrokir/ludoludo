'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error?: string; success?: boolean; message?: string }

export async function signUp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const displayName = formData.get('displayName') as string
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/home')
}

export async function signInWithPassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/home')
}

export async function signInWithOtp(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) return { error: error.message }

  return { success: true, message: 'Check your email for the login link.' }
}

export async function verifyOtp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const token = formData.get('token') as string

  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect('/home')
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
