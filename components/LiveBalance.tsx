'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { playCashSound } from '@/lib/sounds'

interface Props {
  userId: string
  initial: number
  className?: string
  channel?: string
}

export default function LiveBalance({ userId, initial, className, channel = 'default' }: Props) {
  const [balance, setBalance] = useState(initial)
  const prevRef = useRef(initial)

  useEffect(() => {
    let supabase: ReturnType<typeof createClient> | null = null
    let ch: ReturnType<ReturnType<typeof createClient>['channel']> | null = null

    try {
      supabase = createClient()
      ch = supabase
        .channel(`bal-${channel}-${userId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
          (payload) => {
            try {
              const b = (payload.new as Record<string, unknown>).balance
              if (typeof b === 'number') {
                if (b > prevRef.current) playCashSound()
                prevRef.current = b
                setBalance(b)
              }
            } catch { /* ignore */ }
          }
        )
        .subscribe()
    } catch (err) {
      console.error('[LiveBalance] subscription failed:', err)
    }

    return () => {
      try {
        if (supabase && ch) supabase.removeChannel(ch)
      } catch { /* ignore */ }
    }
  }, [userId, channel])

  return <span className={className}>${balance.toLocaleString()}</span>
}
