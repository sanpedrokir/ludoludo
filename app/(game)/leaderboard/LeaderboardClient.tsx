'use client'

import { useState } from 'react'
import { AVATARS } from '@/components/PlayerAvatar'

interface Player {
  id: string
  display_name: string
  avatar_id?: number
  wins: number
  games_played: number
  balance: number
}

interface Props {
  currentUserId: string | null
  byWins: Player[]
  byBalance: Player[]
  initialTab?: 'wins' | 'rich'
}

const MEDAL = ['🥇', '🥈', '🥉']

function PlayerRow({ player, rank, isMe, stat }: {
  player: Player
  rank: number
  isMe: boolean
  stat: React.ReactNode
}) {
  const avatar = AVATARS.find(a => a.id === (player.avatar_id ?? 1)) ?? AVATARS[0]
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm ${
      isMe ? 'bg-amber-100 border-2 border-amber-500' : 'bg-white border border-amber-100'
    }`}>
      <div className="w-8 text-center flex-shrink-0">
        {rank < 3
          ? <span className="text-xl">{MEDAL[rank]}</span>
          : <span className="text-sm font-black text-amber-400">{rank + 1}</span>
        }
      </div>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-xl flex-shrink-0`}>
        {avatar.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-bold text-amber-900 truncate text-sm">{player.display_name}</span>
          {isMe && <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">You</span>}
        </div>
        <div className="text-xs text-amber-400">{player.games_played} game{player.games_played !== 1 ? 's' : ''}</div>
      </div>
      <div className="text-right flex-shrink-0">{stat}</div>
    </div>
  )
}

export default function LeaderboardClient({ currentUserId, byWins, byBalance, initialTab = 'wins' }: Props) {
  const [tab, setTab] = useState<'wins' | 'rich'>(initialTab)

  return (
    <div className="px-4 py-6 max-w-md mx-auto w-full">
      <div className="text-center mb-5">
        <h2 className="text-2xl font-black text-amber-900">Leaderboard</h2>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-amber-100 rounded-2xl p-1 mb-5">
        <button
          onClick={() => setTab('wins')}
          className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
            tab === 'wins' ? 'bg-amber-600 text-white shadow' : 'text-amber-700 hover:text-amber-900'
          }`}
        >
          🏆 Rankings
        </button>
        <button
          onClick={() => setTab('rich')}
          className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
            tab === 'rich' ? 'bg-amber-600 text-white shadow' : 'text-amber-700 hover:text-amber-900'
          }`}
        >
          💰 Rich List
        </button>
      </div>

      {tab === 'wins' && (
        <>
          <p className="text-amber-600 text-xs text-center mb-3">Ranked by most wins in online games</p>
          {!byWins.length && (
            <div className="text-center py-12 text-amber-400">
              <p className="font-semibold">No games played yet.</p>
              <p className="text-sm mt-1">Finish an online game to appear here!</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {byWins.map((p, i) => (
              <PlayerRow
                key={p.id}
                player={p}
                rank={i}
                isMe={p.id === currentUserId}
                stat={
                  <div>
                    <div className="text-sm font-black text-amber-700">{p.wins} win{p.wins !== 1 ? 's' : ''}</div>
                    <div className="text-xs text-amber-400">
                      {p.games_played > 0 ? Math.round((p.wins / p.games_played) * 100) : 0}% rate
                    </div>
                  </div>
                }
              />
            ))}
          </div>
          {byWins.length >= 50 && <p className="text-center text-xs text-amber-400 mt-4">Top 50 shown</p>}
        </>
      )}

      {tab === 'rich' && (
        <>
          <p className="text-amber-600 text-xs text-center mb-3">Ranked by total balance earned</p>
          {!byBalance.length && (
            <div className="text-center py-12 text-amber-400">
              <p className="font-semibold">No players yet.</p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {byBalance.map((p, i) => (
              <PlayerRow
                key={p.id}
                player={p}
                rank={i}
                isMe={p.id === currentUserId}
                stat={
                  <div>
                    <div className="text-sm font-black text-green-700">${(p.balance ?? 0).toLocaleString()}</div>
                    <div className="text-xs text-amber-400">{p.wins} win{p.wins !== 1 ? 's' : ''}</div>
                  </div>
                }
              />
            ))}
          </div>
          {byBalance.length >= 50 && <p className="text-center text-xs text-amber-400 mt-4">Top 50 shown</p>}
        </>
      )}
    </div>
  )
}
