import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mode } from './constants.ts'
import { actionForKey, actionForSwipe } from './navKeys.ts'
import type { NavAction } from './navKeys.ts'
import { clampIndex } from './steps.ts'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'present'): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  // Steps can shrink while mounted (hot reload), so the exposed index is always in range.
  const index = clampIndex(rawIndex, count)
  const [mode, setMode] = useState<Mode>(initialMode)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'browse' ? 'present' : 'browse')), [])

  const run = useCallback(
    (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    },
    [next, prev, toggleMode],
  )

  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = actionForKey(event)
      if (!action) return
      event.preventDefault()
      run(action)
    }
    const onTouchStart = (event: TouchEvent) => {
      const t = event.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStart.current
      const t = event.changedTouches[0]
      touchStart.current = null
      if (!start || !t) return
      const action = actionForSwipe(t.clientX - start.x, t.clientY - start.y)
      if (action) run(action)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [run])

  return { index, mode, next, prev, goTo, toggleMode }
}
