'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { AVATARS } from '@/components/PlayerAvatar'

function SignUpContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  const { signUp, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(1)
  const [globalError, setGlobalError] = useState<string | null>(null)
  // Controlled so a failed submit (e.g. weak password) doesn't force
  // retyping the name/email too — React resets uncontrolled form fields
  // after every action, success or failure.
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')

  const chosen = AVATARS.find(a => a.id === selectedAvatar) ?? AVATARS[0]

  // signUp is a reactive signal — reading signUp.status right after an await
  // inside a handler can observe a stale value, so completion is detected
  // here instead, off the hook's own (always-fresh) render value.
  useEffect(() => {
    if (signUp.status === 'complete') {
      void signUp.finalize({
        navigate: async ({ decorateUrl }) => {
          // Always a hard navigation: Clerk calls this just before the
          // session is actually set, so a soft router.push() here can
          // outrace the cookie write and get bounced by proxy.ts's auth
          // check on the very next request.
          window.location.href = decorateUrl(next || '/home')
        },
      })
    }
  }, [signUp, next])

  // Safety net: if a session becomes active by any path other than the
  // finalize() call above resolving its navigate callback, this still gets
  // the user off the blank/hidden screen instead of leaving them stuck.
  useEffect(() => {
    if (isSignedIn) window.location.href = next || '/home'
  }, [isSignedIn, next])

  async function handleSubmit(formData: FormData) {
    setGlobalError(null)
    const password = formData.get('password') as string

    const { error } = await signUp.password({ emailAddress: email, password })
    if (error) {
      setGlobalError(error.longMessage ?? error.message ?? 'Could not create account.')
      return
    }

    await signUp.update({ unsafeMetadata: { display_name: displayName, avatar_id: selectedAvatar } })

    if (signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address')) {
      await signUp.verifications.sendEmailCode()
    }
  }

  async function handleVerify(formData: FormData) {
    setGlobalError(null)
    const code = formData.get('code') as string

    const { error } = await signUp.verifications.verifyEmailCode({ code })
    if (error) {
      setGlobalError(error.longMessage ?? error.message ?? 'Invalid code, please try again.')
    }
  }

  if (signUp.status === 'complete' || isSignedIn) return null

  // Email verification step — shown once Clerk requires it after account creation
  if (signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address')) {
    return (
      <div>
        <h1 className="text-3xl font-black text-amber-900 mb-1">Verify Your Email</h1>
        <p className="text-amber-700 mb-8">We sent a code to your email address.</p>

        {globalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
            {globalError}
          </div>
        )}

        <form action={handleVerify} className="flex flex-col gap-4">
          <input
            name="code"
            type="text"
            required
            placeholder="Verification code"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
          <button
            type="submit"
            disabled={fetchStatus === 'fetching'}
            className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify'}
          </button>
        </form>

        <button
          onClick={() => signUp.verifications.sendEmailCode()}
          className="mt-6 text-center w-full text-amber-700 underline text-sm"
        >
          Resend code
        </button>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-black text-amber-900 mb-1">Create Account</h1>
      <p className="text-amber-700 mb-8">Join and start playing in seconds.</p>

      {next && (
        <p className="mb-4 text-amber-600 text-sm">
          Create an account to join the game you were invited to!
        </p>
      )}

      {globalError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {globalError}
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
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
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
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
            value={email}
            onChange={e => setEmail(e.target.value)}
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
          disabled={fetchStatus === 'fetching'}
          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors mt-2"
        >
          {fetchStatus === 'fetching' ? 'Creating account…' : 'Create Account'}
        </button>

        {/* Required for sign-up flows — Clerk's bot sign-up protection is enabled by default */}
        <div id="clerk-captcha" />
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
