import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import type { PresentationMode } from './types'

const CONTROL_SELECTOR = [
  'button', 'input', 'select', 'textarea', 'a[href]', 'summary', 'video[controls]',
  'audio[controls]', '[contenteditable]:not([contenteditable="false"])', '[role="button"]',
  '[role="textbox"]', '[role="combobox"]', '[role="slider"]', '[role="tab"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')
const SWIPE_THRESHOLD = 36

export function clampStep(index: number, count: number) {
  return Math.max(0, Math.min(index, count - 1))
}

export function usePresentationNav(count: number, initialMode: PresentationMode) {
  const [currentIndex, setIndex] = useState(0)
  const [mode, setMode] = useState(initialMode)
  const touchStart = useRef<{ x: number; y: number; id: number } | null>(null)

  const index = clampStep(currentIndex, count)
  const jump = useCallback((target: number) => setIndex(clampStep(target, count)), [count])
  const move = useCallback((amount: number) => {
    setIndex(previous => clampStep(clampStep(previous, count) + amount, count))
  }, [count])
  const toggleMode = useCallback(() => {
    setMode(previous => previous === 'browse' ? 'present' : 'browse')
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
        (target instanceof Element && target.closest(CONTROL_SELECTOR))) return

      switch (event.key) {
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          move(1)
          break
        case 'ArrowLeft':
        case 'PageUp':
          move(-1)
          break
        case 'P':
        case 'p':
          if (event.repeat) return
          toggleMode()
          break
        default:
          return
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [move, toggleMode])

  function onTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches.length === 1 ? event.touches[0] : undefined
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY, id: touch.identifier } : null
  }

  function onTouchEnd(event: TouchEvent<HTMLElement>) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const touch = Array.from(event.changedTouches).find(item => item.identifier === start.id)
    if (!touch) return
    const x = touch.clientX - start.x
    const y = touch.clientY - start.y
    if (Math.abs(x) >= SWIPE_THRESHOLD && Math.abs(x) > Math.abs(y)) move(x < 0 ? 1 : -1)
  }

  function onTouchCancel() {
    touchStart.current = null
  }

  return {
    index, mode, jump, toggleMode,
    next: () => move(1),
    previous: () => move(-1),
    touchHandlers: { onTouchStart, onTouchEnd, onTouchCancel },
  }
}
