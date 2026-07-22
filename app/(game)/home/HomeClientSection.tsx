'use client'

import { useState, useRef, useCallback } from 'react'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
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

  const onBalanceUpdated = useCallback((payload: { balance: number }) => {
    if (typeof payload.balance === 'number') {
      if (payload.balance > prevRef.current) playCashSound()
      prevRef.current = payload.balance
      setBalance(payload.balance)
    }
  }, [])

  usePusherChannel(`profile:${userId}`, [{ event: 'balance-updated', onEvent: onBalanceUpdated }])

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
