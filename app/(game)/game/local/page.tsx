'use client'

import { useEffect, useReducer, useCallback, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import LudoBoard from '@/components/board/LudoBoard'
import BoardScaler from '@/components/board/BoardScaler'
import MusicPlayer from '@/components/MusicPlayer'
import {
  createLocalGameState,
  buildComputerGamePlayers,
  getValidMoves,
  applyMove,
  nextPlayer,
  isGameFinished,
  assignRank,
  countDoneTokens,
} from '@/lib/game/engine'
import { chooseComputerMove, rollDice } from '@/lib/game/ai'
import { Color, Difficulty, GameState } from '@/lib/game/types'
import { addBalance } from '@/lib/actions/economy'

const WIN_REWARDS = [10000, 5000, 1000, 200]
const RANK_LABELS = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th']

type Action =
  | { type: 'ROLL'; value: number }
  | { type: 'MOVE'; tokenIndex: number }
  | { type: 'SKIP_TURN' }

function gameReducer(state: GameState, action: Action): GameState {
  const currentPlayer = state.players[state.currentPlayerOrder]

  if (action.type === 'ROLL') {
    return { ...state, diceValue: action.value, phase: 'move' }
  }

  if (action.type === 'SKIP_TURN') {
    return { ...state, diceValue: null, phase: 'roll', currentPlayerOrder: nextPlayer(state) }
  }

  if (action.type === 'MOVE' && state.diceValue !== null) {
    const result = applyMove(state.tokens, currentPlayer.color, action.tokenIndex, state.diceValue)

    let players = state.players.map(p => {
      if (p.color !== currentPlayer.color) return p
      return {
        ...p,
        capturesMade: result.captured ? p.capturesMade + 1 : p.capturesMade,
        tokensDone: countDoneTokens(result.tokens, p.color),
      }
    })

    const justFinished = countDoneTokens(result.tokens, currentPlayer.color) === 4
    const nextRank = players.filter(p => p.rank != null).length + 1
    if (justFinished && currentPlayer.rank == null) {
      players = assignRank(players, currentPlayer.color, nextRank)
    }

    const newState: GameState = {
      ...state,
      tokens: result.tokens,
      players,
      diceValue: result.bonusTurn ? state.diceValue : null,
      phase: result.bonusTurn ? 'roll' : 'move',
      currentPlayerOrder: result.bonusTurn ? state.currentPlayerOrder : nextPlayer({ ...state, players }),
    }

    if (isGameFinished(newState)) {
      const lastPlayer = newState.players.find(p => p.rank == null)
      const finalPlayers = lastPlayer
        ? assignRank(newState.players, lastPlayer.color, newState.players.length)
        : newState.players
      return { ...newState, players: finalPlayers, phase: 'finished' }
    }

    return { ...newState, phase: 'roll' }
  }

  return state
}

export default function LocalGamePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const numPlayers = parseInt(searchParams.get('players') ?? '4')
  const myColor = (searchParams.get('color') ?? 'red') as Color
  const difficulty = (searchParams.get('difficulty') ?? 'normal') as Difficulty

  const [state, dispatch] = useReducer(
    gameReducer,
    null,
    () => {
      const players = buildComputerGamePlayers(myColor, numPlayers, difficulty, 'You')
      return createLocalGameState('local', players)
    }
  )

  const [earnNotif, setEarnNotif] = useState<string | null>(null)
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishedHandledRef = useRef(false)

  const currentPlayer = state.players[state.currentPlayerOrder]
  const isMyTurn = currentPlayer?.color === myColor
  const isFinished = state.phase === 'finished'

  const validMoves = state.diceValue !== null
    ? getValidMoves(state.tokens, currentPlayer.color, state.diceValue)
    : []

  function earnCash(amount: number, label: string) {
    setEarnNotif(`+$${amount.toLocaleString()} ${label}`)
    setTimeout(() => setEarnNotif(null), 2500)
    addBalance(amount).catch(console.error)
  }

  // Win reward on game end
  useEffect(() => {
    if (!isFinished || finishedHandledRef.current) return
    finishedHandledRef.current = true
    const myPlayer = state.players.find(p => p.color === myColor)
    if (!myPlayer) return
    const rank = myPlayer.rank ?? state.players.length
    const reward = WIN_REWARDS[Math.min(rank - 1, WIN_REWARDS.length - 1)]
    earnCash(reward, RANK_LABELS[Math.min(rank - 1, 3)] + ' Place!')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished])

  const handleAiTurn = useCallback(() => {
    if (!currentPlayer?.isComputer || isFinished) return

    if (state.phase === 'roll') {
      aiTimerRef.current = setTimeout(() => {
        dispatch({ type: 'ROLL', value: rollDice() })
      }, 800)
    } else if (state.phase === 'move' && state.diceValue !== null) {
      aiTimerRef.current = setTimeout(() => {
        const valid = getValidMoves(state.tokens, currentPlayer.color, state.diceValue!)
        if (valid.length === 0) {
          dispatch({ type: 'SKIP_TURN' })
        } else {
          const chosen = chooseComputerMove(state.tokens, currentPlayer.color, state.diceValue!, currentPlayer.difficulty!)
          dispatch({ type: chosen === -1 ? 'SKIP_TURN' : 'MOVE', tokenIndex: chosen })
        }
      }, 700)
    }
  }, [currentPlayer, state.phase, state.diceValue, state.tokens, isFinished])

  useEffect(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    handleAiTurn()
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current) }
  }, [handleAiTurn])

  function handleRoll() {
    if (!isMyTurn || state.phase !== 'roll' || isFinished) return
    const value = rollDice()
    earnCash(value * 100, `🎲 Dice ${value}!`)
    dispatch({ type: 'ROLL', value })
    if (getValidMoves(state.tokens, myColor, value).length === 0) {
      setTimeout(() => dispatch({ type: 'SKIP_TURN' }), 500)
    }
  }

  function handleTokenClick(color: Color, index: number) {
    if (!isMyTurn || state.phase !== 'move' || state.diceValue === null) return
    if (color === myColor) {
      const result = applyMove(state.tokens, color, index, state.diceValue)
      if (result.captured) earnCash(2000, '🎯 Capture!')
      const newDone = countDoneTokens(result.tokens, myColor)
      const oldDone = countDoneTokens(state.tokens, myColor)
      if (newDone > oldDone) earnCash(5000 * (newDone - oldDone), '🏠 Token home!')
    }
    dispatch({ type: 'MOVE', tokenIndex: index })
  }

  if (isFinished) {
    const sorted = [...state.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    const myPlayer = state.players.find(p => p.color === myColor)
    const myRank = myPlayer?.rank ?? state.players.length
    const myReward = WIN_REWARDS[Math.min(myRank - 1, WIN_REWARDS.length - 1)]

    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 gap-6">
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl font-black text-amber-900">Game Over!</h2>
        <div className="bg-green-100 border border-green-300 rounded-2xl px-6 py-3 text-center">
          <div className="text-green-700 font-black text-xl">+${myReward.toLocaleString()}</div>
          <div className="text-green-600 text-xs">{RANK_LABELS[Math.min(myRank - 1, 3)]} Place Reward</div>
        </div>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4">
          {sorted.map(p => (
            <div key={p.color} className="flex items-center gap-3 py-2 border-b border-amber-100 last:border-0">
              <span className="text-xl font-black text-amber-600">{p.rank ?? '-'}</span>
              <span className={`w-4 h-4 rounded-full ${
                p.color === 'red' ? 'bg-red-500' : p.color === 'blue' ? 'bg-blue-500' : p.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'
              }`} />
              <span className="font-semibold text-amber-900 flex-1">{p.displayName}</span>
              <span className="text-xs text-amber-500">{p.capturesMade} cap</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 w-full max-w-sm">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 rounded-2xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors"
          >
            Rematch
          </button>
          <button
            onClick={() => router.push('/home')}
            className="flex-1 py-3 rounded-2xl border-2 border-amber-300 text-amber-700 font-bold hover:bg-amber-100 transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center px-2 py-4 gap-4">
      {/* Cash notification */}
      {earnNotif && (
        <div className="fixed top-20 right-3 z-50 bg-green-500 text-white font-black px-4 py-2 rounded-2xl shadow-lg text-sm animate-bounce">
          {earnNotif}
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow">
        <span className={`w-4 h-4 rounded-full ${
          currentPlayer.color === 'red' ? 'bg-red-500' : currentPlayer.color === 'blue' ? 'bg-blue-500' : currentPlayer.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'
        }`} />
        <span className="font-semibold text-amber-900 text-sm">
          {isMyTurn ? 'Your turn' : `${currentPlayer.displayName}'s turn`}
        </span>
        {currentPlayer.isComputer && <span className="text-xs text-amber-500">🤖</span>}
      </div>

      <BoardScaler>
        <LudoBoard
          tokens={state.tokens}
          currentColor={currentPlayer.color}
          validMoves={isMyTurn ? validMoves : []}
          onTokenClick={handleTokenClick}
        />
      </BoardScaler>

      <div className="flex items-center gap-6 bg-white rounded-2xl shadow px-6 py-4">
        {state.diceValue !== null && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-amber-500 font-semibold">Rolled</span>
            <div className="w-14 h-14 rounded-xl bg-amber-600 text-white flex items-center justify-center text-3xl font-black shadow">
              {state.diceValue}
            </div>
          </div>
        )}
        {isMyTurn && state.phase === 'roll' && (
          <button
            onClick={handleRoll}
            className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-black text-lg hover:bg-amber-700 active:scale-95 transition-all shadow"
          >
            Roll 🎲
          </button>
        )}
        {isMyTurn && state.phase === 'move' && validMoves.length === 0 && (
          <button
            onClick={() => dispatch({ type: 'SKIP_TURN' })}
            className="px-6 py-3 rounded-2xl bg-gray-400 text-white font-bold hover:bg-gray-500 transition-colors"
          >
            Skip Turn
          </button>
        )}
        {!isMyTurn && <span className="text-amber-500 text-sm animate-pulse">Waiting…</span>}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {state.players.map(p => (
          <div
            key={p.color}
            className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
              p.color === currentPlayer.color ? 'border-amber-600' : 'border-transparent'
            } ${
              p.color === 'red' ? 'bg-red-100 text-red-800' :
              p.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              p.color === 'green' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}
          >
            {p.displayName} {p.isComputer ? '🤖' : '👤'} {p.tokensDone}/4
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/home')}
        className="text-xs text-amber-400 hover:text-amber-600 underline"
      >
        Leave game
      </button>

      <MusicPlayer />
    </div>
  )
}
