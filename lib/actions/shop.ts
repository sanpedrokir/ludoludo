'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function buyItem(itemId: string, price: number): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('balance').eq('id', user.id).single()
  const balance = (profile as any)?.balance ?? 0
  if (balance < price) return { error: `Insufficient balance — you need $${price.toLocaleString()}, you have $${balance.toLocaleString()}` }

  const { data: existing } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()
  if (existing) return { error: 'Already owned' }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ balance: balance - price } as any)
    .eq('id', user.id)
  if (updateError) return { error: updateError.message }

  const { error: purchaseError } = await supabase
    .from('purchases')
    .insert({ user_id: user.id, item_id: itemId })
  if (purchaseError) return { error: purchaseError.message }

  revalidatePath('/shop')
  return { success: true }
}
