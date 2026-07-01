'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  gameId: string
}

export default function RejoinBanner({ gameId }: Props) {
  const pathname = usePathname()
  // Hide when already inside the game room
  if (pathname.startsWith('/game/')) return null

  return (
    <Link
      href={`/game/${gameId}`}
      className="flex items-center gap-3 mx-4 mt-3 px-4 py-2.5 rounded-xl text-white shadow-md"
      style={{ background: '#164e63', border: '1px solid #22d3ee' }}
    >
      <span className="text-base">▶️</span>
      <span className="text-sm font-bold flex-1">Game in progress — tap to rejoin</span>
      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-black tracking-wide">LIVE</span>
    </Link>
  )
}
