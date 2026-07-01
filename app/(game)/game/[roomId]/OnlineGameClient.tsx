'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import LudoBoard from '@/components/board/LudoBoard'
import BoardScaler from '@/components/board/BoardScaler'
import { createClient } from '@/lib/supabase/client'
import { getValidMoves, applyMove, nextPlayer, isGameFinished, assignRank, countDoneTokens } from '@/lib/game/engine'
import { chooseComputerMove, rollDice } from '@/lib/game/ai'
import { Color, TokenState, GameState, PlayerState } from '@/lib/game/types'
import { leaveRoom, recordOnlineGameResult } from '@/lib/actions/game'
import { addBalance } from '@/lib/actions/economy'
import { playCashSound } from '@/lib/sounds'
import PlayerAvatar from '@/components/PlayerAvatar'
import ChatWindow from '@/components/ChatWindow'

const WIN_REWARDS = [10000, 5000, 1000, 200]
const RANK_LABELS = ['🥇 1st', '🥈 2nd', '🥉 3rd', '4th']

interface DbGameState {
  id: string
  room_id: string
  current_player_order: number
  dice_value: number | null
  phase: string
  tokens: TokenState[]
  updated_at: string
}

interface DbPlayer {
  id: string
  color: Color
  is_computer: boolean
  difficulty?: string
  turn_order: number
  player_id?: string
  status: string
  profiles?: { display_name: string; avatar_id?: number } | null
}

interface Props {
  room: { id: string; game_players: DbPlayer[] }
  initialGameState: DbGameState
  currentUserId: string
  myColor: Color | null
  myDisplayName: string
  pot: number
}

function dbToGameState(db: DbGameState, players: PlayerState[]): GameState {
  return {
    roomId: db.room_id,
    players,
    tokens: db.tokens,
    currentPlayerOrder: db.current_player_order,
    diceValue: db.dice_value,
    phase: db.phase as GameState['phase'],
  }
}

