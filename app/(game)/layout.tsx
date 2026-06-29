import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('*').eq('id', user.id).single()
    : { data: null }

  const balance: number = (profile as any)?.balance ?? 0

  return (
    <div className="flex flex-col min-h-full">
      <header className="bg-amber-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <Link href="/home" className="text-xl font-black tracking-tight">
          🎲 LudoLudo
        </Link>
        {profile && (
          <div className="flex items-center gap-3">
            <Link href="/shop" className="flex items-center gap-1 bg-amber-700/60 hover:bg-amber-700 px-2.5 py-1 rounded-full transition-colors">
              <span className="text-xs">💰</span>
              <span className="text-xs font-black">${balance.toLocaleString()}</span>
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

      <nav className="bg-white border-t border-amber-200 flex justify-around py-2 px-2">
        <Link href="/home" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🏠</span>
          Home
        </Link>
        <Link href="/shop" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🛍️</span>
          Shop
        </Link>
        <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">🏆</span>
          Rankings
        </Link>
        <Link href="/profile" className="flex flex-col items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">
          <span className="text-xl">👤</span>
          Profile
        </Link>
      </nav>
    </div>
  )
}
