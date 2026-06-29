'use client'

import { useState } from 'react'
import { SHOP_ITEMS, CATEGORIES, ShopItem } from '@/lib/shop/items'
import { purchaseItem } from '@/lib/actions/economy'

interface Props {
  initialBalance: number
  ownedItemIds: string[]
}

export default function ShopClient({ initialBalance, ownedItemIds }: Props) {
  const [balance, setBalance] = useState(initialBalance)
  const [owned, setOwned] = useState<Set<string>>(new Set(ownedItemIds))
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [buying, setBuying] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ text: string; ok: boolean } | null>(null)

  const categories = ['All', ...CATEGORIES]
  const filtered = activeCategory === 'All'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === activeCategory)

  function showNotif(text: string, ok: boolean) {
    setNotification({ text, ok })
    setTimeout(() => setNotification(null), 3000)
  }

  async function handleBuy(item: ShopItem) {
    if (owned.has(item.id)) return
    if (balance < item.price) {
      showNotif(`Need $${(item.price - balance).toLocaleString()} more`, false)
      return
    }
    setBuying(item.id)
    const result = await purchaseItem(item.id, item.price)
    setBuying(null)
    if (result.success) {
      setBalance(b => b - item.price)
      setOwned(prev => new Set([...prev, item.id]))
      showNotif(`${item.emoji} ${item.name} is yours!`, true)
    } else {
      showNotif(result.error ?? 'Purchase failed', false)
    }
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto w-full">
      {/* Balance bar */}
      <div className="flex items-center justify-between mb-5 bg-amber-50 rounded-2xl p-3 border border-amber-200">
        <div className="text-sm text-amber-700 font-semibold">Your balance</div>
        <div className="text-xl font-black text-amber-800">💰 ${balance.toLocaleString()}</div>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-semibold text-center transition-all ${notification.ok ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
          {notification.text}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              activeCategory === cat
                ? 'bg-amber-600 text-white'
                : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(item => {
          const isOwned = owned.has(item.id)
          const canAfford = balance >= item.price
          const isBuying = buying === item.id

          return (
            <div
              key={item.id}
              className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all ${
                isOwned
                  ? 'border-green-300 bg-green-50'
                  : canAfford
                    ? 'border-amber-200 bg-white hover:border-amber-400'
                    : 'border-gray-200 bg-gray-50 opacity-75'
              }`}
            >
              {/* Item visual */}
              <div className={`flex items-center justify-center h-24 text-6xl relative ${
                isOwned ? 'bg-green-100' : canAfford ? 'bg-amber-50' : 'bg-gray-100'
              }`}>
                {item.emoji}
                {isOwned && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-black">✓</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="font-bold text-amber-900 text-xs leading-tight mb-0.5">{item.name}</div>
                <div className="text-amber-500 text-[10px] mb-2 leading-tight">{item.description}</div>
                <div className="text-amber-700 font-black text-sm mb-2">${item.price.toLocaleString()}</div>

                <button
                  onClick={() => handleBuy(item)}
                  disabled={isOwned || isBuying || !canAfford}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isOwned
                      ? 'bg-green-200 text-green-700 cursor-default'
                      : canAfford
                        ? 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isBuying ? '…' : isOwned ? '✓ Owned' : canAfford ? 'Buy' : 'Insufficient funds'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 text-center text-xs text-amber-400">
        Earn cash by playing games, rolling dice, and winning! 🎲
      </div>
    </div>
  )
}
