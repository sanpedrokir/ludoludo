'use client'

import { Suspense, useState, useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signInWithPassword } from '@/lib/actions/auth'

function SignInContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''

  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(signInWithPassword, { error: undefined })

  return (
    <div>
      <h1 className="text-3xl font-black text-amber-900 mb-1">Welcome Back</h1>
      <p className="text-amber-700 mb-8">Sign in to keep playing.</p>

      {state?.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}
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
          disabled={pending}
          className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Signing in…' : 'Sign In'}
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
