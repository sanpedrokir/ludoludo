'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { usePusherChannel } from '@/lib/pusher/usePusherChannel'
import { startGame, leaveRoom } from '@/lib/actions/game'
import { Color } from '@/lib/game/types'
import ChatWindow from '@/components/ChatWindow'

const COLOR_CLASS: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-600',
  yellow: 'bg-yellow-400',
}

interface Player {
  id: string
  playerId?: string | null
  color: Color
  isComputer: boolean
  status: string
  profile?: { displayName: string; avatarId: number } | null
}

interface Room {
  id: string
  roomCode: string
  name: string | null
  hostId: string
  maxPlayers: number
  status: string
  stake: number
  gamePlayers: Player[]
}

interface Props {
  room: Room
  currentUserId: string
  isHost: boolean
}

export default function LobbyClient({ room, currentUserId, isHost }: Props) {
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>(room.gamePlayers)
  const [starting, setStarting] = useState(false)
  const [joinNotif, setJoinNotif] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const prevPlayerIdsRef = useRef(new Set(room.gamePlayers.map(p => p.playerId)))

  const onPlayerJoined = useCallback((data: Player[]) => {
    const newPlayer = data.find(p => !p.isComputer && !prevPlayerIdsRef.current.has(p.playerId))
    if (newPlayer) {
      const name = newPlayer.profile?.displayName ?? 'Someone'
      setJoinNotif(`${name} has joined! 🎉`)
      setTimeout(() => setJoinNotif(null), 4000)
    }
    prevPlayerIdsRef.current = new Set(data.map(p => p.playerId))
    setPlayers(data)
  }, [])

  const onPlayerForfeited = useCallback((payload: { playerId: string }) => {
    setPlayers(prev => prev.map(p => p.playerId === payload.playerId ? { ...p, status: 'forfeited' } : p))
  }, [])

  usePusherChannel(`game_players:${room.id}`, [
    { event: 'player-joined', onEvent: onPlayerJoined },
    { event: 'player-forfeited', onEvent: onPlayerForfeited },
  ])

  const onStatusChanged = useCallback((payload: { status: string }) => {
    if (payload.status === 'playing') router.push(`/game/${room.id}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.id])

  usePusherChannel(`game_rooms:${room.id}`, [{ event: 'status-changed', onEvent: onStatusChanged }])

  async function handleStart() {
    setStarting(true)
    const result = await startGame(room.id)
    if (result?.error) {
      alert(result.error)
      setStarting(false)
    }
  }

  function handleShareWhatsApp() {
    const joinUrl = `${window.location.origin}/join?code=${room.roomCode}`
    const text = encodeURIComponent(
      `🎲 Join my LudoLudo game!\nCode: *${room.roomCode}*\nClick to join: ${joinUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function handleCopyLink() {
    const joinUrl = `${window.location.origin}/join?code=${room.roomCode}`
    await navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const humanPlayers = players.filter(p => !p.isComputer)
  const canStart = isHost && humanPlayers.length >= 2
  const pot = (room.stake ?? 0) * humanPlayers.length

  return (
    <div className="px-5 py-6 flex flex-col gap-5 max-w-md mx-auto w-full">
      {/* Join notification */}
      {joinNotif && (
        <div className="bg-green-100 border border-green-300 text-green-800 rounded-2xl p-3 text-sm font-semibold text-center animate-bounce">
          {joinNotif}
        </div>
      )}

      <div>
        <h2 className="text-2xl font-black text-amber-900">{room.name ?? 'Game Lobby'}</h2>
        <p className="text-amber-500 text-sm mt-0.5">
          Code: <span className="font-mono font-black text-amber-900 text-xl tracking-widest">{room.roomCode}</span>
        </p>
      </div>

      {/* Stake pot display */}
      {(room.stake ?? 0) > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-700 rounded-2xl p-4 text-white text-center shadow-md">
          <div className="text-xs font-semibold text-amber-200 uppercase tracking-wider mb-1">💰 Prize Pot</div>
          <div className="text-4xl font-black">${pot.toLocaleString()}</div>
          <div className="text-amber-200 text-xs mt-1">
            {humanPlayers.length} × ${(room.stake ?? 0).toLocaleString()} entry — Winner takes all
          </div>
        </div>
      )}

      {/* Share section */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-3">Invite Friends</div>
        <div className="flex gap-2">
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors"
          >
            <span className="text-lg">📱</span>
            Share via WhatsApp
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2.5 rounded-xl border-2 border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
          >
            {copied ? '✓ Copied' : '🔗'}
          </button>
        </div>
        <p className="text-xs text-amber-400 mt-2">Friends click the link → sign in → pick a colour → they appear here automatically</p>
      </div>

      {/* Player slots */}
      <div className="flex flex-col gap-2">
        {players.slice(0, room.maxPlayers).map((player) => (
          <div key={player.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <span className={`w-9 h-9 rounded-full ${COLOR_CLASS[player.color]} flex items-center justify-center text-white text-sm font-bold`}>
              {player.isComputer ? '🤖' : player.profile?.displayName?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm">
                {player.isComputer
                  ? 'Computer Player'
                  : player.profile?.displayName ?? 'Unknown'}
                {!player.isComputer && player.playerId === room.hostId && (
                  <span className="ml-2 text-xs text-amber-500">(Host)</span>
                )}
              </div>
              <div className="text-xs text-amber-400 capitalize">{player.color}</div>
            </div>
            <span className="text-green-500 text-sm">●</span>
          </div>
        ))}
        {Array.from({ length: Math.max(0, room.maxPlayers - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 bg-white/50 rounded-xl p-3 border-2 border-dashed border-amber-200">
            <span className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-400 text-lg">?</span>
            <span className="text-sm text-amber-400">Waiting for player…</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full py-4 rounded-2xl bg-amber-600 text-white font-black text-xl hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {starting
              ? 'Starting…'
              : canStart
                ? 'Start Game 🎲'
                : `Waiting for players (${humanPlayers.length}/${2} min)`}
          </button>
        ) : (
          <div className="text-center text-amber-600 font-semibold animate-pulse py-3">
            Waiting for host to start the game…
          </div>
        )}
        <button
          onClick={async () => { await leaveRoom(room.id); router.push('/home') }}
          className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
        >
          Leave Lobby
        </button>
      </div>

      <ChatWindow roomId={room.id} currentUserId={currentUserId} />
    </div>
  )
}
