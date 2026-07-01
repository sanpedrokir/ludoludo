'use client'

import { Suspense, useState, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/actions/auth'
import { AVATARS } from '@/components/PlayerAvatar'

function SignUpContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  const [state, formAction, pending] = useActionState(signUp, {})
  const [showPassword, setShowPassword] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)

  const chosen = AVATARS.find(a => a.id === selectedAvatar) ?? AVATARS[0]

  return (
    <div>
      <h1 className="text-3xl font-black text-amber-900 mb-1">Create Account</h1>
      <p className="text-amber-700 mb-8">Join and start playing in seconds.</p>

      {next && (
        <p className="mb-4 text-amber-600 text-sm">
          Create an account to join the game you were invited to!
        </p>
      )}

      {state?.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
        <input type="hidden" name="avatarId" value={selectedAvatar} />

        {/* Avatar picker */}
        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-2">Choose Your Avatar</label>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md flex-shrink-0"
              style={{ background: `linear-gradient(135deg, var(--av-from), var(--av-to))` }}
            >
              {chosen.emoji}
            </div>
            <span className="text-amber-700 text-sm">Your avatar</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {AVATARS.map(avatar => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => setSelectedAvatar(avatar.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                style={{
                  background: `linear-gradient(135deg, #78350f, #b45309)`,
                  outline: selectedAvatar === avatar.id ? '3px solid #f59e0b' : '2px solid transparent',
                  outlineOffset: '2px',
                  opacity: selectedAvatar === avatar.id ? 1 : 0.65,
                  transform: selectedAvatar === avatar.id ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {avatar.emoji}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-1">Display Name</label>
          <input
            name="displayName"
            type="text"
            required
            placeholder="How should we call you?"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-1">Email Address</label>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-amber-800 mb-1">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Choose a password"
              className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors mt-2"
        >
          {pending ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-amber-700 mt-6">
        Already have an account?{' '}
        <Link
          href={next ? `/signin?next=${encodeURIComponent(next)}` : '/signin'}
          className="font-bold text-amber-900 underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpContent />
    </Suspense>
  )
}
