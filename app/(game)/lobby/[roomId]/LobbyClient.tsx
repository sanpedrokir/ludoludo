'use client'

import { useEffect, useState, useActionState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startGame, leaveRoom, sendInvitation } from '@/lib/actions/game'
import { Color } from '@/lib/game/types'

const COLOR_CLASS: Record<Color, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-600',
  yellow: 'bg-yellow-400',
}

interface Player {
  id: string
  player_id?: string | null
  color: Color
  is_computer: boolean
  status: string
  profiles?: { display_name: string; avatar_id: number } | null
}

interface Room {
  id: string
  room_code: string
  name: string | null
  host_id: string
  max_players: number
  status: string
  game_players: Player[]
}

interface Props {
  room: Room
  currentUserId: string
  isHost: boolean
  myDisplayName: string
}

export default function LobbyClient({ room, currentUserId, isHost, myDisplayName }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [players, setPlayers] = useState<Player[]>(room.game_players)
  const [showInvite, setShowInvite] = useState(false)
  const [phones, setPhones] = useState(['', '', ''])
  const [inviteState, inviteAction, invitePending] = useActionState(sendInvitation, { error: undefined })
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const channel = supabase
      .channel(`lobby:${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${room.id}` },
        () => {
          // Refetch players on any change
          supabase
            .from('game_players')
            .select('*, profiles(display_name, avatar_id)')
            .eq('room_id', room.id)
            .then(({ data }) => { if (data) setPlayers(data as Player[]) })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${room.id}` },
        (payload) => {
          if (payload.new.status === 'playing') {
            router.push(`/game/${room.id}`)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [room.id, router, supabase])

  async function handleStart() {
    setStarting(true)
    const result = await startGame(room.id)
    if (result?.error) {
      alert(result.error)
      setStarting(false)
    }
  }

  const humanPlayers = players.filter(p => !p.is_computer)
  const canStart = isHost && humanPlayers.length >= 2

  const slots = Array.from({ length: room.max_players }, (_, i) => {
    return players.find(p => !p.is_computer && p.profiles)
      ? players.filter(p => !p.is_computer)[i] ?? null
      : players[i] ?? null
  })

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-amber-900">{room.name ?? 'Game Lobby'}</h2>
          <p className="text-amber-700 text-sm mt-1">
            Code: <span className="font-mono font-black text-amber-900 text-lg tracking-widest">{room.room_code}</span>
          </p>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(room.room_code)}
          className="text-xs text-amber-500 hover:text-amber-700 border border-amber-200 rounded-lg px-2 py-1"
        >
          Copy code
        </button>
      </div>

      {/* Player slots */}
      <div className="flex flex-col gap-2">
        {players.slice(0, room.max_players).map((player, i) => (
          <div key={player.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
            <span className={`w-8 h-8 rounded-full ${COLOR_CLASS[player.color]} flex items-center justify-center text-white text-xs font-bold`}>
              {player.is_computer ? '🤖' : player.profiles?.display_name?.[0]?.toUpperCase() ?? '?'}
            </span>
            <div className="flex-1">
              <div className="font-semibold text-amber-900 text-sm">
                {player.is_computer
                  ? 'Computer Player'
                  : player.profiles?.display_name ?? 'Unknown'}
                {player.profiles && room.host_id === player.player_id && !player.is_computer && (
                  <span className="ml-2 text-xs text-amber-500">(Host)</span>
                )}
              </div>
              <div className="text-xs text-amber-500 capitalize">{player.color}</div>
            </div>
            {player.status === 'active' && <span className="text-green-500 text-xs">●</span>}
          </div>
        ))}
        {Array.from({ length: Math.max(0, room.max_players - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-3 bg-white/50 rounded-xl p-3 border-2 border-dashed border-amber-200">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-400 text-lg">?</span>
            <span className="text-sm text-amber-400">Waiting for player…</span>
          </div>
        ))}
      </div>

      {/* Invite section */}
      {isHost && (
        <div>
          <button
            onClick={() => setShowInvite(v => !v)}
            className="text-sm text-blue-600 font-semibold hover:underline"
          >
            {showInvite ? '▲ Hide invite' : '▼ Invite friends by phone'}
          </button>

          {showInvite && (
            <form action={inviteAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="roomId" value={room.id} />
              <input type="hidden" name="phones" value={phones.filter(Boolean).join(',')} />
              {[0, 1, 2].map(i => (
                <input
                  key={i}
                  type="tel"
                  placeholder={`Friend ${i + 1} phone (+1234567890)`}
                  value={phones[i]}
                  onChange={e => {
                    const updated = [...phones]
                    updated[i] = e.target.value
                    setPhones(updated)
                  }}
                  className="w-full px-3 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-sm text-amber-900"
                />
              ))}
              {inviteState?.error && (
                <p className="text-red-600 text-xs">{inviteState.error}</p>
              )}
              {inviteState?.success && (
                <p className="text-green-600 text-xs">{inviteState.message}</p>
              )}
              <button
                type="submit"
                disabled={invitePending}
                className="py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {invitePending ? 'Sending…' : 'Send Invitations 📱'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isHost && (
          <button
            onClick={handleStart}
            disabled={!canStart || starting}
            className="w-full py-4 rounded-2xl bg-amber-600 text-white font-black text-xl hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {starting ? 'Starting…' : canStart ? 'Start Game 🎲' : `Waiting for players (${humanPlayers.length}/${2} min)`}
          </button>
        )}
        {!isHost && (
          <div className="text-center text-amber-600 font-semibold animate-pulse">
            Waiting for host to start the game…
          </div>
        )}
        <button
          onClick={async () => { await leaveRoom(room.id); router.push('/home') }}
          className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
        >
          Leave Game
        </button>
      </div>
    </div>
  )
}
