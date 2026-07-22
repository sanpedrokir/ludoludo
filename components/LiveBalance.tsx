'use client'

import { useState, useRef, useCallback } from 'react'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
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

  const onBalanceUpdated = useCallback((payload: { balance: number }) => {
    if (typeof payload.balance === 'number') {
      if (payload.balance > prevRef.current) playCashSound()
      prevRef.current = payload.balance
      setBalance(payload.balance)
    }
  }, [])

  // `channel` prop only disambiguates multiple LiveBalance instances on one
  // page — the underlying Pusher channel is always scoped to the userId.
  void channel
  usePusherChannel(`profile:${userId}`, [{ event: 'balance-updated', onEvent: onBalanceUpdated }])

  return <span className={className}>${balance.toLocaleString()}</span>
}
