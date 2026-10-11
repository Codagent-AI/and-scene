import { useCallback, useEffect, useRef, useState } from 'react'
import type { PresentationMode } from './types'

const INTERACTIVE = 'button,a,input,textarea,select,[contenteditable="true"],[role="button"]'

export function usePresentationNav(stepCount: number, initialMode: PresentationMode = 'browse') {
  const [index, setIndex] = useState(0)
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const touchStart = useRef<number | null>(null)
  const last = Math.max(0, stepCount - 1)
  const jumpTo = useCallback((target: number) => setIndex(Math.min(last, Math.max(0, target))), [last])
  const next = useCallback(() => setIndex((current) => Math.min(last, current + 1)), [last])
  const prev = useCallback(() => setIndex((current) => Math.max(0, current - 1)), [])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.target instanceof Element && event.target.closest(INTERACTIVE)) || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  return {
    index, mode, next, prev, jumpTo, toggleMode,
    touchHandlers: {
      onTouchStart: (event: React.TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null },
      onTouchEnd: (event: React.TouchEvent) => {
        if (touchStart.current === null) return
        const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
        if (Math.abs(delta) > 48) (delta < 0 ? next : prev)()
        touchStart.current = null
      },
    },
  }
}
