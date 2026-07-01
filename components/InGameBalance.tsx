'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InGameBalance() {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channelCleanup: (() => void) | undefined

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return

      // Fetch current balance
      supabase.from('profiles').select('balance').eq('id', user.id).single()
        .then(({ data }) => {
          setBalance((data as any)?.balance ?? 0)
        })

      // Stay live via Realtime
      const ch = supabase
        .channel(`ingame-bal-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            const b = (payload.new as Record<string, unknown>).balance
            if (typeof b === 'number') setBalance(b)
          }
        )
        .subscribe()

      channelCleanup = () => { try { supabase.removeChannel(ch) } catch {} }
    })

    return () => channelCleanup?.()
  }, [])

  if (balance === null) return null

  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Balance</span>
      <span className="text-amber-700 font-black text-base">${balance.toLocaleString()}</span>
    </div>
  )
}
