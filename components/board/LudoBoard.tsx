'use client'

import { Color, TokenState, SAFE_SQUARES } from '@/lib/game/types'
import { toAbsolutePosition, isDone, isHome, isInFinalLane } from '@/lib/game/engine'

const CELL = 40

const TRACK_COORDS: [number, number][] = [
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [13, 7],
]

const FINAL_LANE_COORDS: Record<Color, [number, number][]> = {
  red:    [[12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue:   [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green:  [[2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
}

const HOME_TOKEN_POSITIONS: Record<Color, [number, number][]> = {
  red:    [[2, 2], [2, 4], [4, 2], [4, 4]],
  blue:   [[2, 10], [2, 12], [4, 10], [4, 12]],
  green:  [[10, 10], [10, 12], [12, 10], [12, 12]],
  yellow: [[10, 2], [10, 4], [12, 2], [12, 4]],
}

// Token colours
const TOKEN_BG: Record<Color, string> = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-600',
  yellow: 'bg-yellow-400',
}

// Safe square absolute positions
const SAFE_SET = new Set<string>()
for (let i = 0; i < TRACK_COORDS.length; i++) {
  if (SAFE_SQUARES.has(i)) {
    const [r, c] = TRACK_COORDS[i]
    SAFE_SET.add(`${r},${c}`)
  }
}

// Final lane cell lookup
const FINAL_LANE_SET = new Set<string>()
const FINAL_LANE_COLOR = new Map<string, Color>()
for (const [color, cells] of Object.entries(FINAL_LANE_COORDS) as [Color, [number,number][]][]) {
  for (const [r, c] of cells) {
    FINAL_LANE_SET.add(`${r},${c}`)
    FINAL_LANE_COLOR.set(`${r},${c}`, color)
  }
}

function getCellBg(row: number, col: number): string {
  const key = `${row},${col}`

  // Home areas — soft pastel fill
  if (row <= 5 && col <= 5) return 'bg-red-200'
  if (row <= 5 && col >= 9) return 'bg-blue-200'
  if (row >= 9 && col >= 9) return 'bg-green-100'
  if (row >= 9 && col <= 5) return 'bg-yellow-200'

  // Center cell
  if (row === 7 && col === 7) return 'bg-amber-50'

  // Final lane cells (some pass through the centre 3×3)
  const laneColor = FINAL_LANE_COLOR.get(key)
  if (laneColor === 'red')    return 'bg-red-100'
  if (laneColor === 'blue')   return 'bg-blue-100'
  if (laneColor === 'green')  return 'bg-green-100'
  if (laneColor === 'yellow') return 'bg-yellow-100'

  // Starting squares (colour-tinted entry cells)
  if (row === 13 && col === 6) return 'bg-red-200'
  if (row === 6  && col === 1) return 'bg-blue-200'
  if (row === 1  && col === 8) return 'bg-green-200'
  if (row === 8  && col === 13) return 'bg-yellow-200'

  // Safe squares
  if (SAFE_SET.has(key)) return 'bg-amber-100'

  return 'bg-white'
}

interface Props {
  tokens: TokenState[]
  currentColor: Color
  validMoves: number[]
  onTokenClick?: (color: Color, index: number) => void
}

export default function LudoBoard({ tokens, currentColor, validMoves, onTokenClick }: Props) {
  const boardSize = 15 * CELL

  // Map grid coords → tokens on that cell
  const cellTokens = new Map<string, TokenState[]>()
  for (const token of tokens) {
    if (isDone(token)) continue
    let coords: [number, number] | null = null
    if (isHome(token)) {
      coords = HOME_TOKEN_POSITIONS[token.color][token.index]
    } else if (isInFinalLane(token)) {
      coords = FINAL_LANE_COORDS[token.color][token.position - 52]
    } else {
      coords = TRACK_COORDS[toAbsolutePosition(token.color, token.position)]
    }
    if (coords) {
      const key = `${coords[0]},${coords[1]}`
      if (!cellTokens.has(key)) cellTokens.set(key, [])
      cellTokens.get(key)!.push(token)
    }
  }

  const doneCount: Record<Color, number> = { red: 0, blue: 0, green: 0, yellow: 0 }
  for (const token of tokens) {
    if (isDone(token)) doneCount[token.color]++

  }

  function renderToken(token: TokenState, size = 28) {
    const isValid = token.color === currentColor && validMoves.includes(token.index)
    return (
      <button
        key={`${token.color}-${token.index}`}
        onClick={() => isValid && onTokenClick?.(token.color, token.index)}
        className={`
          rounded-full ${TOKEN_BG[token.color]} text-white font-bold border-2 border-white
          flex items-center justify-center select-none transition-transform duration-150
          ${size >= 24 ? 'text-xs' : 'text-[9px]'}
          ${isValid ? 'ring-4 ring-white ring-offset-1 animate-pulse scale-110 cursor-pointer' : 'cursor-default shadow-md'}
        `}
        style={{ width: size, height: size, flexShrink: 0 }}
        title={isValid ? 'Click to move' : ''}
      >
        {token.index + 1}
      </button>
    )
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none border-4 border-amber-800 shadow-2xl"
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Grid cells */}
      {Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => {
          const key = `${row},${col}`
          const bg = getCellBg(row, col)
          const here = cellTokens.get(key) ?? []
          const isSafe = SAFE_SET.has(key)
          const isCenter = row === 7 && col === 7

          return (
            <div
              key={key}
              className={`absolute ${bg}`}
              style={{
                left: col * CELL,
                top: row * CELL,
                width: CELL,
                height: CELL,
                borderRight: '1px solid rgba(0,0,0,0.07)',
                borderBottom: '1px solid rgba(0,0,0,0.07)',
              }}
            >
              {/* Centre star */}
              {isCenter && doneCount.red === 0 && doneCount.blue === 0 && doneCount.green === 0 && doneCount.yellow === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none">⭐</div>
              )}
              {/* Done token count in centre */}
              {isCenter && Object.values(doneCount).some(n => n > 0) && (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
                  {(['red', 'blue', 'green', 'yellow'] as Color[]).map(c =>
                    doneCount[c] > 0 ? (
                      <span key={c} className={`text-[9px] font-black text-white px-1 rounded-full ${TOKEN_BG[c]}`}>
                        {doneCount[c]}
                      </span>
                    ) : null
                  )}
                </div>
              )}
              {/* Safe star */}
              {isSafe && here.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-amber-400 text-sm pointer-events-none select-none">★</div>
              )}
              {/* Tokens */}
              {here.length === 1 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderToken(here[0])}
                </div>
              )}
              {here.length > 1 && (
                <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-px p-px">
                  {here.map(t => renderToken(t, 16))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Corner labels */}
      <div className="absolute font-black text-red-700 text-[11px] tracking-wider pointer-events-none select-none"
        style={{ left: 8, top: 6 }}>RED</div>
      <div className="absolute font-black text-blue-700 text-[11px] tracking-wider pointer-events-none select-none"
        style={{ left: 9*CELL + 8, top: 6 }}>BLUE</div>
      <div className="absolute font-black text-green-700 text-[11px] tracking-wider pointer-events-none select-none"
        style={{ left: 9*CELL + 8, top: 14*CELL + 6 }}>GREEN</div>
      <div className="absolute font-black text-yellow-600 text-[11px] tracking-wider pointer-events-none select-none"
        style={{ left: 8, top: 14*CELL + 6 }}>YELLOW</div>
    </div>
  )
}
