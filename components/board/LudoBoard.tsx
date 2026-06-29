'use client'

import { Color, TokenState, PLAYER_TRACK_START, SAFE_SQUARES } from '@/lib/game/types'
import { toAbsolutePosition, isDone, isHome, isInFinalLane } from '@/lib/game/engine'

// --- Board geometry constants ---
// The board is a 15×15 grid of cells.
// Each cell is CELL_SIZE px. Total board: 15 * CELL_SIZE.
const CELL = 40 // px per cell

// Track squares on the board follow a specific path.
// We map absolute positions (0–51) to [row, col] grid coordinates.
// Standard Ludo board layout (0,0 = top-left):
// Red home top-left, Blue top-right, Green bottom-right, Yellow bottom-left.

// The main track runs clockwise. Row/col are 0-indexed on a 15-cell grid.
const TRACK_COORDS: [number, number][] = [
  // Red path out (position 0 = red start, col 6 row 13..7)
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],  // 0-4
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], // 5-10 (left turn)
  [7, 0], // 11
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],  // 12-17 (up left side)
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], // 18-23 (up center-left)
  [0, 7], // 24
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], // 25-30 (down right side top)
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], // 31-36 (right turn top)
  [7, 14], // 37
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], // 38-43 (right turn bottom)
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], // 44-49 (down center-right)
  [14, 7], // 50
  [13, 7], // 51 — position before red home column entrance
]

