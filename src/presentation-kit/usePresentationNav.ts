import { useCallback, useEffect, useRef, useState } from 'react'
import { SWIPE_MIN_PX } from './constants'
import { isInteractive } from './interactive'
import type { Mode } from './types'

const clamp = (value: number, last: number) => Math.min(Math.max(value, 0), last)

/**
 * Step index, mode, and input handling for a presentation of `count` steps.
 * Keys and swipes move one step at a time and clamp at both ends.
 */
export function usePresentationNav(count: number, initialMode: Mode = 'present') {
  const last = Math.max(count - 1, 0)
  const [raw, setIndex] = useState(0)
  const [mode, setMode] = useState<Mode>(initialMode)
  const index = Math.min(raw, last)

  const goTo = useCallback((target: number) => setIndex(clamp(target, last)), [last])
  const next = useCallback(() => setIndex((i) => clamp(i + 1, last)), [last])
  const prev = useCallback(() => setIndex((i) => clamp(i - 1, last)), [last])
  const toggleMode = useCallback(() => setMode((m) => (m === 'present' ? 'browse' : 'present')), [])

  const handlers = useRef({ next, prev, toggleMode })
  useEffect(() => {
    handlers.current = { next, prev, toggleMode }
  }, [next, prev, toggleMode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return
      if (isInteractive(event.target)) return
      // Named keys (ArrowRight, PageDown...) ignore Shift; letter keys such as P do not.
      if (event.shiftKey && event.key.length > 1) return
      const { next: forward, prev: back, toggleMode: toggle } = handlers.current
      let handled = true
      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          forward()
          break
        case 'ArrowLeft':
        case 'PageUp':
          back()
          break
        case 'p':
        case 'P':
          toggle()
          break
        default:
          handled = false
      }
      if (handled) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    let start: { x: number; y: number } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]
      start = touch ? { x: touch.clientX, y: touch.clientY } : null
    }
    const onTouchEnd = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      if (!start || !touch) return
      const dx = touch.clientX - start.x
      const dy = touch.clientY - start.y
      start = null
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return
      if (dx < 0) handlers.current.next()
      else handlers.current.prev()
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return { index, goTo, next, prev, mode, setMode, toggleMode }
}
