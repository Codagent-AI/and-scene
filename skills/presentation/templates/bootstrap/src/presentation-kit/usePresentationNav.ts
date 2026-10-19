import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './constants'
import { clampIndex } from './steps'
import { keyAction, swipeAction, type Point } from './navigation'

export interface PresentationNav {
  index: number
  mode: PresentationMode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

/** Keyboard, touch and programmatic navigation; clamps at both ends. */
export function usePresentationNav(
  count: number,
  initialMode: PresentationMode = 'browse',
): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const index = clampIndex(rawIndex, count)

  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const goTo = useCallback((target: number) => setIndex(clampIndex(target, count)), [count])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'browse' ? 'present' : 'browse')),
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = keyAction(event)
      if (!action) return
      event.preventDefault()
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    let start: Point | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const from = start
      start = null
      if (!from || !touch) return
      const action = swipeAction(from, { x: touch.clientX, y: touch.clientY })
      if (action === 'next') next()
      else if (action === 'prev') prev()
    }
    const onTouchCancel = () => {
      start = null
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchCancel)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchCancel)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, goTo, toggleMode }
}
