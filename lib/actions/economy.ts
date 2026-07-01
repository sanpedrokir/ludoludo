'use server'

import { createClient } from '@/lib/supabase/server'

type EconomyResult = { success: boolean; amount?: number; error?: string }

export async function claimDailyReward(): Promise<EconomyResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance, last_daily_reward, wins')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, error: 'Profile not found' }

  const today = new Date().toISOString().split('T')[0]
  if ((profile as any).last_daily_reward === today) {
    return { success: false, error: 'Already claimed today' }
  }

  const { data: topPlayers } = await supabase
    .from('profiles')
    .select('id')
    .gt('wins', 0)
    .order('wins', { ascending: false })
    .limit(3)

  let leaderBonus = 0
  if (topPlayers) {
    const rank = topPlayers.findIndex(p => p.id === user.id)
    if (rank === 0) leaderBonus = 800
    else if (rank === 1) leaderBonus = 500
    else if (rank === 2) leaderBonus = 300
  }

  const total = 800 + leaderBonus

  const { error } = await supabase
    .from('profiles')
    .update({
      balance: ((profile as any).balance ?? 0) + total,
      last_daily_reward: today,
    } as any)
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  return { success: true, amount: total }
}

export async function addBalance(amount: number): Promise<void> {
  if (amount === 0) return
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile) return

  const newBalance = ((profile as any).balance ?? 0) + amount
  await supabase
    .from('profiles')
    .update({ balance: newBalance } as any)
    .eq('id', user.id)
}

export async function purchaseItem(
  itemId: string,
  price: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', user.id)
    .single()

  if (!profile) return { success: false, error: 'Profile not found' }

  const bal = (profile as any).balance ?? 0
  if (bal < price) return { success: false, error: 'Insufficient balance' }

  const { data: existing } = await supabase
    .from('user_collection')
    .select('id')
    .eq('user_id', user.id)
    .eq('item_id', itemId)
    .maybeSingle()

  if (existing) return { success: false, error: 'Already owned' }

  const { error: deductErr } = await supabase
    .from('profiles')
    .update({ balance: bal - price } as any)
    .eq('id', user.id)

  if (deductErr) return { success: false, error: deductErr.message }

  const { error: collectErr } = await supabase
    .from('user_collection')
    .insert({ user_id: user.id, item_id: itemId })

  if (collectErr) return { success: false, error: collectErr.message }

  return { success: true }
}
