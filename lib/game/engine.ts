import {
  Color,
  GameState,
  TokenState,
  PLAYER_TRACK_START,
  SAFE_SQUARES,
  COLORS,
  PlayerState,
} from './types'

// Convert a player's relative position (0–51) to an absolute track square (0–51)
export function toAbsolutePosition(color: Color, relative: number): number {
  return (PLAYER_TRACK_START[color] + relative) % 52
}

// Convert absolute track square back to a player's relative position
export function toRelativePosition(color: Color, absolute: number): number {
  const start = PLAYER_TRACK_START[color]
  return (absolute - start + 52) % 52
}

// Is a token currently on the main shared track (not home, not final lane, not done)?
export function isOnMainTrack(token: TokenState): boolean {
  return token.position >= 0 && token.position <= 51
}

export function isHome(token: TokenState): boolean {
  return token.position === -1
}

export function isDone(token: TokenState): boolean {
  return token.position === 57
}

export function isInFinalLane(token: TokenState): boolean {
  return token.position >= 52 && token.position <= 56
}

// Check if a token at a given relative position is on a safe square
export function isSafePosition(color: Color, relativePos: number): boolean {
  if (relativePos < 0 || relativePos > 51) return true // home and final lane are always safe
  const abs = toAbsolutePosition(color, relativePos)
  return SAFE_SQUARES.has(abs)
}

// Returns the tokens belonging to a specific color
export function getTokensByColor(tokens: TokenState[], color: Color): TokenState[] {
  return tokens.filter(t => t.color === color)
}

// Build the initial 16 tokens (all at home)
export function buildInitialTokens(colors: Color[]): TokenState[] {
  return colors.flatMap(color =>
    [0, 1, 2, 3].map(index => ({ color, index, position: -1 }))
  )
}

interface MoveResult {
  tokens: TokenState[]
  captured: boolean
  bonusTurn: boolean
}

// Apply a move: move token at `tokenIndex` for `color` by `diceValue` steps.
// Returns updated tokens, whether a capture happened, and whether the player earns a bonus turn.
export function applyMove(
  tokens: TokenState[],
  color: Color,
  tokenIndex: number,
  diceValue: number
): MoveResult {
  let captured = false
  const updated = tokens.map(t => {
    if (t.color !== color || t.index !== tokenIndex) return t

    let newPos: number

    if (t.position === -1) {
      // Entering the board on a six
      newPos = 0
    } else if (t.position <= 51) {
      newPos = t.position + diceValue
      if (newPos > 51) {
        // Enter the final lane
        newPos = 52 + (newPos - 52)
      }
    } else {
      // Already in final lane (52–56)
      newPos = t.position + diceValue
    }

    // Mark as done if reached center (position 57)
    if (newPos >= 57) newPos = 57

    return { ...t, position: newPos }
  })

  // Check for captures: if moved token is on main track, see if it lands on an opponent
  const movedToken = updated.find(t => t.color === color && t.index === tokenIndex)!
  if (isOnMainTrack(movedToken)) {
    const absPos = toAbsolutePosition(color, movedToken.position)
    if (!SAFE_SQUARES.has(absPos)) {
      // Return any opponent token on the same absolute square to home
      const final = updated.map(t => {
        if (t.color === color) return t
        if (!isOnMainTrack(t)) return t
        if (toAbsolutePosition(t.color, t.position) === absPos) {
          captured = true
          return { ...t, position: -1 }
        }
        return t
      })
      return {
        tokens: final,
        captured,
        bonusTurn: diceValue === 6 || captured,
      }
    }
  }

  return {
    tokens: updated,
    captured: false,
    bonusTurn: diceValue === 6,
  }
}

// Get valid token indices for the current player given dice value.
// Returns array of token indices that can legally move.
export function getValidMoves(tokens: TokenState[], color: Color, diceValue: number): number[] {
  const myTokens = getTokensByColor(tokens, color)
  const valid: number[] = []

  for (const token of myTokens) {
    if (isDone(token)) continue

    if (isHome(token)) {
      if (diceValue === 6) valid.push(token.index)
      continue
    }

    const newPos = token.position + diceValue

    if (isOnMainTrack(token)) {
      if (newPos <= 51) {
        valid.push(token.index)
      } else {
        // Entering final lane
        const finalPos = 52 + (newPos - 52)
        if (finalPos <= 57) valid.push(token.index)
      }
    } else if (isInFinalLane(token)) {
      const finalPos = token.position + diceValue
      if (finalPos <= 57) valid.push(token.index)
    }
  }

  return valid
}

// Advance turn to the next active player
export function nextPlayer(state: GameState): number {
  const activePlayers = state.players.filter(p => p.status === 'active' && p.tokensDone < 4)
  if (activePlayers.length === 0) return state.currentPlayerOrder

  let next = (state.currentPlayerOrder + 1) % state.players.length
  let attempts = 0
  while (attempts < state.players.length) {
    const player = state.players[next]
    if (player.status === 'active') {
      const myTokens = getTokensByColor(state.tokens, player.color)
      const allDone = myTokens.every(isDone)
      if (!allDone) return next
    }
    next = (next + 1) % state.players.length
    attempts++
  }
  return next
}

// Check if the game is completely finished
export function isGameFinished(state: GameState): boolean {
  const activePlayers = state.players.filter(p => p.status === 'active')
  const unfinished = activePlayers.filter(p => {
    const myTokens = getTokensByColor(state.tokens, p.color)
    return !myTokens.every(isDone)
  })
  return unfinished.length <= 1
}

// Assign ranks to players based on who finished first
export function assignRank(players: PlayerState[], color: Color, nextRank: number): PlayerState[] {
  return players.map(p => {
    if (p.color === color && p.rank == null) {
      return { ...p, rank: nextRank }
    }
    return p
  })
}

// Count how many tokens of a color are done
export function countDoneTokens(tokens: TokenState[], color: Color): number {
  return tokens.filter(t => t.color === color && isDone(t)).length
}

// Generate a random 6-digit room code
export function generateRoomCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Generate initial game state for a local computer game
export function createLocalGameState(
  roomId: string,
  players: PlayerState[]
): GameState {
  const colors = players.map(p => p.color)
  return {
    roomId,
    players,
    tokens: buildInitialTokens(colors),
    currentPlayerOrder: 0,
    diceValue: null,
    phase: 'roll',
  }
}

// Build PlayerState objects for a local vs-computer game
export function buildComputerGamePlayers(
  userColor: Color,
  numPlayers: number,
  difficulty: import('./types').Difficulty,
  userDisplayName: string
): PlayerState[] {
  const colors = COLORS.slice(0, numPlayers)
  return colors.map((color, i) => {
    const isUser = color === userColor
    return {
      color,
      isComputer: !isUser,
      difficulty: isUser ? undefined : difficulty,
      turnOrder: i,
      displayName: isUser ? userDisplayName : `CPU ${i}`,
      tokensDone: 0,
      capturesMade: 0,
      status: 'active',
    }
  })
}
