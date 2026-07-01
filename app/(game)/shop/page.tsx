import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: profile }, { data: purchases }] = await Promise.all([
    supabase.from('profiles').select('balance').eq('id', user.id).single(),
    supabase.from('purchases').select('item_id').eq('user_id', user.id),
  ])

  const balance = (profile as any)?.balance ?? 0
  const ownedIds = (purchases ?? []).map((p: { item_id: string }) => p.item_id)

  return <ShopClient balance={balance} ownedIds={ownedIds} />
}
