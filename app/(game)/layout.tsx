import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('display_name, avatar_id').eq('id', user.id).single()
    : { data: null }

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/home" className="text-xl font-black tracking-tight">
          🎲 LudoLudo
        </Link>
        {profile && (
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm font-semibold hover:underline">
              {profile.display_name}
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-xs text-amber-200 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">{children}</main>

      <nav className="bg-white border-t border-amber-200 flex justify-around py-2 px-4">
        <Link href="/home" className="flex flex-col items-center gap-1 text-xs text-amber-700 hover:text-amber-900">
          <span className="text-xl">🏠</span>
          Home
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 text-xs text-amber-700 hover:text-amber-900">
          <span className="text-xl">📋</span>
          History
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-1 text-xs text-amber-700 hover:text-amber-900">
          <span className="text-xl">👤</span>
          Profile
        </Link>
      </nav>
    </div>
  )
}
