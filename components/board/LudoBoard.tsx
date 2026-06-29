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

// Token home circle positions for rendering empty slots
const HOME_CIRCLES: Record<string, Color> = {}
for (const color of Object.keys(HOME_TOKEN_POSITIONS) as Color[]) {
  for (const [r, c] of HOME_TOKEN_POSITIONS[color]) {
    HOME_CIRCLES[`${r},${c}`] = color
  }
}

// 3D token gradient colors
const TOKEN_COLORS: Record<Color, { light: string; dark: string; border: string }> = {
  red:    { light: '#fca5a5', dark: '#dc2626', border: '#b91c1c' },
  blue:   { light: '#93c5fd', dark: '#2563eb', border: '#1d4ed8' },
  green:  { light: '#6ee7b7', dark: '#059669', border: '#047857' },
  yellow: { light: '#fde047', dark: '#ca8a04', border: '#a16207' },
}

// Safe square star positions (non-starting safe squares)
const SAFE_STAR_COORDS = new Set<string>()
for (let i = 0; i < TRACK_COORDS.length; i++) {
  if (SAFE_SQUARES.has(i)) {
    const [r, c] = TRACK_COORDS[i]
    SAFE_STAR_COORDS.add(`${r},${c}`)
  }
}

interface Props {
  tokens: TokenState[]
  currentColor: Color
  validMoves: number[]
  onTokenClick?: (color: Color, index: number) => void
}