// Final lane coordinates per color (positions 52–56, toward center at [7,7])
const FINAL_LANE_COORDS: Record<Color, [number, number][]> = {
  red:    [[12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  blue:   [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green:  [[2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
}

// Home area token positions (the 4 starting circles per color)
const HOME_TOKEN_POSITIONS: Record<Color, [number, number][]> = {
  red:    [[2, 2], [2, 4], [4, 2], [4, 4]],
  blue:   [[2, 10], [2, 12], [4, 10], [4, 12]],
  green:  [[10, 10], [10, 12], [12, 10], [12, 12]],
  yellow: [[10, 2], [10, 4], [12, 2], [12, 4]],
}

const COLOR_CLASS: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-600',
  yellow: 'bg-yellow-400',
}

const COLOR_LIGHT: Record<Color, string> = {
  red: 'bg-red-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  yellow: 'bg-yellow-100',
}

const COLOR_SAFE_MARKER: Record<Color, string> = {
  red: '★',
  blue: '★',
  green: '★',
  yellow: '★',
}

interface Props {
  tokens: TokenState[]
  currentColor: Color
  validMoves: number[]
  onTokenClick?: (color: Color, index: number) => void
  highlightColor?: Color
}

export default function LudoBoard({ tokens, currentColor, validMoves, onTokenClick, highlightColor }: Props) {
  const boardSize = 15 * CELL

  // Build a map of grid cell → tokens on that cell
  const cellTokens = new Map<string, TokenState[]>()

  for (const token of tokens) {
    let coords: [number, number] | null = null

    if (isDone(token)) {
      // Tokens in center — drawn separately
      continue
    } else if (isHome(token)) {
      coords = HOME_TOKEN_POSITIONS[token.color][token.index]
    } else if (isInFinalLane(token)) {
      const laneIndex = token.position - 52
      coords = FINAL_LANE_COORDS[token.color][laneIndex]
    } else {
      // Main track
      const absPos = toAbsolutePosition(token.color, token.position)
      coords = TRACK_COORDS[absPos]
    }

    if (coords) {
      const key = `${coords[0]},${coords[1]}`
      if (!cellTokens.has(key)) cellTokens.set(key, [])
      cellTokens.get(key)!.push(token)
    }
  }

  // Count done tokens per color for center display
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
        style={{ width: size, height: size }}
        className={`
          rounded-full border-2 border-white font-bold text-white text-xs shadow flex items-center justify-center
          ${COLOR_CLASS[token.color]}
          ${isValid ? 'ring-4 ring-white ring-opacity-80 scale-110 cursor-pointer animate-pulse' : 'cursor-default'}
          transition-transform
        `}
        title={isValid ? 'Click to move' : ''}
      >
        {token.index + 1}
      </button>
    )
  }

  function CellContent({ row, col }: { row: number; col: number }) {
    const key = `${row},${col}`
    const here = cellTokens.get(key) ?? []

    if (here.length === 0) return null

    if (here.length === 1) {
      return (
        <div className="absolute inset-0 flex items-center justify-center">
          {renderToken(here[0])}
        </div>
      )
    }

    // Stack multiple tokens
    return (
      <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 p-0.5">
        {here.map(t => renderToken(t, 16))}
      </div>
    )
  }

  // Determine cell background color based on board layout
  function getCellBg(row: number, col: number): string {
    // Home areas (6×6 squares in each corner)
    if (row <= 5 && col <= 5) return 'bg-red-200'
    if (row <= 5 && col >= 9) return 'bg-blue-200'
    if (row >= 9 && col >= 9) return 'bg-green-200'
    if (row >= 9 && col <= 5) return 'bg-yellow-200'

    // Center (3×3)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return 'bg-amber-100'

    // Color final lanes
    if (col === 7 && row >= 9 && row <= 13) return 'bg-red-100'
    if (row === 7 && col >= 1 && col <= 5) return 'bg-blue-100'
    if (col === 7 && row >= 1 && row <= 5) return 'bg-green-100'
    if (row === 7 && col >= 9 && col <= 13) return 'bg-yellow-100'

    // Safe squares on main track
    const absIdx = TRACK_COORDS.findIndex(([r, c]) => r === row && c === col)
    if (absIdx !== -1 && SAFE_SQUARES.has(absIdx)) return 'bg-amber-200'

    // Starting squares per color (first cell of each player)
    if (row === 13 && col === 6) return 'bg-red-300'
    if (row === 6 && col === 1) return 'bg-blue-300'
    if (row === 1 && col === 8) return 'bg-green-300'
    if (row === 8 && col === 13) return 'bg-yellow-300'

    return 'bg-white'
  }

  return (
    <div
      className="relative border-4 border-amber-800 rounded-2xl overflow-hidden shadow-2xl"
      style={{ width: boardSize, height: boardSize }}
    >
      {/* Grid cells */}
      {Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => {
          const bg = getCellBg(row, col)
          return (
            <div
              key={`${row}-${col}`}
              className={`absolute border border-amber-200/40 ${bg}`}
              style={{
                left: col * CELL,
                top: row * CELL,
                width: CELL,
                height: CELL,
              }}
            >
              <CellContent row={row} col={col} />
            </div>
          )
        })
      )}

      {/* Center star / finish */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ left: 6 * CELL, top: 6 * CELL, width: 3 * CELL, height: 3 * CELL }}
      >
        <div className="text-4xl select-none">⭐</div>
        <div className="flex gap-1 mt-1">
          {(['red', 'blue', 'green', 'yellow'] as Color[]).map(c => (
            doneCount[c] > 0 && (
              <span key={c} className={`text-xs font-bold px-1 rounded ${COLOR_CLASS[c]} text-white`}>
                {doneCount[c]}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Home area labels */}
      <div className="absolute text-xs font-black text-red-700 pointer-events-none select-none"
        style={{ left: 2.5 * CELL, top: 2.5 * CELL }}>RED</div>
      <div className="absolute text-xs font-black text-blue-700 pointer-events-none select-none"
        style={{ left: 10.5 * CELL, top: 2.5 * CELL }}>BLUE</div>
      <div className="absolute text-xs font-black text-green-700 pointer-events-none select-none"
        style={{ left: 10.5 * CELL, top: 11 * CELL }}>GREEN</div>
      <div className="absolute text-xs font-black text-yellow-700 pointer-events-none select-none"
        style={{ left: 2 * CELL, top: 11 * CELL }}>YELLOW</div>
    </div>
  )
}
