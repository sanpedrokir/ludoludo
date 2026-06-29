import { Color, Difficulty, TokenState } from './types'
import {
  getValidMoves,
  toAbsolutePosition,
  isOnMainTrack,
  isSafePosition,
  getTokensByColor,
  isHome,
  isDone,
} from './engine'

// Choose which token index to move for a computer player
export function chooseComputerMove(
  tokens: TokenState[],
  color: Color,
  diceValue: number,
  difficulty: Difficulty
): number {
  const valid = getValidMoves(tokens, color, diceValue)
  if (valid.length === 0) return -1
  if (valid.length === 1) return valid[0]

  switch (difficulty) {
    case 'easy':
      return valid[Math.floor(Math.random() * valid.length)]
    case 'normal':
      return chooseMoveNormal(tokens, color, diceValue, valid)
    case 'hard':
      return chooseMoveHard(tokens, color, diceValue, valid)
  }
}

function chooseMoveNormal(
  tokens: TokenState[],
  color: Color,
  diceValue: number,
  valid: number[]
): number {
  // Priority: capture > move out of home > advance furthest token > random
  const captureIndex = findCapture(tokens, color, diceValue, valid)
  if (captureIndex !== -1) return captureIndex

  // Move a token out of home (position -1 → 0)
  const homeExit = valid.find(i => {
    const t = tokens.find(t => t.color === color && t.index === i)!
    return isHome(t)
  })
  if (homeExit !== undefined) return homeExit

  // Advance the token that is furthest along
  return getFurthestToken(tokens, color, valid)
}

function chooseMoveHard(
  tokens: TokenState[],
  color: Color,
  diceValue: number,
  valid: number[]
): number {
  // Priority: capture > move into safe zone > advance into final lane > furthest token
  const captureIndex = findCapture(tokens, color, diceValue, valid)
  if (captureIndex !== -1) return captureIndex

  // Prefer moving a token to a safe square
  const safeMove = valid.find(i => {
    const t = tokens.find(t => t.color === color && t.index === i)!
    if (isHome(t)) return false
    const newPos = t.position + diceValue
    return isSafePosition(color, newPos)
  })
  if (safeMove !== undefined) return safeMove

  // Prefer moving a token into the final lane
  const finalLaneMove = valid.find(i => {
    const t = tokens.find(t => t.color === color && t.index === i)!
    if (isHome(t) || isDone(t)) return false
    return t.position + diceValue > 51
  })
  if (finalLaneMove !== undefined) return finalLaneMove

  return getFurthestToken(tokens, color, valid)
}

// Returns token index that would capture an opponent, or -1
function findCapture(
  tokens: TokenState[],
  color: Color,
  diceValue: number,
  valid: number[]
): number {
  for (const i of valid) {
    const t = tokens.find(t => t.color === color && t.index === i)!
    if (!isOnMainTrack(t)) continue

    const newRelativePos = t.position + diceValue
    if (newRelativePos > 51) continue

    const newAbsPos = toAbsolutePosition(color, newRelativePos)

    const wouldCapture = tokens.some(other => {
      if (other.color === color) return false
      if (!isOnMainTrack(other)) return false
      return toAbsolutePosition(other.color, other.position) === newAbsPos
    })

    if (wouldCapture) return i
  }
  return -1
}

// Returns the valid token index that is furthest along the track
function getFurthestToken(tokens: TokenState[], color: Color, valid: number[]): number {
  let best = valid[0]
  let bestPos = -Infinity

  for (const i of valid) {
    const t = tokens.find(t => t.color === color && t.index === i)!
    if (t.position > bestPos) {
      bestPos = t.position
      best = i
    }
  }

  return best
}

// Simulate a dice roll (1–6)
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1
}
