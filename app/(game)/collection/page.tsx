import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SHOP_ITEMS, CATEGORIES } from '@/lib/shop/items'

export default async function CollectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const [{ data: profile }, { data: collection }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_collection').select('item_id, purchased_at').eq('user_id', user.id).order('purchased_at', { ascending: false }),
  ])

  const balance: number = (profile as any)?.balance ?? 0
  const ownedIds = new Set((collection ?? []).map((r: { item_id: string }) => r.item_id))
  const ownedItems = SHOP_ITEMS.filter(item => ownedIds.has(item.id))

  const byCategory = CATEGORIES.reduce<Record<string, typeof SHOP_ITEMS[number][]>>((acc, cat) => {
    const items = ownedItems.filter(i => i.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {})

  return (
    <div className="px-4 py-5 max-w-lg mx-auto w-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-black text-amber-900">My Collection</h2>
          <p className="text-amber-600 text-sm">{ownedItems.length} item{ownedItems.length !== 1 ? 's' : ''} owned</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-amber-500">Balance</div>
          <div className="font-black text-amber-700">💰 ${balance.toLocaleString()}</div>
        </div>
      </div>

      {ownedItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-xl font-black text-amber-800 mb-2">Nothing yet!</h3>
          <p className="text-amber-500 text-sm mb-6">Win games and earn cash to buy luxury items.</p>
          <Link href="/shop" className="px-6 py-3 bg-amber-600 text-white rounded-2xl font-bold hover:bg-amber-700 transition-colors">
            Visit the Shop
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(byCategory).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">{category}</h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-center h-20 text-5xl bg-amber-50">
                      {item.emoji}
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-amber-900 text-xs leading-tight">{item.name}</div>
                      <div className="text-green-600 text-[10px] font-semibold mt-0.5">✓ Owned</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Link href="/shop" className="block text-center py-3 rounded-2xl border-2 border-amber-200 text-amber-600 font-bold text-sm hover:bg-amber-50 transition-colors">
            + Buy More Items
          </Link>
        </div>
      )}
    </div>
  )
}
