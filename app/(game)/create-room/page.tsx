'use client'

import { useActionState } from 'react'
import { createGameRoom } from '@/lib/actions/game'
import { Color } from '@/lib/game/types'

const COLORS: { value: Color; label: string; bg: string }[] = [
  { value: 'red', label: 'Red', bg: 'bg-red-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-600' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-400' },
]

export default function CreateRoomPage() {
  const [state, formAction, pending] = useActionState(createGameRoom, { error: undefined })

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div>
        <h2 className="text-2xl font-black text-amber-900 mb-1">Create Game Room</h2>
        <p className="text-amber-700 text-sm">Set up a private room and invite friends.</p>
      </div>

      {state?.error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-1">
            Room Name <span className="text-amber-400 font-normal">(optional)</span>
          </label>
          <input
            name="name"
            type="text"
            placeholder="Friday Night Ludo"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">Max Players</label>
          <div className="flex gap-3">
            {[2, 3, 4].map(n => (
              <label key={n} className="flex-1">
                <input type="radio" name="maxPlayers" value={n} defaultChecked={n === 4} className="sr-only peer" />
                <div className="text-center py-3 rounded-xl border-2 font-bold text-lg cursor-pointer border-amber-200 peer-checked:bg-amber-600 peer-checked:text-white peer-checked:border-amber-600 hover:border-amber-400 transition-colors text-amber-700">
                  {n}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">Your Colour</label>
          <div className="grid grid-cols-2 gap-3">
            {COLORS.map(c => (
              <label key={c.value} className="cursor-pointer">
                <input type="radio" name="hostColor" value={c.value} defaultChecked={c.value === 'red'} className="sr-only peer" />
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold transition-colors border-amber-200 text-amber-800 peer-checked:border-transparent peer-checked:text-white peer-checked:${c.bg} hover:border-amber-400`}>
                  <span className={`w-5 h-5 rounded-full ${c.bg}`} />
                  {c.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="fillWithComputers"
            value="true"
            className="w-5 h-5 rounded border-amber-300 text-amber-600"
          />
          <span className="text-sm text-amber-800 font-medium">
            Fill empty slots with AI after game starts
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 rounded-2xl bg-amber-600 text-white font-black text-xl hover:bg-amber-700 disabled:opacity-60 transition-colors shadow-md"
        >
          {pending ? 'Creating…' : 'Create Room 🎮'}
        </button>
      </form>
    </div>
  )
}
