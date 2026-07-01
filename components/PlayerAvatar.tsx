export const AVATARS = [
  { id: 1,  emoji: '🤵',  bg: 'from-blue-900 to-blue-600' },
  { id: 2,  emoji: '👩‍💼', bg: 'from-purple-800 to-purple-600' },
  { id: 3,  emoji: '🤴',  bg: 'from-yellow-700 to-amber-500' },
  { id: 4,  emoji: '👸',  bg: 'from-pink-700 to-rose-400' },
  { id: 5,  emoji: '🧔',  bg: 'from-slate-700 to-slate-500' },
  { id: 6,  emoji: '👩‍🎤', bg: 'from-rose-700 to-rose-500' },
  { id: 7,  emoji: '🎭',  bg: 'from-indigo-700 to-indigo-500' },
  { id: 8,  emoji: '💃',  bg: 'from-fuchsia-700 to-fuchsia-500' },
  { id: 9,  emoji: '🧑‍💼', bg: 'from-teal-700 to-teal-500' },
  { id: 10, emoji: '👩‍🚀', bg: 'from-cyan-700 to-cyan-500' },
  { id: 11, emoji: '🏋️', bg: 'from-orange-700 to-orange-500' },
  { id: 12, emoji: '🧕',  bg: 'from-emerald-700 to-emerald-500' },
  { id: 13, emoji: '🎩',  bg: 'from-zinc-900 to-zinc-600' },
  { id: 14, emoji: '👄',  bg: 'from-red-800 to-pink-500' },
]

interface Props {
  avatarId?: number
  isComputer?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function PlayerAvatar({ avatarId, isComputer, size = 'sm' }: Props) {
  const dim = size === 'sm' ? 'w-8 h-8 text-lg' : size === 'lg' ? 'w-14 h-14 text-3xl' : 'w-10 h-10 text-2xl'

  if (isComputer) {
    return (
      <div className={`${dim} rounded-xl bg-gradient-to-br from-slate-600 to-slate-400 flex items-center justify-center shadow-sm flex-shrink-0`}>
        🤖
      </div>
    )
  }

  const avatar = AVATARS.find(a => a.id === (avatarId ?? 1)) ?? AVATARS[0]
  return (
    <div className={`${dim} rounded-xl bg-gradient-to-br ${avatar.bg} flex items-center justify-center shadow-sm flex-shrink-0`}>
      {avatar.emoji}
    </div>
  )
}
