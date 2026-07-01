import Link from 'next/link'
import LudoIcon from '@/components/LudoIcon'

export default function WelcomePage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center px-6 py-16 text-center">
      <div className="mb-10">
        <div className="flex justify-center mb-4">
          <LudoIcon size={96} />
        </div>
        <h1 className="text-5xl font-black text-amber-900 tracking-tight mb-2">LudoLudo</h1>
        <p className="text-amber-700 text-lg">Classic Ludo. Play anywhere. Play together.</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/signup"
          className="block w-full py-3 rounded-2xl bg-amber-600 text-white font-bold text-lg text-center hover:bg-amber-700 transition-colors"
        >
          Create Account
        </Link>
        <Link
          href="/signin"
          className="block w-full py-3 rounded-2xl border-2 border-amber-600 text-amber-700 font-bold text-lg text-center hover:bg-amber-100 transition-colors"
        >
          Sign In
        </Link>
      </div>

      <div className="mt-16 flex gap-6 text-3xl">
        <span className="text-red-500">●</span>
        <span className="text-blue-500">●</span>
        <span className="text-green-500">●</span>
        <span className="text-yellow-500">●</span>
      </div>

      <p className="mt-8 text-xs text-gray-400 italic">By Kiry</p>
    </main>
  )
}
