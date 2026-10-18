import { useCallback, useEffect, useRef, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction } from './nav'
import type { Mode } from './types'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode): PresentationNav {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const last = Math.max(count - 1, 0)

  const goTo = useCallback((i: number) => setIndex(clampIndex(i, last + 1)), [last])
  const next = useCallback(() => setIndex((i) => clampIndex(i + 1, last + 1)), [last])
  const prev = useCallback(() => setIndex((i) => clampIndex(i - 1, last + 1)), [last])
  const toggleMode = useCallback(
    () => setMode((m) => (m === 'present' ? 'browse' : 'present')),
    [],
  )

  const handlers = useRef({ next, prev, toggleMode })
  useEffect(() => {
    handlers.current = { next, prev, toggleMode }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isInteractiveTarget(e.target)) return
      const action = keyAction(e.key)
      if (!action) return
      e.preventDefault()
      if (action === 'next') handlers.current.next()
      else if (action === 'prev') handlers.current.prev()
      else handlers.current.toggleMode()
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action) handlers.current[action]()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart)
    window.addEventListener('touchend', onTouchEnd)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return { index: clampIndex(index, last + 1), mode, next, prev, goTo, toggleMode }
}
