'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { joinGameByCode } from '@/lib/actions/game'

export default function JoinPage() {
  const searchParams = useSearchParams()
  const defaultCode = searchParams.get('code') ?? ''

  const [state, formAction, pending] = useActionState(joinGameByCode, { error: undefined })

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div>
        <h2 className="text-2xl font-black text-amber-900 mb-1">Join a Game</h2>
        <p className="text-amber-700 text-sm">Enter the 6-digit code to join a room.</p>
      </div>

      {state?.error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">Game Code</label>
          <input
            name="code"
            type="text"
            defaultValue={defaultCode}
            required
            maxLength={6}
            placeholder="829154"
            className="w-full px-4 py-4 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300 text-center text-3xl font-black tracking-widest uppercase"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-xl hover:bg-green-700 disabled:opacity-60 transition-colors shadow-md"
        >
          {pending ? 'Joining…' : 'Join Game 🔗'}
        </button>
      </form>
    </div>
  )
}
