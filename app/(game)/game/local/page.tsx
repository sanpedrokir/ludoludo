'use client'

import { Suspense, useEffect, useReducer, useCallback, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import LudoBoard from '@/components/board/LudoBoard'
import BoardScaler from '@/components/board/BoardScaler'
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
import { addBalance, getMyBalanceAndAvatar } from '@/lib/actions/economy'
import { playCashSound } from '@/lib/sounds'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
import PlayerAvatar from '@/components/PlayerAvatar'
import { isOnMainTrack } from '@/lib/game/engine'

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

function LocalGameContent() {
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

  const { user } = useUser()
  const [earnNotif, setEarnNotif] = useState<{ amount: number; label: string } | null>(null)
  const [balance, setBalance] = useState<number>(0)
  const [myAvatarId, setMyAvatarId] = useState<number>(1)
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishedHandledRef = useRef(false)

  // Fetch balance on mount and keep live
  useEffect(() => {
    if (!user) return
    getMyBalanceAndAvatar().then(({ balance, avatarId }) => {
      setBalance(balance)
      setMyAvatarId(avatarId)
    })
  }, [user])

  const onBalanceUpdated = useCallback((payload: { balance: number }) => {
    if (typeof payload.balance === 'number') setBalance(payload.balance)
  }, [])

  usePusherChannel(user ? `profile:${user.id}` : null, [{ event: 'balance-updated', onEvent: onBalanceUpdated }])

  const currentPlayer = state.players[state.currentPlayerOrder]
  const isMyTurn = currentPlayer?.color === myColor
  const isFinished = state.phase === 'finished'

  const validMoves = state.diceValue !== null
    ? getValidMoves(state.tokens, currentPlayer.color, state.diceValue)
    : []

  const allMyTokensInBase = isMyTurn &&
    state.tokens.filter(t => t.color === myColor).every(t => t.position === -1)

  function earnCash(amount: number, label: string) {
    playCashSound()
    setBalance(prev => prev + amount)
    setEarnNotif({ amount, label })
    setTimeout(() => setEarnNotif(null), 2200)
    addBalance(amount).catch(console.error)
  }

  function deductCash(amount: number, label: string) {
    setBalance(prev => prev - amount)
    setEarnNotif({ amount: -amount, label })
    setTimeout(() => setEarnNotif(null), 2200)
    addBalance(-amount).catch(console.error)
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
          if (chosen !== -1) {
            const result = applyMove(state.tokens, currentPlayer.color, chosen, state.diceValue!)
            if (result.captured) {
              const myBefore = state.tokens.filter(t => t.color === myColor && isOnMainTrack(t))
              const myAfter = result.tokens.filter(t => t.color === myColor && isOnMainTrack(t))
              if (myBefore.length > myAfter.length) deductCash(500, '💀 Token sent back!')
            }
          }
          dispatch({ type: chosen === -1 ? 'SKIP_TURN' : 'MOVE', tokenIndex: chosen })
        }
      }, 700)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, state.phase, state.diceValue, state.tokens, isFinished, myColor])

  useEffect(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    handleAiTurn()
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current) }
  }, [handleAiTurn])

  function handleRoll() {
    if (!isMyTurn || state.phase !== 'roll' || isFinished) return
    const value = rollDice()
    // No dice reward until the player has at least one token out of the base
    const hasStarted = state.tokens.some(t => t.color === myColor && t.position !== -1)
    if (hasStarted) earnCash(value === 6 ? 600 : value * 10, `🎲 Dice ${value}!`)
    dispatch({ type: 'ROLL', value })
    if (getValidMoves(state.tokens, myColor, value).length === 0) {
      setTimeout(() => dispatch({ type: 'SKIP_TURN' }), 500)
    }
  }

  function handleTokenClick(color: Color, index: number) {
    if (!isMyTurn || state.phase !== 'move' || state.diceValue === null) return
    if (color === myColor) {
      const result = applyMove(state.tokens, color, index, state.diceValue)
      if (result.captured) earnCash(1000, '🎯 Capture!')
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
      {/* Cash notification — big, center-bottom */}
      {earnNotif && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce pointer-events-none">
          <div className={`${earnNotif.amount < 0 ? 'bg-red-500' : 'bg-green-500'} text-white font-black text-2xl px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 whitespace-nowrap`}>
            <span>{earnNotif.amount < 0 ? '💸' : '💰'}</span>
            <span>{earnNotif.amount < 0 ? `-$${Math.abs(earnNotif.amount).toLocaleString()}` : `+$${earnNotif.amount.toLocaleString()}`}</span>
          </div>
          <div className={`mt-1 ${earnNotif.amount < 0 ? 'text-red-400' : 'text-green-400'} font-semibold text-sm`}>{earnNotif.label}</div>
        </div>
      )}

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow">
        <PlayerAvatar
          avatarId={isMyTurn ? myAvatarId : undefined}
          isComputer={currentPlayer.isComputer}
          size="sm"
        />
        <span className="font-semibold text-amber-900 text-sm">
          {isMyTurn ? 'Your turn' : `${currentPlayer.displayName}'s turn`}
        </span>
      </div>

      <BoardScaler>
        <LudoBoard
          tokens={state.tokens}
          currentColor={currentPlayer.color}
          validMoves={isMyTurn ? validMoves : []}
          onTokenClick={handleTokenClick}
        />
      </BoardScaler>

      {/* Roll-a-6 hint */}
      {allMyTokensInBase && state.phase === 'roll' && (
        <p className="text-amber-500 text-xs">Roll a 1 or 6 to bring a token onto the board</p>
      )}

      <div className="flex items-center gap-4 bg-white rounded-2xl shadow px-5 py-3 w-full max-w-sm justify-between">
        {/* Live balance */}
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Balance</span>
          <span className="text-amber-700 font-black text-base">${balance.toLocaleString()}</span>
        </div>

        {/* Dice + action */}
        <div className="flex items-center gap-3">
          {state.diceValue !== null && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-amber-500 font-semibold">Rolled</span>
              <div className="w-14 h-14 rounded-xl bg-amber-600 text-white flex items-center justify-center text-3xl font-black shadow">
                {state.diceValue}
              </div>
            </div>
          )}
          {isMyTurn && state.phase === 'roll' && (
            <button
              onClick={handleRoll}
              className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-black text-base hover:bg-amber-700 active:scale-95 transition-all shadow"
            >
              Roll 🎲
            </button>
          )}
          {isMyTurn && state.phase === 'move' && validMoves.length === 0 && (
            <button
              onClick={() => dispatch({ type: 'SKIP_TURN' })}
              className="px-5 py-3 rounded-2xl bg-gray-400 text-white font-bold hover:bg-gray-500 transition-colors"
            >
              Skip
            </button>
          )}
          {!isMyTurn && <span className="text-amber-500 text-sm animate-pulse">Waiting…</span>}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {state.players.map(p => (
          <div
            key={p.color}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl text-xs font-semibold border-2 ${
              p.color === currentPlayer.color ? 'border-amber-600' : 'border-transparent'
            } ${
              p.color === 'red' ? 'bg-red-100 text-red-800' :
              p.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              p.color === 'green' ? 'bg-green-100 text-green-800' :
              'bg-yellow-100 text-yellow-800'
            }`}
          >
            <PlayerAvatar
              avatarId={p.color === myColor ? myAvatarId : undefined}
              isComputer={p.isComputer}
              size="sm"
            />
            <span>{p.displayName}</span>
            <span className="opacity-70">{p.tokensDone}/4</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push('/home')}
        className="text-xs text-amber-400 hover:text-amber-600 underline"
      >
        Leave game
      </button>

    </div>
  )
}

export default function LocalGamePage() {
  return (
    <Suspense>
      <LocalGameContent />
    </Suspense>
  )
}
