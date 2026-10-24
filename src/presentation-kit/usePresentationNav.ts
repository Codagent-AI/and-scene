import { useCallback, useEffect, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from './navigation'
import { DEFAULT_MODE, type Mode } from './constants'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  jump: (index: number) => void
  toggleMode: () => void
}

/** Keyboard, touch, and programmatic navigation; clamps at both ends. */
export function usePresentationNav(count: number, initialMode: Mode = DEFAULT_MODE): PresentationNav {
  const [rawIndex, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = clampIndex(rawIndex, count)

  const jump = useCallback((to: number) => setIndex(clampIndex(to, count)), [count])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, count)), [count])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, count)), [count])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  useEffect(() => {
    const run = (action: 'next' | 'prev' | 'toggle-mode') => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isInteractiveTarget(e.target)) return
      const action = keyAction(e.key)
      if (!action) return
      e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const point = (e: Event) => (e as TouchEvent).changedTouches?.[0]
    const onStart = (e: Event) => {
      const t = point(e)
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onEnd = (e: Event) => {
      const t = point(e)
      const from = start
      start = null
      if (!t || !from) return
      const action = swipeAction(t.clientX - from.x, t.clientY - from.y)
      if (action) run(action)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [next, prev, toggleMode])

  return { index, mode, next, prev, jump, toggleMode }
}
