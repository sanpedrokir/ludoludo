export type Color = 'red' | 'blue' | 'green' | 'yellow'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type GamePhase = 'roll' | 'move' | 'finished'
export type GameMode = 'computer' | 'online'

export interface TokenState {
  color: Color
  index: number       // 0–3 which token of that color
  position: number    // -1=home, 0–51=main track (relative), 52–56=final lane, 57=done
}

export interface PlayerState {
  color: Color
  isComputer: boolean
  difficulty?: Difficulty
  turnOrder: number   // 0–3
  playerId?: string   // null for computer players
  displayName: string
  rank?: number
  tokensDone: number
  capturesMade: number
  status: 'active' | 'disconnected' | 'forfeited'
}

export interface GameState {
  roomId: string
  players: PlayerState[]
  tokens: TokenState[]
  currentPlayerOrder: number  // index into players array
  diceValue: number | null
  phase: GamePhase
}

// Starting absolute track positions for each color
export const PLAYER_TRACK_START: Record<Color, number> = {
  red: 0,
  blue: 13,
  green: 26,
  yellow: 39,
}

// Safe squares on the absolute track (cannot be captured there)
export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47])

export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow']

export const AVATAR_COUNT = 8
