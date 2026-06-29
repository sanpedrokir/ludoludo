'use client'

import { useRef, useState, useEffect } from 'react'

const BOARD_SIZE = 600

export default function BoardScaler({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      setScale(Math.min(1, el.clientWidth / BOARD_SIZE))
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        maxWidth: BOARD_SIZE,
        height: BOARD_SIZE * scale,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: BOARD_SIZE,
          height: BOARD_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}
