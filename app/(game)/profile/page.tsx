'use client'

import { useEffect, useState, useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/actions/auth'
import Link from 'next/link'
import { AVATARS as BASE_AVATARS } from '@/components/PlayerAvatar'

const AVATARS = [
  ...BASE_AVATARS.slice(0, 12).map((a, i) => ({ ...a, label: ['CEO','Director','Prince','Princess','Mogul','Star','Artist','Elite','Executive','Visionary','Champion','Icon'][i] })),
  { ...BASE_AVATARS[12], label: 'MJ' },
  { ...BASE_AVATARS[13], label: 'Madonna' },
]

interface Profile {
  display_name: string
  avatar_id: number
  games_played: number
  wins: number
  balance?: number
}

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [state, formAction, pending] = useActionState(updateProfile, { error: undefined })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('*').eq('id', user.id).single().then(({ data }) => {
        if (data) {
          setProfile(data as Profile)
          setSelectedAvatar(data.avatar_id ?? 1)
        }
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!profile) {
    return <div className="flex-1 flex items-center justify-center text-amber-500">Loading…</div>
  }

  const winRate = profile.games_played > 0
    ? Math.round((profile.wins / profile.games_played) * 100)
    : 0

  const activeAvatar = AVATARS.find(a => a.id === selectedAvatar) ?? AVATARS[0]
  const balance = (profile as any).balance ?? 0

  return (
    <div className="px-5 py-6 flex flex-col gap-5 max-w-md mx-auto w-full">
      {/* Avatar hero */}
      <div className="flex flex-col items-center gap-3">
        <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${activeAvatar.bg} flex items-center justify-center text-5xl shadow-lg`}>
          {activeAvatar.emoji}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-black text-amber-900">{profile.display_name}</h2>
          <div className="text-amber-500 text-sm font-semibold">{activeAvatar.label}</div>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 px-4 py-1.5 rounded-full">
          <span className="text-sm font-black text-amber-700">💰 ${balance.toLocaleString()}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Played', value: profile.games_played },
          { label: 'Wins', value: profile.wins },
          { label: 'Win Rate', value: `${winRate}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-amber-100">
            <div className="text-2xl font-black text-amber-700">{s.value}</div>
            <div className="text-xs text-amber-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form action={formAction} className="flex flex-col gap-4 bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
        <h3 className="font-bold text-amber-900">Edit Profile</h3>

        {state?.error && <p className="text-red-600 text-sm">{state.error}</p>}
        {state?.success && <p className="text-green-600 text-sm">Profile updated!</p>}

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-1">Display Name</label>
          <input
            name="displayName"
            type="text"
            defaultValue={profile.display_name}
            required
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">Choose Avatar</label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-2xl transition-all ${
                  selectedAvatar === avatar.id
                    ? 'ring-3 ring-amber-500 ring-offset-1 scale-105'
                    : 'hover:scale-105'
                }`}
              >
                <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center text-2xl shadow-sm`}>
                  {avatar.emoji}
                </div>
                <span className="text-[9px] text-amber-600 font-semibold">{avatar.label}</span>
              </button>
            ))}
          </div>
          <input type="hidden" name="avatarId" value={selectedAvatar} />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold hover:bg-amber-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
