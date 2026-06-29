'use client'

import { useEffect, useState, useActionState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateProfile } from '@/lib/actions/auth'

const AVATARS = ['🦁', '🐯', '🐻', '🦊', '🐺', '🐸', '🐧', '🦅']

interface Profile {
  display_name: string
  phone_number: string | null
  avatar_id: number
  games_played: number
  wins: number
  losses: number
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
          setProfile(data)
          setSelectedAvatar(data.avatar_id ?? 1)
        }
      })
    })
  }, [supabase])

  if (!profile) {
    return <div className="flex-1 flex items-center justify-center text-amber-500">Loading…</div>
  }

  const winRate = profile.games_played > 0
    ? Math.round((profile.wins / profile.games_played) * 100)
    : 0

  return (
    <div className="px-6 py-8 flex flex-col gap-6 max-w-md mx-auto w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="text-6xl">{AVATARS[selectedAvatar - 1]}</div>
        <h2 className="text-2xl font-black text-amber-900">{profile.display_name}</h2>
        {profile.phone_number && (
          <p className="text-amber-500 text-sm">📱 {profile.phone_number.replace(/(\+\d{1,3})\d+(\d{4})/, '$1••••••$2')}</p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Played', value: profile.games_played },
          { label: 'Wins', value: profile.wins },
          { label: 'Win Rate', value: `${winRate}%` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-2xl font-black text-amber-700">{s.value}</div>
            <div className="text-xs text-amber-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form action={formAction} className="flex flex-col gap-4 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-amber-900">Edit Profile</h3>

        {state?.error && (
          <p className="text-red-600 text-sm">{state.error}</p>
        )}
        {state?.success && (
          <p className="text-green-600 text-sm">Profile updated!</p>
        )}

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
          <label className="block text-sm font-semibold text-amber-800 mb-2">Avatar</label>
          <div className="grid grid-cols-4 gap-2">
            {AVATARS.map((avatar, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedAvatar(i + 1)}
                className={`text-3xl p-2 rounded-xl border-2 transition-colors ${selectedAvatar === i + 1 ? 'border-amber-500 bg-amber-50' : 'border-transparent hover:border-amber-200'}`}
              >
                {avatar}
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
