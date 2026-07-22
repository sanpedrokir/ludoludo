'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
import { getMyBalance } from '@/lib/actions/economy'

export default function InGameBalance() {
  const { user } = useUser()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    getMyBalance().then(setBalance)
  }, [user])

  const onBalanceUpdated = useCallback((payload: { balance: number }) => {
    if (typeof payload.balance === 'number') setBalance(payload.balance)
  }, [])

  usePusherChannel(user ? `profile:${user.id}` : null, [{ event: 'balance-updated', onEvent: onBalanceUpdated }])

  if (balance === null) return null

  return (
    <div className="flex flex-col items-center min-w-[80px]">
      <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Balance</span>
      <span className="text-amber-700 font-black text-base">${balance.toLocaleString()}</span>
    </div>
  )
}
