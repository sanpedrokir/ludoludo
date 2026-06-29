'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { signInWithPassword, signInWithOtp, verifyOtp } from '@/lib/actions/auth'

type Mode = 'password' | 'otp-request' | 'otp-verify'

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>('password')
  const [otpEmail, setOtpEmail] = useState('')

  const [passwordState, passwordAction, passwordPending] = useActionState(signInWithPassword, { error: undefined })
  const [otpRequestState, otpRequestAction, otpRequestPending] = useActionState(signInWithOtp, { error: undefined })
  const [otpVerifyState, otpVerifyAction, otpVerifyPending] = useActionState(verifyOtp, { error: undefined })

  return (
    <div>
      <h1 className="text-3xl font-black text-amber-900 mb-1">Welcome Back</h1>
      <p className="text-amber-700 mb-8">Sign in to keep playing.</p>

      {/* Mode tabs */}
      <div className="flex rounded-xl border-2 border-amber-200 mb-6 overflow-hidden">
        <button
          onClick={() => setMode('password')}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            mode === 'password' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setMode('otp-request')}
          className={`flex-1 py-2 text-sm font-semibold transition-colors ${
            mode !== 'password' ? 'bg-amber-600 text-white' : 'text-amber-700 hover:bg-amber-100'
          }`}
        >
          Email OTP
        </button>
      </div>

      {mode === 'password' && (
        <form action={passwordAction} className="flex flex-col gap-4">
          {passwordState?.error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
              {passwordState.error}
            </div>
          )}
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
          <button
            type="submit"
            disabled={passwordPending}
            className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {passwordPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      )}

      {mode === 'otp-request' && (
        <form
          action={async (fd) => {
            setOtpEmail(fd.get('email') as string)
            await otpRequestAction(fd)
            if (!otpRequestState?.error) setMode('otp-verify')
          }}
          className="flex flex-col gap-4"
        >
          {otpRequestState?.error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
              {otpRequestState.error}
            </div>
          )}
          {otpRequestState?.message && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-xl text-green-700 text-sm">
              {otpRequestState.message}
            </div>
          )}
          <input
            name="email"
            type="email"
            required
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300"
          />
          <button
            type="submit"
            disabled={otpRequestPending}
            className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {otpRequestPending ? 'Sending…' : 'Send Login Code'}
          </button>
        </form>
      )}

      {mode === 'otp-verify' && (
        <form action={otpVerifyAction} className="flex flex-col gap-4">
          {otpVerifyState?.error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-xl text-red-700 text-sm">
              {otpVerifyState.error}
            </div>
          )}
          <p className="text-amber-700 text-sm">
            We sent a code to <strong>{otpEmail}</strong>. Enter it below.
          </p>
          <input type="hidden" name="email" value={otpEmail} />
          <input
            name="token"
            type="text"
            required
            maxLength={6}
            placeholder="6-digit code"
            className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder:text-amber-300 text-center text-2xl tracking-widest"
          />
          <button
            type="submit"
            disabled={otpVerifyPending}
            className="w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg hover:bg-amber-700 disabled:opacity-60 transition-colors"
          >
            {otpVerifyPending ? 'Verifying…' : 'Verify Code'}
          </button>
          <button
            type="button"
            onClick={() => setMode('otp-request')}
            className="text-amber-600 text-sm underline text-center"
          >
            Resend code
          </button>
        </form>
      )}

      <p className="text-center text-amber-700 mt-6">
        New to LudoLudo?{' '}
        <Link href="/signup" className="font-bold text-amber-900 underline">
          Create account
        </Link>
      </p>
    </div>
  )
}
