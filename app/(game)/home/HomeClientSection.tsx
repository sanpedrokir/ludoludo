'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { claimDailyReward } from '@/lib/actions/economy'
import { playCashSound } from '@/lib/sounds'

interface Props {
  userId: string
  initialBalance: number
  canClaim: boolean
}

export default function HomeClientSection({ userId, initialBalance, canClaim }: Props) {
  const [balance, setBalance] = useState(initialBalance)
  const [claimed, setClaimed] = useState(!canClaim)
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null)
  const [claiming, setClaiming] = useState(false)
  const prevRef = useRef(initialBalance)

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | undefined

    supabase.from('profiles').select('balance').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setBalance((data as any).balance ?? 0)
          prevRef.current = (data as any).balance ?? 0
        }
      })

    try {
      const ch = supabase
        .channel(`bal-home-${userId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
          (payload) => {
            const b = (payload.new as Record<string, unknown>).balance
            if (typeof b === 'number') {
              if (b > prevRef.current) playCashSound()
              prevRef.current = b
              setBalance(b)
            }
          })
        .subscribe()
      cleanup = () => { try { supabase.removeChannel(ch) } catch {} }
    } catch {}

    return () => cleanup?.()
  }, [userId])

  async function handleClaim() {
    setClaiming(true)
    const res = await claimDailyReward()
    setClaiming(false)
    if (res?.amount) {
      playCashSound()
      setBalance(prev => prev + res.amount!)
      prevRef.current = prevRef.current + res.amount!
      setClaimedAmount(res.amount!)
      setClaimed(true)
    }
  }

  return (
    <>
      {/* Balance display */}
      <div className="px-1">
        <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Your Balance</div>
        <span className="text-4xl font-black mt-1 block text-white">${balance.toLocaleString()}</span>
      </div>

      {/* Daily reward */}
      {claimedAmount ? (
        <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-center">
          <div className="text-3xl mb-1">💰</div>
          <div className="text-green-700 font-black text-lg">+${claimedAmount.toLocaleString()} earned!</div>
          <div className="text-green-500 text-xs mt-0.5">Daily reward collected. See you tomorrow!</div>
        </div>
      ) : claimed ? (
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <div className="text-amber-700 font-bold text-sm">Daily reward claimed</div>
            <div className="text-amber-400 text-xs">Come back tomorrow for another $800+</div>
          </div>
        </div>
      ) : (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full p-4 rounded-2xl text-white shadow-md disabled:opacity-60 transition-all text-left flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
        >
          <div className="text-4xl">🎁</div>
          <div>
            <div className="font-black text-lg">{claiming ? 'Collecting…' : 'Collect Daily $800'}</div>
            <div className="text-xs" style={{ color: '#ddd6fe' }}>Top-ranked players earn bonus too!</div>
          </div>
          {!claiming && <div className="ml-auto text-2xl">→</div>}
        </button>
      )}
    </>
  )
}
