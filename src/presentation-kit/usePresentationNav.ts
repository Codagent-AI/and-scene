import { useCallback, useEffect, useState } from 'react'
import { clampIndex, isInteractiveTarget, keyAction, swipeAction, type NavAction } from './navigation'
import type { Mode } from './types'

export interface PresentationNav {
  index: number
  mode: Mode
  next: () => void
  prev: () => void
  goTo: (index: number) => void
  toggleMode: () => void
}

export function usePresentationNav(count: number, initialMode: Mode = 'browse'): PresentationNav {
  const [state, setState] = useState({ index: 0, mode: initialMode })

  const goTo = useCallback(
    (target: number) => setState((s) => ({ ...s, index: clampIndex(target, count) })),
    [count],
  )
  const next = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(s.index + 1, count) })),
    [count],
  )
  const prev = useCallback(
    () => setState((s) => ({ ...s, index: clampIndex(s.index - 1, count) })),
    [count],
  )
  const toggleMode = useCallback(
    () => setState((s) => ({ ...s, mode: s.mode === 'browse' ? 'present' : 'browse' })),
    [],
  )

  useEffect(() => {
    const run = (action: NavAction) => {
      if (action === 'next') next()
      else if (action === 'prev') prev()
      else toggleMode()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const action = keyAction(e)
      if (!action) return
      if (isInteractiveTarget(e.target) || isInteractiveTarget(document.activeElement)) return
      e.preventDefault()
      run(action)
    }
    let start: { x: number; y: number } | null = null
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0] ?? e.changedTouches[0]
      start = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      if (!start || !t) return
      const action = swipeAction(t.clientX - start.x, t.clientY - start.y)
      start = null
      if (action) run(action)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [next, prev, toggleMode])

  return { index: clampIndex(state.index, count), mode: state.mode, next, prev, goTo, toggleMode }
}
