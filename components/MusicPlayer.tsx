'use client'

import { useEffect, useRef, useState } from 'react'

const TRACKS = [
  '/music/jazz-1.mp3',
  '/music/jazz-2.mp3',
  '/music/jazz-3.mp3',
  '/music/jazz-4.mp3',
  '/music/jazz-5.mp3',
]

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const startedRef = useRef(false)
  const trackRef = useRef(Math.floor(Math.random() * TRACKS.length))

  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ludoMusicMuted') === 'true'
    }
    return false
  })

  useEffect(() => {
    const audio = new Audio(TRACKS[trackRef.current])
    audio.volume = 0.25
    audioRef.current = audio

    audio.addEventListener('ended', () => {
      trackRef.current = (trackRef.current + 1) % TRACKS.length
      audio.src = TRACKS[trackRef.current]
      if (!muted) audio.play().catch(() => {})
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Start playing on first user interaction
  useEffect(() => {
    if (muted) return

    function tryStart() {
      if (startedRef.current || !audioRef.current) return
      audioRef.current.play().then(() => {
        startedRef.current = true
      }).catch(() => {})
    }

    document.addEventListener('click', tryStart)
    document.addEventListener('touchstart', tryStart)
    return () => {
      document.removeEventListener('click', tryStart)
      document.removeEventListener('touchstart', tryStart)
    }
  }, [muted])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    const next = !muted
    setMuted(next)
    localStorage.setItem('ludoMusicMuted', String(next))
    if (next) {
      audio.pause()
    } else {
      audio.play().then(() => { startedRef.current = true }).catch(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 right-3 z-50 w-10 h-10 rounded-full bg-amber-700/80 text-white shadow-lg flex items-center justify-center text-lg hover:bg-amber-700 transition-colors backdrop-blur-sm"
      title={muted ? 'Enable jazz music' : 'Mute music'}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  )
}
