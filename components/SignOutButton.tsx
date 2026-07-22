'use client'

import { useClerk } from '@clerk/nextjs'
import { cleanupOnSignOut } from '@/lib/actions/auth'

export default function SignOutButton() {
  const { signOut } = useClerk()

  async function handleSignOut() {
    await cleanupOnSignOut()
    await signOut({ redirectUrl: '/' })
  }

  return (
    <button onClick={handleSignOut} className="text-xs text-amber-200 hover:text-white">
      Sign out
    </button>
  )
}
