import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse', onStepChange?: (index: number) => void) {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const goTo = useCallback((next: number) => {
    const bounded = Math.max(0, Math.min(Math.max(0, count - 1), next))
    setIndex(bounded)
    onStepChange?.(bounded)
  }, [count, onStepChange])
  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const toggleMode = useCallback(() => setMode(current => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (target?.isContentEditable || (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return
      const isNavigationKey = event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown' || event.key === 'ArrowLeft' || event.key === 'PageUp'
      if (isNavigationKey && target?.closest?.('button, a[href], summary, [role="button"], [role="link"], [role="tab"], [role="slider"]')) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])
  const touchHandlers = {
    onTouchStart: (event: TouchEvent) => { const t = event.touches[0]; touch.current = { x: t.clientX, y: t.clientY } },
    onTouchEnd: (event: TouchEvent) => {
      const start = touch.current; touch.current = null
      if (!start) return
      const t = event.changedTouches[0], dx = t.clientX - start.x, dy = t.clientY - start.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        if (dx < 0) next()
        else prev()
      }
    },
  }
  return { index, mode, goTo, next, prev, toggleMode, touchHandlers }
}
