import { useCallback, useEffect, useState } from 'react'
import type { PresentationMode } from './types'

const isInteractive = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(
  target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="button"]'),
)

export function usePresentationNav(count: number, initialMode: PresentationMode = 'browse') {
  const [requestedIndex, setIndex] = useState(0)
  const index = count === 0 ? 0 : Math.max(0, Math.min(count - 1, requestedIndex))
  const [mode, setMode] = useState<PresentationMode>(initialMode)
  const next = useCallback(() => setIndex(Math.min(count - 1, index + 1)), [count, index])
  const prev = useCallback(() => setIndex(Math.max(0, index - 1)), [index])
  const goTo = useCallback((target: number) => setIndex(Math.max(0, Math.min(count - 1, target))), [count])
  const toggleMode = useCallback(() => setMode((current) => current === 'browse' ? 'present' : 'browse'), [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey || isInteractive(event.target)) return
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); next() }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); prev() }
      else if (event.key.toLowerCase() === 'p') toggleMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [next, prev, toggleMode])

  useEffect(() => {
    let startX = 0
    let startY = 0
    const down = (event: TouchEvent) => { startX = event.changedTouches[0]?.clientX ?? 0; startY = event.changedTouches[0]?.clientY ?? 0 }
    const up = (event: TouchEvent) => {
      if (isInteractive(event.target)) return
      const dx = (event.changedTouches[0]?.clientX ?? 0) - startX
      const dy = (event.changedTouches[0]?.clientY ?? 0) - startY
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next()
        else prev()
      }
    }
    window.addEventListener('touchstart', down, { passive: true })
    window.addEventListener('touchend', up, { passive: true })
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchend', up) }
  }, [next, prev])

  return { index, mode, setMode, next, prev, goTo, toggleMode }
}
