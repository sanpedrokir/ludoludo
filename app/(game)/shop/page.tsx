import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShopClient from './ShopClient'

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: profile }, { data: collection }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_collection').select('item_id').eq('user_id', user.id),
  ])

  const balance: number = (profile as any)?.balance ?? 0
  const ownedItemIds = (collection ?? []).map((r: { item_id: string }) => r.item_id)

  return (
    <div>
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-5 py-6 text-white">
        <h2 className="text-2xl font-black">Luxury Shop 🛍️</h2>
        <p className="text-amber-200 text-sm mt-1">Spend your winnings on the finer things in life</p>
      </div>
      <ShopClient initialBalance={balance} ownedItemIds={ownedItemIds} />
    </div>
  )
}
