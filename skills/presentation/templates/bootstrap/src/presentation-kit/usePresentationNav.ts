import { useCallback, useEffect, useReducer, useRef } from 'react'
import { SWIPE_MIN_DISTANCE } from './constants.ts'
import { isInteractiveTarget, keyToAction, navReducer, swipeToAction, type NavAction } from './nav.ts'
import type { Mode } from './types.ts'

export function usePresentationNav(count: number, initialMode: Mode = 'present') {
  const [state, dispatch] = useReducer(
    (s: { index: number; mode: Mode }, a: NavAction) => navReducer(s, a, count),
    { index: 0, mode: initialMode },
  )
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      if (isInteractiveTarget(e.target)) return
      const action = keyToAction(e.key)
      if (!action) return
      e.preventDefault()
      dispatch(action)
    }
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      touchStart.current = t ? { x: t.clientX, y: t.clientY } : null
    }
    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current
      const t = e.changedTouches[0]
      touchStart.current = null
      if (!start || !t || isInteractiveTarget(e.target)) return
      const action = swipeToAction(t.clientX - start.x, t.clientY - start.y, SWIPE_MIN_DISTANCE)
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
  const goto = useCallback((index: number) => dispatch({ type: 'goto', index }), [])
  const toggleMode = useCallback(() => dispatch({ type: 'toggle-mode' }), [])
  return { ...state, next, prev, goto, toggleMode }
}