export default function OnlineGameClient({ room, initialGameState, currentUserId, myColor, myDisplayName, pot }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const players: PlayerState[] = room.game_players
    .sort((a, b) => a.turn_order - b.turn_order || a.color.localeCompare(b.color))
    .map(p => ({
      color: p.color,
      isComputer: p.is_computer,
      difficulty: p.difficulty as PlayerState['difficulty'],
      turnOrder: p.turn_order,
      playerId: p.player_id,
      displayName: p.is_computer ? 'CPU' : (p.profiles?.display_name ?? 'Player'),
      avatarId: p.profiles?.avatar_id ?? 1,
      tokensDone: 0,
      capturesMade: 0,
      status: p.status as PlayerState['status'],
    }))

  const [gameState, setGameState] = useState<GameState>(() =>
    dbToGameState(initialGameState, players.map(p => ({
      ...p,
      tokensDone: countDoneTokens(initialGameState.tokens, p.color),
    })))
  )
  const [turnTimer, setTurnTimer] = useState(30)
  const [earnNotif, setEarnNotif] = useState<{ amount: number; label: string } | null>(null)
  const [balance, setBalance] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultSubmittedRef = useRef(false)

  const currentPlayer = gameState.players[gameState.currentPlayerOrder]
  const isMyTurn = currentPlayer?.color === myColor && !currentPlayer.isComputer
  const isFinished = gameState.phase === 'finished'

  const validMoves = gameState.diceValue !== null && isMyTurn
    ? getValidMoves(gameState.tokens, currentPlayer.color, gameState.diceValue)
    : []

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

  // Fetch initial balance on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('balance').eq('id', currentUserId).single()
      .then(({ data }) => setBalance((data as any)?.balance ?? 0))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function persistState(state: GameState) {
    await supabase
      .from('game_states')
      .update({
        current_player_order: state.currentPlayerOrder,
        dice_value: state.diceValue,
        phase: state.phase,
        tokens: state.tokens,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', room.id)
  }

  // Record result once on game end
  useEffect(() => {
    if (!isFinished || resultSubmittedRef.current || !myColor) return
    resultSubmittedRef.current = true
    const myPlayer = gameState.players.find(p => p.color === myColor)
    if (!myPlayer) return
    const anyRanked = gameState.players.some(p => p.rank != null)
    const myRank = anyRanked
      ? (myPlayer.rank ?? gameState.players.length)
      : (myPlayer.status === 'active' ? 1 : gameState.players.length)
    const reward = WIN_REWARDS[Math.min(myRank - 1, WIN_REWARDS.length - 1)]
    earnCash(reward, `${RANK_LABELS[Math.min(myRank - 1, 3)]} Place!`)
    recordOnlineGameResult(myRank, room.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished])

  // Realtime game state
  useEffect(() => {
    const channel = supabase
      .channel(`game:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `room_id=eq.${room.id}` },
        (payload) => {
          const db = payload.new as DbGameState
          setGameState(prev => {
            // Detect if opponent captured one of my tokens (went from main track to base)
            if (myColor) {
              const myPrevOnTrack = prev.tokens.filter(t => t.color === myColor && t.position >= 0 && t.position <= 51)
              const myNewOnTrack = (db.tokens as TokenState[]).filter(t => t.color === myColor && t.position >= 0 && t.position <= 51)
              if (myNewOnTrack.length < myPrevOnTrack.length) {
                setTimeout(() => deductCash(500, '💀 Token sent back!'), 0)
              }
            }
            return {
              ...prev,
              currentPlayerOrder: db.current_player_order,
              diceValue: db.dice_value,
              phase: db.phase as GameState['phase'],
              tokens: db.tokens,
            }
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room.id, supabase])

  // Forfeit detection
  useEffect(() => {
    const channel = supabase
      .channel(`game-players:${room.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_players', filter: `room_id=eq.${room.id}` },
        (payload) => {
          const updated = payload.new as { player_id: string; status: string }
          if (updated.status !== 'forfeited') return
          setGameState(prev => ({
            ...prev,
            players: prev.players.map(p =>
              p.playerId === updated.player_id ? { ...p, status: 'forfeited' as const } : p
            ),
          }))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [room.id, supabase])

  // Turn timer
  useEffect(() => {
    if (isFinished) return
    setTurnTimer(30)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTurnTimer(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          if (isMyTurn) {
            if (gameState.phase === 'roll') handleRoll()
            else handleSkip()
          }
          return 30
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayerOrder, gameState.phase, isFinished])

  const handleAiTurn = useCallback(() => {
    if (!currentPlayer?.isComputer || isFinished) return
    const isHost = room.game_players.find(p => !p.is_computer)?.player_id === currentUserId
    if (!isHost) return

    if (gameState.phase === 'roll') {
      aiTimerRef.current = setTimeout(async () => {
        const value = rollDice()
        const newState = { ...gameState, diceValue: value, phase: 'move' as const }
        setGameState(newState)
        await persistState(newState)
      }, 900)
    } else if (gameState.phase === 'move' && gameState.diceValue !== null) {
      aiTimerRef.current = setTimeout(async () => {
        const valid = getValidMoves(gameState.tokens, currentPlayer.color, gameState.diceValue!)
        let newState: GameState
        if (valid.length === 0) {
          newState = { ...gameState, diceValue: null, phase: 'roll', currentPlayerOrder: nextPlayer(gameState) }
        } else {
          const chosen = chooseComputerMove(gameState.tokens, currentPlayer.color, gameState.diceValue!, currentPlayer.difficulty ?? 'normal')
          if (chosen === -1) {
            newState = { ...gameState, diceValue: null, phase: 'roll', currentPlayerOrder: nextPlayer(gameState) }
          } else {
            const result = applyMove(gameState.tokens, currentPlayer.color, chosen, gameState.diceValue!)
            newState = {
              ...gameState,
              tokens: result.tokens,
              diceValue: result.bonusTurn ? gameState.diceValue : null,
              phase: 'roll',
              currentPlayerOrder: result.bonusTurn ? gameState.currentPlayerOrder : nextPlayer(gameState),
            }
          }
        }
        setGameState(newState)
        await persistState(newState)
      }, 700)
    }
  }, [currentPlayer, gameState, isFinished, currentUserId, room.game_players])

  useEffect(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    handleAiTurn()
    return () => { if (aiTimerRef.current) clearTimeout(aiTimerRef.current) }
  }, [handleAiTurn])

  async function handleRoll() {
    if (!isMyTurn || gameState.phase !== 'roll') return
    const value = rollDice()
    // No dice reward until the player has at least one token out of the base
    const hasStarted = gameState.tokens.some(t => t.color === myColor && t.position !== -1)
    if (hasStarted) earnCash(value === 6 ? 600 : value * 10, `🎲 Dice ${value}!`)
    const rolledState = { ...gameState, diceValue: value, phase: 'move' as const }
    setGameState(rolledState)
    await persistState(rolledState)

    if (getValidMoves(gameState.tokens, myColor!, value).length === 0) {
      await new Promise(res => setTimeout(res, 3500))
      const skipState = { ...rolledState, diceValue: null, phase: 'roll' as const, currentPlayerOrder: nextPlayer(gameState) }
      setGameState(skipState)
      await persistState(skipState)
    }
  }

  async function handleSkip() {
    const newState = { ...gameState, diceValue: null, phase: 'roll' as const, currentPlayerOrder: nextPlayer(gameState) }
    setGameState(newState)
    await persistState(newState)
  }

  async function handleLeaveGame() {
    if (!confirm('Leave game? If fewer than 2 players remain, the game will end.')) return
    await leaveRoom(room.id)
    router.push('/home')
  }

  async function handleTokenClick(color: Color, index: number) {
    if (!isMyTurn || gameState.phase !== 'move' || gameState.diceValue === null) return
    const result = applyMove(gameState.tokens, color, index, gameState.diceValue)

    if (color === myColor) {
      if (result.captured) earnCash(1000, '🎯 Capture!')
      const newDone = countDoneTokens(result.tokens, myColor!)
      const oldDone = countDoneTokens(gameState.tokens, myColor!)
      if (newDone > oldDone) earnCash(5000 * (newDone - oldDone), '🏠 Token home!')
    }

    const done = countDoneTokens(result.tokens, color)
    let newPlayers = gameState.players.map(p =>
      p.color === color
        ? { ...p, tokensDone: done, capturesMade: result.captured ? p.capturesMade + 1 : p.capturesMade }
        : p
    )

    const justFinished = done === 4
    const nextRank = newPlayers.filter(p => p.rank != null).length + 1
    if (justFinished) newPlayers = assignRank(newPlayers, color, nextRank)

    const newState: GameState = {
      ...gameState,
      tokens: result.tokens,
      players: newPlayers,
      diceValue: result.bonusTurn ? gameState.diceValue : null,
      phase: 'roll',
      currentPlayerOrder: result.bonusTurn ? gameState.currentPlayerOrder : nextPlayer({ ...gameState, players: newPlayers }),
    }

    const finished = isGameFinished(newState)
    const finalState = finished ? { ...newState, phase: 'finished' as const } : newState

    setGameState(finalState)
    await persistState(finalState)

    if (finished) {
      await supabase.from('game_rooms').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', room.id)
    }
  }

  if (isFinished) {
    const activePlayers = gameState.players.filter(p => p.status === 'active')
    const anyRanked = gameState.players.some(p => p.rank != null)

    const displayOrder = anyRanked
      ? [...gameState.players].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      : [...activePlayers, ...gameState.players.filter(p => p.status === 'forfeited')]

    const winner = displayOrder[0]
    const myPlayer = gameState.players.find(p => p.color === myColor)
    const myRank = anyRanked
      ? (myPlayer?.rank ?? gameState.players.length)
      : (myPlayer?.status === 'active' ? 1 : gameState.players.length)
    const myReward = WIN_REWARDS[Math.min(myRank - 1, WIN_REWARDS.length - 1)]

    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 gap-6">
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl font-black text-amber-900">Game Over!</h2>
        {winner && (
          <p className="text-lg font-bold text-amber-700">
            {winner.color === myColor ? 'You win!' : `${winner.displayName} wins!`}
          </p>
        )}
        {myColor && (
          <div className="bg-green-100 border border-green-300 rounded-2xl px-6 py-3 text-center">
            <div className="text-green-700 font-black text-xl">
              +${(myReward + (myRank === 1 ? pot : 0)).toLocaleString()}
            </div>
            <div className="text-green-600 text-xs">{RANK_LABELS[Math.min(myRank - 1, 3)]} Place Reward{myRank === 1 && pot > 0 ? ` + $${pot.toLocaleString()} Pot` : ''}</div>
          </div>
        )}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow p-4">
          {displayOrder.map((p, i) => (
            <div key={p.color} className="flex items-center gap-3 py-2 border-b border-amber-100 last:border-0">
              <span className="text-xl font-black text-amber-600">
                {p.rank ?? (anyRanked ? '-' : i + 1)}
              </span>
              <span className={`w-4 h-4 rounded-full ${p.color === 'red' ? 'bg-red-500' : p.color === 'blue' ? 'bg-blue-500' : p.color === 'green' ? 'bg-green-500' : 'bg-yellow-400'}`} />
              <span className="font-semibold text-amber-900 flex-1">{p.displayName}</span>
              {p.status === 'forfeited'
                ? <span className="text-xs text-red-400">Left game</span>
                : <span className="text-xs text-amber-500">{p.capturesMade} captures</span>
              }
            </div>
          ))}
        </div>
        <button onClick={() => router.push('/home')} className="px-8 py-3 rounded-2xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-colors">
          Back to Home
        </button>
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

      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white shadow">
        <PlayerAvatar avatarId={currentPlayer.avatarId} isComputer={currentPlayer.isComputer} size="sm" />
        <span className="font-semibold text-amber-900 text-sm">
          {isMyTurn ? 'Your turn' : `${currentPlayer.displayName}'s turn`}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${turnTimer <= 10 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
          {turnTimer}s
        </span>
      </div>

      <BoardScaler>
        <LudoBoard
          tokens={gameState.tokens}
          currentColor={currentPlayer.color}
          validMoves={isMyTurn ? validMoves : []}
          onTokenClick={handleTokenClick}
        />
      </BoardScaler>

      <div className="flex items-center gap-4 bg-white rounded-2xl shadow px-5 py-3 w-full max-w-sm justify-between">
        {/* Live balance + pot */}
        <div className="flex flex-col items-center min-w-[80px]">
          <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wide">Balance</span>
          <span className="text-amber-700 font-black text-base">${balance.toLocaleString()}</span>
          {pot > 0 && (
            <span className="text-[9px] text-green-600 font-black mt-0.5">🏆 POT ${pot.toLocaleString()}</span>
          )}
        </div>

        {/* Dice + action */}
        <div className="flex items-center gap-3">
          {gameState.diceValue !== null && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] text-amber-500 font-semibold">Rolled</span>
              <div className="w-14 h-14 rounded-xl bg-amber-600 text-white flex items-center justify-center text-3xl font-black shadow">
                {gameState.diceValue}
              </div>
            </div>
          )}
          {isMyTurn && gameState.phase === 'roll' && (
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleRoll} className="px-5 py-3 rounded-2xl bg-amber-600 text-white font-black text-base hover:bg-amber-700 active:scale-95 transition-all shadow">
                Roll 🎲
              </button>
              {myColor && gameState.tokens.filter(t => t.color === myColor).every(t => t.position === -1) && (
                <span className="text-[10px] text-amber-400">Roll 1 or 6 to enter the board</span>
              )}
            </div>
          )}
          {isMyTurn && gameState.phase === 'move' && validMoves.length === 0 && (
            <button onClick={handleSkip} className="px-5 py-3 rounded-2xl bg-gray-400 text-white font-bold hover:bg-gray-500 transition-colors">
              Skip
            </button>
          )}
          {!isMyTurn && !currentPlayer.isComputer && (
            <span className="text-amber-500 text-sm animate-pulse">Waiting for {currentPlayer.displayName}…</span>
          )}
          {currentPlayer.isComputer && (
            <span className="text-amber-500 text-sm animate-pulse">🤖 Thinking…</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {gameState.players.map(p => (
          <div key={p.color} className={`flex items-center gap-1.5 px-2 py-1 rounded-2xl text-xs font-semibold border-2 ${p.color === currentPlayer.color ? 'border-amber-600' : 'border-transparent'} ${p.status === 'forfeited' ? 'opacity-40' : ''} ${p.color === 'red' ? 'bg-red-100 text-red-800' : p.color === 'blue' ? 'bg-blue-100 text-blue-800' : p.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <PlayerAvatar avatarId={p.avatarId} isComputer={p.isComputer} size="sm" />
            <span className={p.status === 'forfeited' ? 'line-through' : ''}>{p.displayName}</span>
            <span className="opacity-70">{p.tokensDone}/4</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleLeaveGame}
        className="text-xs text-red-400 hover:text-red-600 underline transition-colors"
      >
        Leave Game
      </button>

      {myColor && (
        <ChatWindow
          roomId={room.id}
          currentUserId={currentUserId}
          displayName={myDisplayName}
          avatarId={players.find(p => p.color === myColor)?.avatarId ?? 1}
        />
      )}
    </div>
  )
}
