'use client'

import { useState } from 'react'
import { claimDailyReward } from '@/lib/actions/economy'

export default function DailyRewardButton({ canClaim }: { canClaim: boolean }) {
  const [claiming, setClaiming] = useState(false)
  const [result, setResult] = useState<{ amount?: number; error?: string } | null>(null)

  if (result?.amount) {
    return (
      <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-center">
        <div className="text-3xl mb-1">💰</div>
        <div className="text-green-700 font-black text-lg">+${result.amount.toLocaleString()} earned!</div>
        <div className="text-green-500 text-xs mt-0.5">Daily reward collected. See you tomorrow!</div>
      </div>
    )
  }

  if (!canClaim) {
    return (
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
        <div className="text-2xl">✅</div>
        <div>
          <div className="text-amber-700 font-bold text-sm">Daily reward claimed</div>
          <div className="text-amber-400 text-xs">Come back tomorrow for another $800+</div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={async () => {
        setClaiming(true)
        const res = await claimDailyReward()
        setClaiming(false)
        setResult(res)
      }}
      disabled={claiming}
      className="w-full p-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl text-white shadow-md hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 transition-all text-left flex items-center gap-4"
    >
      <div className="text-4xl">💰</div>
      <div>
        <div className="font-black text-lg">{claiming ? 'Collecting…' : 'Collect Daily $800'}</div>
        <div className="text-amber-100 text-xs">Top-ranked players earn bonus too!</div>
      </div>
      {!claiming && <div className="ml-auto text-2xl">→</div>}
    </button>
  )
}
