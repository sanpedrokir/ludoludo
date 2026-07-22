'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSignIn, useAuth } from '@clerk/nextjs'

function SignInContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  const { signIn, fetchStatus } = useSignIn()
  const { isSignedIn } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // signIn is a reactive signal — reading signIn.status right after an await
  // can observe a stale value, so completion is detected here instead, off
  // the hook's own (always-fresh) render value.
  useEffect(() => {
    if (signIn.status === 'complete') {
      void signIn.finalize({
        navigate: async ({ decorateUrl }) => {
          // Always a hard navigation: Clerk calls this just before the
          // session is actually set, so a soft router.push() here can
          // outrace the cookie write and get bounced by proxy.ts's auth
          // check on the very next request.
          window.location.href = decorateUrl(next || '/home')
        },
      })
    }
  }, [signIn, next])

  // Safety net: if a session becomes active by any path other than the
  // finalize() call above resolving its navigate callback, this still gets
  // the user off the blank/hidden screen instead of leaving them stuck.
  useEffect(() => {
    if (isSignedIn) window.location.href = next || '/home'
  }, [isSignedIn, next])

  async function handleSubmit(formData: FormData) {
    setGlobalError(null)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await signIn.password({ identifier: email, password })
    if (error) {
      setGlobalError(error.longMessage ?? error.message ?? 'Could not sign in.')
    }
  }

  if (isSignedIn) return null

  return (
    <div>
      <h1 className="text-3xl font-black text-amber-900 mb-1">Welcome Back</h1>
      <p className="text-amber-700 mb-8">Sign in to keep playing.</p>

      {globalError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {globalError}
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-4">
        <input
          name="email"
          type="email"
          required
          placeholder="Email address"
          className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
        />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Password"
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
        <button
          type="submit"
          disabled={fetchStatus === 'fetching'}
          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
        >
          {fetchStatus === 'fetching' ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-amber-700 mt-6">
        New to LudoLudo?{' '}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'}
          className="font-bold text-amber-900 underline"
        >
          Create account
        </Link>
      </p>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
