'use client'

import { useState, useActionState, FormEvent, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { lookupRoom, joinGameByCode } from '@/lib/actions/game'
import { Color, COLORS } from '@/lib/game/types'

const COLOR_META: Record<Color, { label: string; bg: string; ring: string; text: string }> = {
  red:    { label: 'Red',    bg: 'bg-red-500',    ring: 'ring-red-400',    text: 'text-red-700' },
  blue:   { label: 'Blue',   bg: 'bg-blue-500',   ring: 'ring-blue-400',   text: 'text-blue-700' },
  green:  { label: 'Green',  bg: 'bg-green-600',  ring: 'ring-green-400',  text: 'text-green-700' },
  yellow: { label: 'Yellow', bg: 'bg-yellow-400', ring: 'ring-yellow-300', text: 'text-yellow-700' },
}

export default function JoinPage() {
  const searchParams = useSearchParams()
  const defaultCode = searchParams.get('code') ?? ''

  const [step, setStep] = useState<'code' | 'color'>('code')
  const [code, setCode] = useState(defaultCode)
  const [available, setAvailable] = useState<Color[]>([])
  const [chosenColor, setChosenColor] = useState<Color | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [looking, setLooking] = useState(false)

  const [joinState, joinAction, joinPending] = useActionState(joinGameByCode, { error: undefined })

  // Auto-lookup if code came from WhatsApp link
  useEffect(() => {
    if (defaultCode && defaultCode.trim().length >= 6) {
      doLookup(defaultCode)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function doLookup(codeToLook: string) {
    setLooking(true)
    setLookupError(null)
    const result = await lookupRoom(codeToLook)
    setLooking(false)
    if ('error' in result) {
      setLookupError(result.error)
      return
    }
    setAvailable(result.available)
    setChosenColor(result.available.length === 1 ? result.available[0] : null)
    setStep('color')
  }

  async function handleLookup(e: FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    doLookup(code)
  }

  if (step === 'color') {
    return (
      <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
        <div>
          <button onClick={() => setStep('code')} className="text-amber-500 text-sm mb-3 hover:underline">← Back</button>
          <h2 className="text-2xl font-black text-amber-900 mb-1">Pick Your Colour</h2>
          <p className="text-amber-600 text-sm">
            Code: <span className="font-black font-mono text-amber-900">{code}</span>
          </p>
        </div>

        {joinState?.error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
            {joinState.error}
          </div>
        )}

        {available.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-xl text-amber-700 text-sm text-center">
            No colours available — the room is full!
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {COLORS.map(color => {
              const meta = COLOR_META[color]
              const isAvailable = available.includes(color)
              const isChosen = chosenColor === color
              return (
                <button
                  key={color}
                  disabled={!isAvailable}
                  onClick={() => setChosenColor(color)}
                  className={`
                    relative p-5 rounded-2xl flex flex-col items-center gap-2 transition-all border-2
                    ${isChosen ? `${meta.ring} ring-4 border-transparent scale-105 shadow-lg` : 'border-transparent'}
                    ${isAvailable ? 'cursor-pointer hover:scale-105 bg-white shadow-sm' : 'opacity-30 cursor-not-allowed bg-gray-50'}
                  `}
                >
                  <div className={`w-14 h-14 rounded-full ${meta.bg} shadow-md`} />
                  <span className={`font-bold text-sm ${meta.text}`}>{meta.label}</span>
                  {!isAvailable && <span className="text-xs text-gray-400">Taken</span>}
                  {isChosen && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-black">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {available.length > 0 && (
          <form action={joinAction}>
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="color" value={chosenColor ?? ''} />
            <button
              type="submit"
              disabled={!chosenColor || joinPending}
              className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-xl hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md"
            >
              {joinPending
                ? 'Joining…'
                : chosenColor
                  ? `Join as ${COLOR_META[chosenColor].label} 🎲`
                  : 'Choose a colour first'}
            </button>
          </form>
        )}
      </div>
    )
  }

  // Step 1: code entry (or auto-looking up)
  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div>
        <h2 className="text-2xl font-black text-amber-900 mb-1">Join a Game</h2>
        <p className="text-amber-700 text-sm">Enter the 6-digit code to join.</p>
      </div>

      {lookupError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {lookupError}
        </div>
      )}

      {looking ? (
        <div className="py-10 text-center text-amber-500 font-semibold animate-pulse">
          Finding game…
        </div>
      ) : (
        <form onSubmit={handleLookup} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-amber-800 mb-2">Game Code</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              maxLength={6}
              placeholder="829154"
              className="w-full px-4 py-4 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300 text-center text-3xl font-black tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full py-4 rounded-2xl bg-green-600 text-white font-black text-xl hover:bg-green-700 disabled:opacity-60 transition-colors shadow-md"
          >
            Find Game 🔍
          </button>
        </form>
      )}
    </div>
  )
}
