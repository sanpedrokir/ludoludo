'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Color, Difficulty } from '@/lib/game/types'

const COLORS: { value: Color; label: string; bg: string; border: string }[] = [
  { value: 'red', label: 'Red', bg: 'bg-red-500', border: 'border-red-500' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-500' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', border: 'border-green-500' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-400', border: 'border-yellow-400' },
]

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Random moves' },
  { value: 'normal', label: 'Normal', desc: 'Smart play' },
  { value: 'hard', label: 'Hard', desc: 'Ruthless AI' },
]

export default function PlayComputerPage() {
  const router = useRouter()
  const [numPlayers, setNumPlayers] = useState(4)
  const [myColor, setMyColor] = useState<Color>('red')
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  function handleStart() {
    const params = new URLSearchParams({
      players: numPlayers.toString(),
      color: myColor,
      difficulty,
      mode: 'computer',
    })
    router.push(`/game/local?${params}`)
  }

  return (
    <div className="px-6 py-8 flex flex-col gap-8 max-w-md mx-auto w-full">
      <div>
        <h2 className="text-2xl font-black text-amber-900 mb-1">Play vs Computer</h2>
        <p className="text-amber-700 text-sm">Set up your game below.</p>
      </div>

      {/* Number of players */}
      <div>
        <h3 className="font-bold text-amber-800 mb-3">Number of Players</h3>
        <div className="flex gap-3">
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => setNumPlayers(n)}
              className={`flex-1 py-3 rounded-xl font-bold text-lg border-2 transition-colors ${
                numPlayers === n
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-700 border-amber-200 hover:border-amber-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Token color */}
      <div>
        <h3 className="font-bold text-amber-800 mb-3">Your Token Colour</h3>
        <div className="grid grid-cols-2 gap-3">
          {COLORS.slice(0, numPlayers).map(c => (
            <button
              key={c.value}
              onClick={() => setMyColor(c.value)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-semibold transition-colors ${
                myColor === c.value
                  ? `${c.bg} text-white ${c.border}`
                  : `bg-white text-amber-800 border-amber-200 hover:border-amber-400`
              }`}
            >
              <span className={`w-5 h-5 rounded-full ${c.bg}`} />
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <h3 className="font-bold text-amber-800 mb-3">Computer Difficulty</h3>
        <div className="flex flex-col gap-2">
          {DIFFICULTIES.map(d => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                difficulty === d.value
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-amber-800 border-amber-200 hover:border-amber-400'
              }`}
            >
              <span className="font-bold">{d.label}</span>
              <span className={`text-sm ${difficulty === d.value ? 'text-amber-200' : 'text-amber-500'}`}>
                {d.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-amber-600 text-white font-black text-xl hover:bg-amber-700 transition-colors shadow-md"
      >
        Start Game 🎲
      </button>
    </div>
  )
}
