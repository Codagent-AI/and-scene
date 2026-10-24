import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { isInteractiveTarget, keyAction, navReducer, swipeAction } from './nav.ts'
import type { NavState } from './nav.ts'
import type { Mode } from './types.ts'

export function usePresentationNav(count: number, initialMode: Mode = 'browse') {
  const reducer = useMemo(() => navReducer(count), [count])
  const [state, dispatch] = useReducer(reducer, { index: 0, mode: initialMode } as NavState)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || isInteractiveTarget(e.target)) return
      const action = keyAction(e)
      if (!action) return
      e.preventDefault()
      dispatch(action)
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
      if (action) dispatch(action)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const next = useCallback(() => dispatch({ type: 'next' }), [])
  const prev = useCallback(() => dispatch({ type: 'prev' }), [])
  const goTo = useCallback((index: number) => dispatch({ type: 'goTo', index }), [])
  const toggleMode = useCallback(() => dispatch({ type: 'toggleMode' }), [])
  return { ...state, next, prev, goTo, toggleMode }
}