export default function LudoBoard({ tokens, currentColor, validMoves, onTokenClick }: Props) {
  const boardSize = 15 * CELL

  // Build cell → tokens map
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
    const { light, dark, border } = TOKEN_COLORS[token.color]
    return (
      <button
        key={`${token.color}-${token.index}`}
        onClick={() => isValid && onTokenClick?.(token.color, token.index)}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, ${light}, ${dark})`,
          boxShadow: isValid
            ? `0 0 0 3px white, 0 0 0 5px ${light}, 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 3px rgba(255,255,255,0.5)`
            : `0 3px 8px rgba(0,0,0,0.45), inset 0 1px 3px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.25)`,
          border: `2px solid ${border}`,
          flexShrink: 0,
        }}
        className={`
          rounded-full font-black text-white flex items-center justify-center select-none
          ${size >= 24 ? 'text-xs' : 'text-[9px]'}
          ${isValid ? 'scale-110 cursor-pointer animate-pulse' : 'cursor-default'}
          transition-transform duration-150
        `}
        title={isValid ? 'Click to move' : ''}
      >
        {token.index + 1}
      </button>
    )
  }

  function getCellStyle(row: number, col: number): { className: string; style?: React.CSSProperties } {
    const key = `${row},${col}`

    // Home areas — softer 500-level outer, very light inner yards
    if (row <= 5 && col <= 5) {
      const isYard = row >= 1 && row <= 4 && col >= 1 && col <= 4
      return { className: isYard ? 'bg-red-50' : 'bg-red-500' }
    }
    if (row <= 5 && col >= 9) {
      const isYard = row >= 1 && row <= 4 && col >= 10 && col <= 13
      return { className: isYard ? 'bg-blue-50' : 'bg-blue-500' }
    }
    if (row >= 9 && col >= 9) {
      const isYard = row >= 10 && row <= 13 && col >= 10 && col <= 13
      return { className: isYard ? 'bg-emerald-50' : 'bg-emerald-500' }
    }
    if (row >= 9 && col <= 5) {
      const isYard = row >= 10 && row <= 13 && col >= 1 && col <= 4
      return { className: isYard ? 'bg-yellow-50' : 'bg-yellow-400' }
    }

    // Center (handled by SVG overlay)
    if (row >= 6 && row <= 8 && col >= 6 && col <= 8) return { className: 'bg-white' }

    // Final lanes
    if (col === 7 && row >= 9 && row <= 13) return { className: 'bg-red-300' }
    if (row === 7 && col >= 1 && col <= 5)  return { className: 'bg-blue-300' }
    if (col === 7 && row >= 1 && row <= 5)  return { className: 'bg-emerald-300' }
    if (row === 7 && col >= 9 && col <= 13) return { className: 'bg-yellow-200' }

    // Starting squares
    if (row === 13 && col === 6) return { className: 'bg-red-200' }
    if (row === 6  && col === 1) return { className: 'bg-blue-200' }
    if (row === 1  && col === 8) return { className: 'bg-emerald-200' }
    if (row === 8  && col === 13) return { className: 'bg-yellow-200' }

    // Safe squares
    if (SAFE_STAR_COORDS.has(key)) return { className: 'bg-amber-100' }

    return { className: 'bg-white' }
  }

  function CellContent({ row, col }: { row: number; col: number }) {
    const key = `${row},${col}`
    const here = cellTokens.get(key) ?? []
    const isSafe = SAFE_STAR_COORDS.has(key)
    const homeCircleColor = HOME_CIRCLES[key]

    return (
      <>
        {/* Empty home token slot */}
        {homeCircleColor && here.length === 0 && (
          <div
            className="absolute inset-2 rounded-full opacity-40"
            style={{
              background: `radial-gradient(circle at 40% 35%, ${TOKEN_COLORS[homeCircleColor].light}, ${TOKEN_COLORS[homeCircleColor].dark})`,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        )}
        {/* Safe square star */}
        {isSafe && here.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-amber-500 text-base pointer-events-none select-none">
            ★
          </div>
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
      </>
    )
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden select-none"
      style={{
        width: boardSize,
        height: boardSize,
        boxShadow: [
          '0 0 0 4px #92400e',
          '0 0 0 7px #78350f',
          '0 0 0 9px #451a03',
          '0 20px 40px rgba(0,0,0,0.6)',
          '0 8px 16px rgba(0,0,0,0.4)',
        ].join(', '),
      }}
    >
      {/* Grid cells */}
      {Array.from({ length: 15 }, (_, row) =>
        Array.from({ length: 15 }, (_, col) => {
          const { className, style } = getCellStyle(row, col)
          const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8
          return (
            <div
              key={`${row}-${col}`}
              className={`absolute ${className}`}
              style={{
                left: col * CELL,
                top: row * CELL,
                width: CELL,
                height: CELL,
                borderRight: isCenter ? 'none' : '1px solid rgba(0,0,0,0.08)',
                borderBottom: isCenter ? 'none' : '1px solid rgba(0,0,0,0.08)',
                ...style,
              }}
            >
              <CellContent row={row} col={col} />
            </div>
          )
        })
      )}

      {/* Home yard rounded overlays */}
      {/* Red yard */}
      <div className="absolute rounded-2xl border-4 border-red-400/40 pointer-events-none"
        style={{ left: CELL + 4, top: CELL + 4, width: 4*CELL - 8, height: 4*CELL - 8,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }} />
      {/* Blue yard */}
      <div className="absolute rounded-2xl border-4 border-blue-400/40 pointer-events-none"
        style={{ left: 10*CELL + 4, top: CELL + 4, width: 4*CELL - 8, height: 4*CELL - 8,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }} />
      {/* Green yard */}
      <div className="absolute rounded-2xl border-4 border-emerald-400/40 pointer-events-none"
        style={{ left: 10*CELL + 4, top: 10*CELL + 4, width: 4*CELL - 8, height: 4*CELL - 8,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }} />
      {/* Yellow yard */}
      <div className="absolute rounded-2xl border-4 border-yellow-500/40 pointer-events-none"
        style={{ left: CELL + 4, top: 10*CELL + 4, width: 4*CELL - 8, height: 4*CELL - 8,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }} />

      {/* Center SVG — 4 color triangles meeting at middle */}
      <svg
        className="absolute pointer-events-none"
        style={{ left: 6*CELL, top: 6*CELL, width: 3*CELL, height: 3*CELL }}
        viewBox="0 0 3 3"
      >
        {/* Red — from bottom */}
        <polygon points="0,3 3,3 1.5,1.5" fill="#ef4444" opacity="0.9" />
        {/* Blue — from left */}
        <polygon points="0,0 0,3 1.5,1.5" fill="#3b82f6" opacity="0.9" />
        {/* Green — from top */}
        <polygon points="0,0 3,0 1.5,1.5" fill="#10b981" opacity="0.9" />
        {/* Yellow — from right */}
        <polygon points="3,0 3,3 1.5,1.5" fill="#eab308" opacity="0.9" />
        {/* Center star circle */}
        <circle cx="1.5" cy="1.5" r="0.55" fill="#fef3c7" stroke="white" strokeWidth="0.08" />
        <text x="1.5" y="1.78" textAnchor="middle" fontSize="0.65" fill="#92400e" fontWeight="bold">★</text>
      </svg>

      {/* Done tokens counter overlay on center */}
      {Object.entries(doneCount).some(([, n]) => n > 0) && (
        <div
          className="absolute flex flex-wrap gap-1 items-center justify-center pointer-events-none"
          style={{ left: 6*CELL, top: 6*CELL, width: 3*CELL, height: 3*CELL, padding: 2 }}
        >
          {(['red', 'blue', 'green', 'yellow'] as Color[]).map(c =>
            doneCount[c] > 0 ? (
              <span
                key={c}
                className="text-[9px] font-black text-white px-1 rounded-full leading-tight"
                style={{
                  background: `radial-gradient(circle at 35% 30%, ${TOKEN_COLORS[c].light}, ${TOKEN_COLORS[c].dark})`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              >
                {doneCount[c]}
              </span>
            ) : null
          )}
        </div>
      )}

      {/* Home area color labels */}
      <div className="absolute font-black text-white/90 text-[10px] tracking-wider pointer-events-none select-none drop-shadow"
        style={{ left: 1.2*CELL, top: 0.3*CELL }}>RED</div>
      <div className="absolute font-black text-white/90 text-[10px] tracking-wider pointer-events-none select-none drop-shadow"
        style={{ left: 10.2*CELL, top: 0.3*CELL }}>BLUE</div>
      <div className="absolute font-black text-white/90 text-[10px] tracking-wider pointer-events-none select-none drop-shadow"
        style={{ left: 10*CELL, top: 14.4*CELL }}>GREEN</div>
      <div className="absolute font-black text-amber-900/80 text-[10px] tracking-wider pointer-events-none select-none drop-shadow"
        style={{ left: 0.8*CELL, top: 14.4*CELL }}>YELLOW</div>
    </div>
  )
}
